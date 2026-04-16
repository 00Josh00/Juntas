import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarDays, Settings, Play, CheckCircle2, XCircle, Users, AlertCircle, Wallet, ArrowLeft, TrendingUp, DollarSign } from 'lucide-react'
import { Junta, Participante, OpcionParticipante, SemanaJunta } from '@/types/database'
import { AccionesConfiguracion } from '@/app/juntas/[id]/AccionesConfiguracion'
import { SemanasCarousel } from '@/app/juntas/[id]/SemanasCarousel'
import { notFound } from 'next/navigation'

const EstadoBadge = ({ estado }: { estado: string }) => {
  switch (estado) {
    case 'configuracion':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"><Settings className="h-3 w-3" /> Config</span>
    case 'activa':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><Play className="h-3 w-3" /> Activa</span>
    case 'cerrada':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800"><CheckCircle2 className="h-3 w-3" /> Cerrada</span>
    case 'cancelada':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800"><XCircle className="h-3 w-3" /> Cancelada</span>
    default:
      return <span>{estado}</span>
  }
}

export default async function DetalleJuntaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const juntaId = parseInt(id, 10)

  const { data: juntaRaw, error: juntaError } = await supabase
    .from('juntas').select('*').eq('id', juntaId).single()

  if (juntaError || !juntaRaw) notFound()
  const junta = juntaRaw as Junta

  const { data: opcionesRaw } = await supabase
    .from('opciones_participante')
    .select('*, participantes (*)')
    .eq('junta_id', juntaId)
  const opciones = (opcionesRaw || []) as OpcionParticipante[]

  const totalOpciones = opciones.reduce((acc, opc) => acc + opc.cantidad_opciones, 0)
  const montoBolsaSemanal = totalOpciones * junta.monto_por_opcion

  const { data: semanasRaw } = await supabase
    .from('semanas_junta').select('*').eq('junta_id', juntaId).order('numero_semana', { ascending: true })
  const semanas = (semanasRaw || []) as SemanaJunta[]

  const { data: todosLosParticipantes } = await supabase
    .from('participantes').select('*').eq('activo', true)
  const idsYaAgregados = opciones.map(o => o.participante_id)
  const participantesDisponibles = (todosLosParticipantes || []).filter(p => !idsYaAgregados.includes(p.id))

  // Stats para la junta activa
  let cajaEfectivo = 0
  let totalPrestamos = 0
  let totalRecuperado = 0
  if (junta.estado === 'activa') {
    const { data: pagosData } = await supabase
      .from('pagos_semanales')
      .select('monto_pagado, semanas_junta!inner(junta_id)')
      .eq('semanas_junta.junta_id', juntaId)
      .eq('estado', 'pagado')
    cajaEfectivo = pagosData?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0

    const { data: prestamosData } = await supabase
      .from('prestamos').select('monto_principal').eq('junta_id', juntaId)
    totalPrestamos = prestamosData?.reduce((a, b) => a + Number(b.monto_principal), 0) || 0

    const { data: cuotasData } = await supabase
      .from('pagos_cuotas')
      .select('monto_pagado, prestamos!inner(junta_id)')
      .eq('prestamos.junta_id', juntaId)
    totalRecuperado = cuotasData?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0
  }

  const cajaReal = cajaEfectivo - totalPrestamos + totalRecuperado
  const semanaActual = semanas.find(s => !s.cerrada) || semanas[semanas.length - 1]
  const semanasCompletadas = semanas.filter(s => s.cerrada).length

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-colors flex-shrink-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">Junta</p>
            <h1 className="text-base font-bold text-foreground leading-tight truncate">{junta.nombre}</h1>
          </div>
        </div>
        <EstadoBadge estado={junta.estado} />
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-2xl mx-auto">

        {/* STATS CARDS (Solo activa) */}
        {junta.estado === 'activa' && (
          <>
            {/* KPI ROW */}
            <div className="grid grid-cols-2 gap-3">
              {/* CAJA */}
              <div className="col-span-2 bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 opacity-10">
                  <DollarSign className="h-28 w-28" />
                </div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Caja en Efectivo</p>
                <p className="text-4xl font-extrabold tracking-tight">S/ {cajaReal.toFixed(2)}</p>
                <p className="text-blue-200/70 text-xs mt-2">Recaudado – Préstamos + Cuotas cobradas</p>
              </div>

              {/* SEMANA ACTUAL */}
              <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Semana Actual</p>
                <p className="text-3xl font-extrabold text-foreground">{semanaActual?.numero_semana ?? '-'}</p>
                <p className="text-xs text-secondary mt-1">de {junta.total_semanas} totales</p>
              </div>

              {/* PROGRESO */}
              <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Semanas ✓</p>
                <p className="text-3xl font-extrabold text-foreground">{semanasCompletadas}</p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.round((semanasCompletadas / junta.total_semanas) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* IR A SEMANA ACTUAL */}
            {semanaActual && (
              <Link
                href={`/juntas/${juntaId}/semanas/${semanaActual.id}`}
                className="flex items-center justify-between p-4 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-2xl hover:bg-primary/20 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">En Curso</p>
                  <p className="font-bold text-foreground text-base">Ir a Semana {semanaActual.numero_semana} →</p>
                </div>
                <CalendarDays className="h-8 w-8 text-primary flex-shrink-0" />
              </Link>
            )}
          </>
        )}

        {/* INFO DE LA JUNTA */}
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detalles del Grupo</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Monto por Opción</p>
              <p className="text-lg font-bold text-foreground">S/ {Number(junta.monto_por_opcion).toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Total Semanas</p>
              <p className="text-lg font-bold text-foreground">{junta.total_semanas}</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 col-span-2">
              <p className="text-xs text-primary font-semibold mb-0.5">{totalOpciones} opciones → Bolsa Semanal</p>
              <p className="text-2xl font-extrabold text-primary">S/ {montoBolsaSemanal.toFixed(2)}</p>
            </div>
          </div>
          {junta.descripcion && (
            <p className="text-sm text-secondary border-t border-border pt-3">{junta.descripcion}</p>
          )}
        </div>

        {/* CONFIGURACION */}
        {junta.estado === 'configuracion' && (
          <AccionesConfiguracion
            juntaId={junta.id}
            opciones={opciones}
            participantesDisponibles={participantesDisponibles}
          />
        )}

        {/* PARTICIPANTES DEL GRUPO (solo activa) */}
        {junta.estado === 'activa' && opciones.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-bold text-sm text-foreground">Integrantes ({opciones.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {opciones.map(opc => (
                <div key={opc.id} className="px-5 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {opc.participantes?.nombre} {opc.participantes?.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {opc.cantidad_opciones} opción{opc.cantidad_opciones > 1 ? 'es' : ''} · S/ {(opc.cantidad_opciones * junta.monto_por_opcion).toFixed(2)}/sem
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      x{opc.cantidad_opciones}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEMANAS */}
        {junta.estado === 'activa' && semanas.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-bold text-sm text-foreground">Todas las Semanas</h2>
            </div>
            <div className="p-5">
              <SemanasCarousel semanas={semanas} juntaId={juntaId} />
            </div>
          </div>
        )}

        {/* PRESTAMOS */}
        {junta.estado === 'activa' && (
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-bold text-sm text-foreground">Préstamos del Grupo</h2>
              </div>
              <Link
                href={`/prestamos/nuevo?junta=${juntaId}`}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
              >
                + Prestar
              </Link>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-3">
                Otorga un préstamo a un miembro de este grupo. Las cuotas se cobrarán automáticamente desde la semana siguiente al préstamo.
              </p>
              <Link
                href={`/prestamos`}
                className="text-primary text-sm font-medium hover:underline"
              >
                Ver todas las cuotas y saldos →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
