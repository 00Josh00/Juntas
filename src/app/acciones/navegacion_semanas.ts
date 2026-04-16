'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function avanzarSemanaDashboard(juntaId: number, numeroSemanaActual: number) {
  const supabase = await createClient()

  // Avanzar significa cerrar la semana que actualmente se muestra como la "actual"
  const { error } = await supabase
    .from('semanas_junta')
    .update({ cerrada: true })
    .eq('junta_id', juntaId)
    .eq('numero_semana', numeroSemanaActual)

  if (error) {
    console.error('Error al avanzar semana:', error)
    return { error: 'No se pudo avanzar' }
  }

  revalidatePath(`/juntas/${juntaId}`)
  return { success: true }
}

export async function retrocederSemanaDashboard(juntaId: number, numeroSemanaActual: number) {
  const supabase = await createClient()

  // Retroceder significa abrir la semana anterior a la que actualmente se muestra
  if (numeroSemanaActual <= 1) return { error: 'Ya estás en la primera semana' }

  const { error } = await supabase
    .from('semanas_junta')
    .update({ cerrada: false })
    .eq('junta_id', juntaId)
    .eq('numero_semana', numeroSemanaActual - 1)

  if (error) {
    console.error('Error al retroceder semana:', error)
    return { error: 'No se pudo retroceder' }
  }

  revalidatePath(`/juntas/${juntaId}`)
  return { success: true }
}
