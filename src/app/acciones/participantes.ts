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
    // Se puede implementar un manejo de errores más avanzado que devuelva el string al cliente.
  }

  revalidatePath('/participantes')
  redirect('/participantes')
}
