'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addJunta(formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const total_semanas = parseInt(formData.get('total_semanas') as string, 10)
  const monto_por_opcion = parseFloat(formData.get('monto_por_opcion') as string)
  const fecha_inicio = formData.get('fecha_inicio') as string
  const descripcion = formData.get('descripcion') as string

  const { data, error } = await supabase.from('juntas').insert({
    nombre,
    total_semanas,
    monto_por_opcion,
    fecha_inicio: fecha_inicio || null,
    descripcion: descripcion || null,
    estado: 'configuracion'
  }).select().single()

  if (error) {
    console.error('Error al insertar junta:', error)
  }

  revalidatePath('/juntas')
  redirect('/juntas')
}
