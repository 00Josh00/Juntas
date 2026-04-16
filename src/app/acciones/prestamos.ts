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

  // Llamar al procedimiento almacenado de la BD
  const { error } = await supabase.rpc('crear_prestamo', {
    p_junta_id: junta_id,
    p_participante_id: participante_id,
    p_semana_inicio_id: semana_inicio_id,
    p_monto: monto_principal,
    p_tasa: tasa_interes,
    p_cuotas: total_cuotas
  })

  if (error) {
    console.error('Error al insertar prestamo:', error)
    // Puede manejarse un error devuelto al cliente
  }

  revalidatePath('/prestamos')
  redirect('/prestamos')
}

export async function registrarCuota(cuotaId: number, montoPagado: number) {
  const supabase = await createClient()

  // Llama a la funcion de la BD pagar_cuota
  const { error } = await supabase.rpc('pagar_cuota', {
    p_cuota_id: cuotaId,
    p_monto_pagado: montoPagado
  })

  if (error) console.error('Error pagando cuota:', error)

  revalidatePath('/prestamos')
}
