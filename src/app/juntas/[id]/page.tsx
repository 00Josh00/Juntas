import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarDays, Settings, Play, CheckCircle2, XCircle, Users, AlertCircle, Wallet, ArrowLeft, TrendingUp, DollarSign, ChevronRight } from 'lucide-react'

import { Junta, Participante, OpcionParticipante, SemanaJunta } from '@/types/database'
import { AccionesConfiguracion } from '@/app/juntas/[id]/AccionesConfiguracion'
import { SemanasCarousel } from '@/app/juntas/[id]/SemanasCarousel'
import { notFound } from 'next/navigation'

const EstadoBadge = ({ estado }: { estado: string }) => {
  switch (estado) {
    case 'configuracion':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 uppercase tracking-wider"><Settings className="h-3 w-3" /> Config</span>
    case 'activa':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider"><Play className="h-3 w-3" /> Activa</span>
    case 'cerrada':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider"><CheckCircle2 className="h-3 w-3" /> Cerrada</span>
    case 'cancelada':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider"><XCircle className="h-3 w-3" /> Cancelada</span>
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 uppercase tracking-wider">{estado}</span>
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
  let totalAhorrosCobrados = 0
  let totalPrincipalPrestado = 0
  let totalCuotasCobradas = 0
  let saldoVivoPrestamos = 0

  if (junta.estado === 'activa') {
    // 1. Ahorros semanales pagados
    const { data: pagosData } = await supabase
      .from('pagos_semanales')
      .select('monto_pagado, semanas_junta!inner(junta_id)')
      .eq('semanas_junta.junta_id', juntaId)
      .eq('estado', 'pagado')
    totalAhorrosCobrados = pagosData?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0

    // 2. Préstamos otorgados (Capital inicial) y Saldo Vivo
    const { data: prestamosData } = await supabase
      .from('prestamos')
      .select('monto_principal, saldo_pendiente, estado')
      .eq('junta_id', juntaId)
    
    totalPrincipalPrestado = prestamosData?.reduce((a, b) => a + Number(b.monto_principal), 0) || 0
    saldoVivoPrestamos = prestamosData?.reduce((a, b) => a + Number(b.saldo_pendiente), 0) || 0

    // 3. Cuotas de préstamos cobradas
    const { data: cuotasData } = await supabase
      .from('cuotas_prestamo')
      .select('monto_pagado, prestamos!inner(junta_id)')
      .eq('prestamos.junta_id', juntaId)
      .eq('estado', 'pagada')
    totalCuotasCobradas = cuotasData?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0
  }

  const dineroEnCaja = totalAhorrosCobrados + totalCuotasCobradas - totalPrincipalPrestado
  const ingresosTotales = totalAhorrosCobrados + totalCuotasCobradas
  
  // Estadísticas detalladas de préstamos para el contador
  const { data: prestamosCountData } = await supabase
    .from('prestamos')
    .select('estado')
    .eq('junta_id', juntaId)
  
  const countPrestamosTotales = (prestamosCountData || []).length
  const countPrestamosPendientes = (prestamosCountData || []).filter(p => p.estado === 'activo' || p.estado === 'pagado_parcial').length
  const countPrestamosPagados = (prestamosCountData || []).filter(p => p.estado === 'pagado_total').length
  
  const semanaActual = semanas.find(s => !s.cerrada) || semanas[semanas.length - 1]
  const semanasCompletadas = semanas.filter(s => s.cerrada).length

  // Pagos pendientes de la semana actual
  const { data: pagosSemanaActual } = await supabase
    .from('pagos_semanales')
    .select('estado')
    .eq('semana_junta_id', semanaActual?.id || 0)
  const pendientes = (pagosSemanaActual || []).filter(p => p.estado === 'pendiente').length

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
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Dinero en Caja</p>
                <p className="text-4xl font-extrabold tracking-tight">{dineroEnCaja.toFixed(2)}</p>
                <div className="flex gap-4 mt-3 pt-3 border-t border-indigo-400/20">
                  <div className="flex-1">
                    <p className="text-indigo-200 text-[9px] uppercase font-black tracking-widest">INGRESOS (PAGOS + CUOTAS)</p>
                    <p className="text-emerald-400 font-black text-sm">{ingresosTotales.toFixed(2)}</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-indigo-200 text-[9px] uppercase font-black tracking-widest">EN PRÉSTAMOS (VIVO)</p>
                    <p className="text-rose-400 font-black text-sm">{saldoVivoPrestamos.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* SEMANA ACTUAL */}
              <div className="bg-white border border-border rounded-2xl p-4 shadow-premium">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Semana Actual</p>
                <p className="text-3xl font-black text-foreground">{semanaActual?.numero_semana ?? '-'}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium italic">de {junta.total_semanas} totales</p>
              </div>

              {/* PROGRESO */}
              <div className="bg-white border border-border rounded-2xl p-4 shadow-premium">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Semanas ✓</p>
                <p className="text-3xl font-black text-foreground">{semanasCompletadas}</p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.round((semanasCompletadas / junta.total_semanas) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* IR A SEMANA ACTUAL */}
            {semanaActual && (
              <Link
                href={`/juntas/${juntaId}/semanas/${semanaActual.id}`}
                className="flex items-center justify-between p-5 bg-indigo-600 text-white rounded-2xl shadow-premium hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Sesión para cobrar</p>
                  <p className="font-black text-xl">Ir a Cobros Semana {semanaActual.numero_semana} →</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
              </Link>
            )}
          </>
        )}

        {/* INFO DE LA JUNTA */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-premium">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Datos del Grupo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Monto por Opción</p>
              <p className="text-xl font-black text-foreground">{Number(junta.monto_por_opcion).toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Semanas</p>
              <p className="text-xl font-black text-foreground">{junta.total_semanas}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 col-span-2">
              <p className="text-[10px] text-indigo-700 font-black uppercase tracking-[0.1em] mb-1">Bolsa Semanal Proyectada</p>
              <p className="text-3xl font-black text-indigo-700">{montoBolsaSemanal.toFixed(2)}</p>
            </div>
          </div>
          {junta.descripcion && (
            <p className="text-sm text-slate-500 font-medium border-t border-slate-100 pt-4 leading-relaxed">{junta.descripcion}</p>
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

        {/* PARTICIPANTES DEL GRUPO - CARD RESUMEN (solo activa) */}
        {junta.estado === 'activa' && opciones.length > 0 && (
          <Link href={`/juntas/${juntaId}/participantes`} className="block">
            <div className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between hover:border-indigo-400 shadow-premium transition-all active:scale-[0.99] group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-black text-foreground text-base">Nuestros Socios ({opciones.length})</p>
                  <p className="text-[11px] text-slate-500 font-medium">{montoBolsaSemanal.toFixed(2)} ahorrado semanalmente</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
          </Link>
        )}



        {/* ESTADO DE LA SEMANA ACTUAL */}
        {junta.estado === 'activa' && semanaActual && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-premium">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50">
              <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                Resumen Semanal
              </h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${pendientes === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {pendientes === 0 ? '✓ Al día' : `⚠ ${pendientes} faltan`}
              </span>
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-2xl font-black text-foreground">Semana {semanaActual.numero_semana}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  {pendientes === 0 ? 'Todos los socios han cumplido con sus aportes.' : 'Aún faltan aportaciones por registrar en esta sesión.'}
                </p>
              </div>
              <Link
                href={`/juntas/${juntaId}/semanas/${semanaActual.id}`}
                className="bg-indigo-600 text-white p-3 rounded-xl shadow-premium hover:bg-indigo-700 transition-all active:scale-95"
              >
                <ChevronRight className="h-6 w-6" />
              </Link>
            </div>
          </div>
        )}

        {/* PRESTAMOS */}
        {junta.estado === 'activa' && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-premium">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50">
              <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Préstamos del Grupo</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Totales</p>
                  <p className="text-xl font-black text-foreground">{countPrestamosTotales}</p>
                </div>
                <div className="text-center p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-[9px] text-rose-400 font-black uppercase mb-1">En Curso</p>
                  <p className="text-xl font-black text-rose-600">{countPrestamosPendientes}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[9px] text-emerald-400 font-black uppercase mb-1">Pagados</p>
                  <p className="text-xl font-black text-emerald-600">{countPrestamosPagados}</p>
                </div>
              </div>

              <Link
                href={`/juntas/${juntaId}/prestamos`}
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Ver lista de préstamos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
