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
    return
  }

  // 2. Generar semanas llamando a la función RPC de la BD
  const { error: errorRpc } = await supabase.rpc('generar_semanas_junta', { p_junta_id: juntaId })

  if (errorRpc) {
    console.error('Error al generar semanas:', errorRpc)
    return
  }

  revalidatePath(`/juntas/${juntaId}`)
  revalidatePath('/juntas')
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
