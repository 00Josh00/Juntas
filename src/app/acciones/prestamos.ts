'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addPrestamo(formData: FormData) {
  const supabase = await createClient()

  const junta_id = parseInt(formData.get('junta_id') as string, 10)
  const participante_id = parseInt(formData.get('participante_id') as string, 10)
  const semana_inicio_id = parseInt(formData.get('semana_inicio_id') as string, 10)
  const monto_principal = parseFloat(formData.get('monto_principal') as string)
  const tasa_interes = parseFloat(formData.get('tasa_interes') as string)
  const total_cuotas = parseInt(formData.get('total_cuotas') as string, 10)

  // 1. Llamar al procedimiento almacenado para crear el préstamo y sus cuotas base
  const { data: resPrestamo, error } = await supabase.rpc('crear_prestamo', {
    p_junta_id: junta_id,
    p_participante_id: participante_id,
    p_semana_inicio_id: semana_inicio_id,
    p_monto: monto_principal,
    p_tasa: tasa_interes,
    p_cuotas: total_cuotas
  })

  if (error) {
    console.error('Error al insertar prestamo:', error)
    return { error: 'Error al procesar el préstamo' }
  }

  // Obtenemos el ID del préstamo recién creado (el RPC devuelve el ID)
  const prestamoId = resPrestamo;

  // 2. ACTUALIZAR PAGOS SEMANALES FUTUROS (REGLA SOLICITADA)
  // Necesitamos encontrar las semanas siguientes para asignar las cuotas
  const { data: semanas } = await supabase
    .from('semanas_junta')
    .select('id, numero_semana')
    .eq('junta_id', junta_id)
    .order('numero_semana', { ascending: true })

  const { data: inicio } = await supabase
    .from('semanas_junta')
    .select('numero_semana')
    .eq('id', semana_inicio_id)
    .single()

  if (semanas && inicio && prestamoId) {
    const startNum = inicio.numero_semana
    const cuotasSiguientes = semanas.filter(s => s.numero_semana > startNum).slice(0, total_cuotas)
    
    const { data: cuotas } = await supabase
      .from('cuotas_prestamo')
      .select('id, numero_cuota, monto_cuota')
      .eq('prestamo_id', prestamoId)
      .order('numero_cuota', { ascending: true })

    if (cuotas) {
      for (let i = 0; i < cuotas.length; i++) {
        const cuota = cuotas[i]
        const semanaTarget = cuotasSiguientes[i]
        
        if (semanaTarget) {
          // A. Vincular la cuota a la semana correspondiente
          await supabase
            .from('cuotas_prestamo')
            .update({ semana_junta_id: semanaTarget.id })
            .eq('id', cuota.id)

          // B. Actualizar el monto_esperado del pago semanal (opcion + cuota)
          const { data: pagoExistente } = await supabase
            .from('pagos_semanales')
            .select('monto_esperado')
            .match({ semana_junta_id: semanaTarget.id, participante_id })
            .single()

          if (pagoExistente) {
             const nuevoMonto = Number(pagoExistente.monto_esperado) + Number(cuota.monto_cuota)
             await supabase
               .from('pagos_semanales')
               .update({ monto_esperado: nuevoMonto })
               .match({ semana_junta_id: semanaTarget.id, participante_id })
          }
        }
      }
    }
  }

  revalidatePath('/prestamos')
  revalidatePath(`/juntas/${junta_id}`)
  redirect(`/juntas/${junta_id}`)
}

export async function registrarCuota(cuotaId: number, montoPagado: number, semanaId?: number) {
  const supabase = await createClient()

  // Llama a la funcion de la BD pagar_cuota
  const { error } = await supabase.rpc('pagar_cuota', {
    p_cuota_id: cuotaId,
    p_monto_pagado: montoPagado
  })

  // Vincular la cuota cobrada a esta semana específica para reportes detallados (redundante ahora pero seguro)
  if (!error && semanaId) {
    await supabase
      .from('cuotas_prestamo')
      .update({ semana_junta_id: semanaId })
      .eq('id', cuotaId)
  }

  if (error) console.error('Error pagando cuota:', error)

  revalidatePath('/prestamos')
}

export async function deletePrestamo(prestamoId: number) {
  const supabase = await createClient()

  // 1. Verificar que no tenga cuotas pagadas
  const { data: prestamo } = await supabase
    .from('prestamos')
    .select('id, junta_id, participante_id, cuotas_pagadas')
    .eq('id', prestamoId)
    .single()

  if (!prestamo || prestamo.cuotas_pagadas > 0) {
    return { error: 'No se puede eliminar un préstamo con cuotas pagadas.' }
  }

  // 2. Antes de eliminar, RESTAR el monto de las cuotas de los pagos semanales proyectados
  const { data: cuotas } = await supabase
    .from('cuotas_prestamo')
    .select('semana_junta_id, monto_cuota')
    .eq('prestamo_id', prestamoId)
    .not('semana_junta_id', 'is', null)

  if (cuotas) {
    for (const c of cuotas) {
      const { data: pago } = await supabase
        .from('pagos_semanales')
        .select('monto_esperado')
        .match({ semana_junta_id: c.semana_junta_id, participante_id: prestamo.participante_id })
        .single()
      
      if (pago) {
        const nuevoMonto = Math.max(0, Number(pago.monto_esperado) - Number(c.monto_cuota))
        await supabase
          .from('pagos_semanales')
          .update({ monto_esperado: nuevoMonto })
          .match({ semana_junta_id: c.semana_junta_id, participante_id: prestamo.participante_id })
      }
    }
  }

  // 3. Eliminar (las cuotas se eliminarán por CASCADE en la base de datos)
  const { error } = await supabase
    .from('prestamos')
    .delete()
    .eq('id', prestamoId)

  if (error) {
    console.error('Error eliminando préstamo:', error)
    return { error: 'Error al intentar eliminar el préstamo.' }
  }

  revalidatePath('/prestamos')
  revalidatePath(`/juntas/${prestamo.junta_id}`)
  return { success: true }
}
