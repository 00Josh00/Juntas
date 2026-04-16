import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import { Briefcase, ArrowLeft, Banknote } from 'lucide-react'
import { addPrestamo } from '@/app/acciones/prestamos'
import { CalculadoraPrestamo } from './CalculadoraPrestamo'

// Prefill de la junta si viene desde el panel de la junta
export default async function NuevoPrestamoPage({
  searchParams,
}: {
  searchParams: Promise<{ junta?: string }>
}) {
  const supabase = await createClient()
  const sp = await searchParams
  const prefilledJuntaId = sp.junta ? parseInt(sp.junta, 10) : null

  // Solo juntas activas (no en configuración)
  const { data: juntas } = await supabase
    .from('juntas')
    .select('id, nombre')
    .eq('estado', 'activa')

  // Si viene una junta prefiltrada, sólo mostrar participantes de esa junta 
  let participantes: { id: number; nombre: string; apellido: string }[] = []
  let semanaActualId: number | null = null

  let dineroEnCaja = 0

  if (prefilledJuntaId) {
    // 1. Participantes de esa junta
    const { data: opciones } = await supabase
      .from('opciones_participante')
      .select('participante_id, participantes(id, nombre, apellido)')
      .eq('junta_id', prefilledJuntaId)
      .eq('activo', true)

    participantes = (opciones || []).flatMap(o =>
      o.participantes ? [(o.participantes as unknown) as { id: number; nombre: string; apellido: string }] : []
    )

    // 2. Determinar la semana de emisión AUTOMÁTICA
    const { data: semanasRaw } = await supabase
      .from('semanas_junta')
      .select('id, numero_semana, cerrada')
      .eq('junta_id', prefilledJuntaId)
      .order('numero_semana', { ascending: true })

    const actual = (semanasRaw || []).find(s => !s.cerrada) || (semanasRaw || [])[(semanasRaw?.length || 1) - 1]
    semanaActualId = actual?.id || null

    // 3. Calcular dinero disponible en caja (Misma lógica del dashboard)
    const { data: pagosData } = await supabase.from('pagos_semanales').select('monto_pagado, semanas_junta!inner(junta_id)').eq('semanas_junta.junta_id', prefilledJuntaId).eq('estado', 'pagado')
    const { data: prestamosData } = await supabase.from('prestamos').select('monto_principal').eq('junta_id', prefilledJuntaId)
    const { data: cuotasData } = await supabase.from('cuotas_prestamo').select('monto_pagado, prestamos!inner(junta_id)').eq('prestamos.junta_id', prefilledJuntaId).eq('estado', 'pagada')

    const ahorros = pagosData?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0
    const prestado = prestamosData?.reduce((a, b) => a + Number(b.monto_principal), 0) || 0
    const cuotas = cuotasData?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0
    dineroEnCaja = ahorros + cuotas - prestado
  } else {
    // Si no hay junta prefiltrada, mostrar todos los participantes activos
    const { data } = await supabase
      .from('participantes')
      .select('id, nombre, apellido')
      .eq('activo', true)
    participantes = (data || []) as { id: number; nombre: string; apellido: string }[]
  }

  const backHref = prefilledJuntaId ? `/juntas/${prefilledJuntaId}/prestamos` : '/juntas'

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* HEADER PROFESSIONAL */}
      <div className="bg-white border-b border-border px-4 py-8 mb-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3 truncate">
              <Banknote className="h-8 w-8 text-indigo-600" />
              Nuevo Préstamo
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Asignación de créditos internos del grupo</p>
          </div>
          <Link
            href={backHref}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-600 active:scale-95 text-xs flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Cancelar
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl border border-border p-6 sm:p-10 shadow-premium">
          <form action={async (formData) => {
            'use server'
            await addPrestamo(formData)
          }} className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* JUNTA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                  Grupo de Ahorro <span className="text-rose-500">*</span>
                </label>
                <select
                  name="junta_id"
                  required
                  defaultValue={prefilledJuntaId?.toString() ?? ''}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Seleccionar Grupo</option>
                  {(juntas || []).map(j => (
                    <option key={j.id} value={j.id}>{j.nombre}</option>
                  ))}
                </select>
              </div>

              {/* PARTICIPANTE */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                  Socio Beneficiario <span className="text-rose-500">*</span>
                </label>
                <select
                  name="participante_id"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">— Seleccionar —</option>
                  {participantes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CALCULADORA DE PRESTAMO */}
            <CalculadoraPrestamo disponible={dineroEnCaja} />


            {/* SEMANA DE EMISION (HIDDEN / AUTOMATIC) */}
            {semanaActualId && (
              <input type="hidden" name="semana_inicio_id" value={semanaActualId} />
            )}

            {/* ACTIONS */}
            <div className="pt-8 border-t border-slate-100">
              <SubmitButton className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-premium active:scale-95 uppercase tracking-widest">
                Confirmar y Registrar Préstamo
              </SubmitButton>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[11px] text-amber-800 font-bold leading-relaxed">
              ⚡ CONFIGURACIÓN AUTOMÁTICA: El préstamo será asignado a la semana actual y la primera cuota se generará para el cobro de la semana siguiente.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
