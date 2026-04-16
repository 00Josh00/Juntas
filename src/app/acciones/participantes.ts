'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addParticipante(formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string
  const telefono = formData.get('telefono') as string
  const email = formData.get('email') as string
  const dni = formData.get('dni') as string

  const { error } = await supabase.from('participantes').insert({
    nombre,
    apellido,
    telefono: telefono || null,
    email: email || null,
    dni: dni || null,
    activo: true,
  })

  if (error) {
    console.error('Error al insertar participante:', error)
  }

  revalidatePath('/participantes')
  redirect('/participantes')
}

export async function updateParticipante(formData: FormData) {
  const supabase = await createClient()
  const id = parseInt(formData.get('id') as string)
  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string
  const telefono = formData.get('telefono') as string
  const email = formData.get('email') as string
  const dni = formData.get('dni') as string
  const activo = formData.get('activo') === 'on'

  const { error } = await supabase.from('participantes').update({
    nombre,
    apellido,
    telefono: telefono || null,
    email: email || null,
    dni: dni || null,
    activo
  }).eq('id', id)

  if (error) {
    console.error('Error al actualizar participante:', error)
    return { error: error.message }
  }

  revalidatePath('/participantes')
  return { success: true }
}

export async function deleteParticipante(id: number) {
  const supabase = await createClient()
  
  // Nota: Si el participante tiene registros en juntas, el borrado fallará por integridad referencial 
  // (lo cual es bueno). En ese caso se debería inactivar en lugar de borrar.
  const { error } = await supabase.from('participantes').delete().eq('id', id)

  if (error) {
    console.error('Error al eliminar participante:', error)
    return { error: 'No se puede eliminar un socio con historial activo. Intenta inactivarlo.' }
  }

  revalidatePath('/participantes')
  return { success: true }
}
