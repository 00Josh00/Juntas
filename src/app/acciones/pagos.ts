'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generarPagos(semanaId: number, juntaId: number) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('generar_pagos_semana', { p_semana_id: semanaId })

  if (error) {
    console.error('Error generando pagos:', error)
    return
  }

  revalidatePath(`/juntas/${juntaId}/semanas/${semanaId}`)
}

export async function registrarPago(pagoId: number, montoEsperado: number, juntaId: number, semanaId: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pagos_semanales')
    .update({ 
      monto_pagado: montoEsperado, 
      estado: 'pagado', 
      fecha_pago: new Date().toISOString().split('T')[0] 
    })
    .eq('id', pagoId)

  if (error) {
    console.error('Error registrando pago:', error)
    return
  }

  revalidatePath(`/juntas/${juntaId}/semanas/${semanaId}`)
}

export async function revertirPago(pagoId: number, juntaId: number, semanaId: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pagos_semanales')
    .update({ 
      monto_pagado: 0, 
      estado: 'pendiente', 
      fecha_pago: null 
    })
    .eq('id', pagoId)

  if (error) {
    console.error('Error revirtiendo pago:', error)
    return
  }

  revalidatePath(`/juntas/${juntaId}/semanas/${semanaId}`)
}

export async function toggleCerrarSemana(semanaId: number, currentEstado: boolean, juntaId: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('semanas_junta')
    .update({ cerrada: !currentEstado })
    .eq('id', semanaId)

  if (error) {
    console.error('Error actualizando semana:', error)
    return
  }

  revalidatePath(`/juntas/${juntaId}`)
  revalidatePath(`/juntas/${juntaId}/semanas/${semanaId}`)
}

export async function marcarTodoComoPagado(semanaId: number, juntaId: number) {
  const supabase = await createClient()

  const { data: pendientes } = await supabase
    .from('pagos_semanales')
    .select('id, monto_esperado')
    .eq('semana_junta_id', semanaId)
    .eq('estado', 'pendiente')

  if (pendientes && pendientes.length > 0) {
    const today = new Date().toISOString().split('T')[0]
    for (const p of pendientes) {
      await supabase
        .from('pagos_semanales')
        .update({ 
          estado: 'pagado', 
          monto_pagado: p.monto_esperado, 
          fecha_pago: today 
        })
        .eq('id', p.id)
    }
  }

  revalidatePath(`/juntas/${juntaId}/semanas/${semanaId}`)
}

export async function marcarTodoComoPendiente(semanaId: number, juntaId: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pagos_semanales')
    .update({ 
      estado: 'pendiente', 
      monto_pagado: 0, 
      fecha_pago: null 
    })
    .eq('semana_junta_id', semanaId)

  revalidatePath(`/juntas/${juntaId}/semanas/${semanaId}`)
}
