'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function activarJunta(juntaId: number) {
  const supabase = await createClient()

  // 1. Cambiar estado a 'activa'
  const { error: errorUpdate } = await supabase
    .from('juntas')
    .update({ estado: 'activa' })
    .eq('id', juntaId)

  if (errorUpdate) {
    console.error('Error al activar junta:', errorUpdate)
    return { error: 'No se pudo activar la junta' }
  }

  // 2. Generar semanas llamando a la función RPC de la BD
  const { error: errorRpcSem } = await supabase.rpc('generar_semanas_junta', { p_junta_id: juntaId })
  if (errorRpcSem) {
    console.error('Error al generar semanas:', errorRpcSem)
    return { error: 'Error generando cronograma' }
  }

  // 3. GENERAR TODOS LOS PAGOS AUTOMÁTICAMENTE (NUEVA REGLA)
  // Obtenemos las semanas creadas
  const { data: semanas } = await supabase
    .from('semanas_junta')
    .select('id')
    .eq('junta_id', juntaId)
  
  // Obtenemos los participantes y sus opciones
  const { data: opciones } = await supabase
    .from('opciones_participante')
    .select('participante_id, cantidad_opciones')
    .eq('junta_id', juntaId)
    .eq('activo', true)
  
  // Obtenemos el monto por opcion de la junta
  const { data: junta } = await supabase
    .from('juntas')
    .select('monto_por_opcion')
    .eq('id', juntaId)
    .single()

  if (semanas && opciones && junta) {
    const pagosToInsert = []
    for (const semana of semanas) {
      for (const op of opciones) {
        pagosToInsert.push({
          semana_junta_id: semana.id,
          participante_id: op.participante_id,
          opciones_cantidad: op.cantidad_opciones,
          monto_esperado: op.cantidad_opciones * Number(junta.monto_por_opcion),
          estado: 'pendiente'
        })
      }
    }

    // Insertar en masa (Supabase insert acepta array)
    const { error: errorPagos } = await supabase
      .from('pagos_semanales')
      .insert(pagosToInsert)
    
    if (errorPagos) {
      console.error('Error pre-generando pagos:', errorPagos)
    }
  }

  revalidatePath(`/juntas/${juntaId}`)
  revalidatePath('/juntas')
  return { success: true }
}

export async function agregarParticipanteAJunta(formData: FormData) {
  const supabase = await createClient()
  
  const junta_id = parseInt(formData.get('junta_id') as string, 10)
  const participante_id = parseInt(formData.get('participante_id') as string, 10)
  const cantidad_opciones = parseInt(formData.get('cantidad_opciones') as string, 10)

  const { error } = await supabase.from('opciones_participante').insert({
    junta_id,
    participante_id,
    cantidad_opciones,
    activo: true
  })

  if (error) {
    console.error('Error al agregar participante a la junta:', error)
    return
  }

  revalidatePath(`/juntas/${junta_id}`)
}

export async function removerParticipanteDeJunta(juntaId: number, participanteId: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('opciones_participante')
    .delete()
    .match({ junta_id: juntaId, participante_id: participanteId })

  if (error) {
    console.error('Error al quitar participante:', error)
  }

  revalidatePath(`/juntas/${juntaId}`)
}
