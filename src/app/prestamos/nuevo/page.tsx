import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import { Briefcase, ArrowLeft } from 'lucide-react'
import { addPrestamo } from '@/app/acciones/prestamos'

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

    // 2. Determinar la semana de emisión AUTOMÁTICA (la actual abierta)
    const { data: semanasRaw } = await supabase
      .from('semanas_junta')
      .select('id, numero_semana, cerrada')
      .eq('junta_id', prefilledJuntaId)
      .order('numero_semana', { ascending: true })

    const actual = (semanasRaw || []).find(s => !s.cerrada) || (semanasRaw || [])[(semanasRaw?.length || 1) - 1]
    semanaActualId = actual?.id || null
  } else {
    // Si no hay junta prefiltrada, mostrar todos los participantes activos
    const { data } = await supabase
      .from('participantes')
      .select('id, nombre, apellido')
      .eq('activo', true)
    participantes = (data || []) as { id: number; nombre: string; apellido: string }[]
  }

  const backHref = prefilledJuntaId ? `/juntas/${prefilledJuntaId}` : '/prestamos'

  return (
    <div className="min-h-screen bg-background">
      {/* TOP NAV MOBILE */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href={backHref} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Registrar Préstamo</h1>
          {prefilledJuntaId && (
            <p className="text-xs text-muted-foreground">Solo miembros de esta junta</p>
          )}
        </div>
      </div>

      <div className="p-4 pb-24 max-w-xl mx-auto space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-5">
          <form action={addPrestamo} className="space-y-5">
            {/* JUNTA */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground block">
                Junta Asociada <span className="text-destructive">*</span>
              </label>
              <select
                name="junta_id"
                required
                defaultValue={prefilledJuntaId?.toString() ?? ''}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecciona una Junta</option>
                {(juntas || []).map(j => (
                  <option key={j.id} value={j.id}>{j.nombre}</option>
                ))}
              </select>
            </div>

            {/* PARTICIPANTE */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground block">
                Participante <span className="text-destructive">*</span>
              </label>
              <select
                name="participante_id"
                required
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">— Beneficiario —</option>
                {participantes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
            </div>

            {/* SEMANA DE EMISION (HIDDEN / AUTOMATIC) */}
            {semanaActualId ? (
              <input type="hidden" name="semana_inicio_id" value={semanaActualId} />
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">
                  Semana de Emisión (Manual) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="semana_inicio_id"
                  required
                  placeholder="ID de semana"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {/* MONTO */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground block">
                Monto Solicitado <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">S/</span>
                <input
                  type="number"
                  name="monto_principal"
                  required
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* TASA E CUOTAS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">
                  Tasa de Interés (%) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="tasa_interes"
                  required
                  step="0.01"
                  min="0"
                  defaultValue="10"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground block">
                  N° Cuotas <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  name="total_cuotas"
                  required
                  min="1"
                  defaultValue="4"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="pt-4 flex flex-col gap-3">
              <SubmitButton className="w-full">Confirmar Préstamo</SubmitButton>
              <Link
                href={backHref}
                className="w-full text-center px-6 py-3 border border-border text-foreground hover:bg-muted font-medium rounded-xl transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>Regla Automatizada:</strong> El préstamo se emite en la semana actual y la primera cuota se cobrará <u>la semana siguiente</u> de forma automática.
        </div>
      </div>
    </div>
  )
}
