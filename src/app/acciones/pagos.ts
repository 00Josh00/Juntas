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
