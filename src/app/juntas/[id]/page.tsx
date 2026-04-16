import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarDays, Settings, Play, CheckCircle2, XCircle, Users, AlertCircle, Wallet, ArrowLeft, TrendingUp, DollarSign, ChevronRight, Share2 } from 'lucide-react'

import { Junta, Participante, OpcionParticipante, SemanaJunta } from '@/types/database'
import { AccionesConfiguracion } from '@/app/juntas/[id]/AccionesConfiguracion'
import { notFound } from 'next/navigation'
import { DashboardFooter } from './DashboardFooter'
import { WhatsAppShare } from './WhatsAppShare'

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
  let totalInteresesProyectados = 0
  let listaPendientes: any[] = []

  const semanaActual = semanas.find(s => !s.cerrada) || semanas[semanas.length - 1]
  const semanasCompletadas = semanas.filter(s => s.cerrada).length

  if (junta.estado === 'activa') {
    // 1. Ahorros semanales pagados
    const { data: pagosData } = await supabase
      .from('pagos_semanales')
      .select('monto_pagado, estado, participantes(nombre, apellido)')
      .eq('semana_junta_id', semanaActual?.id || 0)
    
    // Total cobrado histórico de ahorros (para la caja)
    const { data: totalPagosHistoricos } = await supabase
      .from('pagos_semanales')
      .select('monto_pagado, semanas_junta!inner(junta_id)')
      .eq('semanas_junta.junta_id', juntaId)
      .eq('estado', 'pagado')
    
    totalAhorrosCobrados = totalPagosHistoricos?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0

    // Pendientes de la semana actual
    listaPendientes = pagosData?.filter(p => p.estado !== 'pagado') || []

    // 2. Préstamos otorgados (Capital inicial) y Saldo Vivo e Intereses
    const { data: prestamosData } = await supabase
      .from('prestamos')
      .select('monto_principal, saldo_pendiente, interes_total, estado')
      .eq('junta_id', juntaId)
    
    totalPrincipalPrestado = prestamosData?.reduce((a, b) => a + Number(b.monto_principal), 0) || 0
    saldoVivoPrestamos = prestamosData?.reduce((a, b) => a + Number(b.saldo_pendiente), 0) || 0
    totalInteresesProyectados = prestamosData?.reduce((a, b) => a + Number(b.interes_total), 0) || 0

    // 3. Cuotas de préstamos cobradas
    const { data: cuotasData } = await supabase
      .from('cuotas_prestamo')
      .select('monto_pagado, prestamos!inner(junta_id)')
      .eq('prestamos.junta_id', juntaId)
      .eq('estado', 'pagada')
    totalCuotasCobradas = cuotasData?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0
  }

  const dineroEnCaja = totalAhorrosCobrados + totalCuotasCobradas - totalPrincipalPrestado
  const gananciaPorOpcion = totalOpciones > 0 ? totalInteresesProyectados / totalOpciones : 0
  const ahorroTotalPorOpcion = junta.monto_por_opcion * junta.total_semanas
  const retornoTotalPorOpcion = ahorroTotalPorOpcion + gananciaPorOpcion
  
  // Estadísticas de préstamos
  const { data: prestamosCountData } = await supabase
    .from('prestamos')
    .select('estado')
    .eq('junta_id', juntaId)
  
  const countPrestamosTotales = (prestamosCountData || []).length
  const countPrestamosPendientes = (prestamosCountData || []).filter(p => p.estado === 'activo' || p.estado === 'pagado_parcial').length
  const countPrestamosPagados = (prestamosCountData || []).filter(p => p.estado === 'pagado_total').length
  
  const progresoPorcentaje = Math.round((semanasCompletadas / junta.total_semanas) * 100)

  return (
    <div className="min-h-screen bg-white pb-32">

      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 truncate max-w-[150px]">{junta.nombre}</span>
        </div>
        <div className="flex items-center gap-3">
          <WhatsAppShare 
            juntaNombre={junta.nombre} 
            semanaActual={semanaActual?.numero_semana || 0}
            pendientes={listaPendientes.map(p => `${p.participantes.nombre} ${p.participantes.apellido}`)}
          />
          <EstadoBadge estado={junta.estado} />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-12 space-y-12">

        {/* HERO SECTION: CAJA */}
        <section className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Balance en Caja Efectivo</p>
          <h2 className="text-5xl sm:text-7xl text-slate-900 font-black tracking-tighter mb-6">
            S/ {dineroEnCaja.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>

          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ahorrado</span>
              <span className="text-sm font-bold text-emerald-600">S/ {totalAhorrosCobrados.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">En Préstamos</span>
              <span className="text-sm font-bold text-rose-500">S/ {saldoVivoPrestamos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* PROGRESS MINIMAL */}
        <section className="animate-in fade-in delay-150 duration-700">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Progreso del Grupo</h3>
            <span className="text-2xl font-black text-indigo-600 leading-none">{progresoPorcentaje}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
            <div 
              className="h-full bg-indigo-600 transition-all duration-1000 ease-out" 
              style={{ width: `${progresoPorcentaje}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3">
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Inicio: {junta.fecha_inicio ? new Date(junta.fecha_inicio).toLocaleDateString() : '-'}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semana {semanaActual?.numero_semana || '-'} de {junta.total_semanas}</p>
          </div>
        </section>

        {/* METRICS GRID: PROYECCIONES */}
        <section className="grid grid-cols-2 gap-4 animate-in fade-in delay-300 duration-700">
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100/50 flex flex-col items-center text-center group hover:bg-slate-100 transition-colors cursor-default">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Intereses</span>
            <span className="text-2xl font-black text-slate-900 leading-none mb-1">S/ {totalInteresesProyectados.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">Bolsa Proyectada</span>
          </div>
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100/50 flex flex-col items-center text-center group hover:bg-slate-100 transition-colors cursor-default">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Por Opción</span>
            <span className="text-2xl font-black text-slate-900 leading-none mb-1">S/ {retornoTotalPorOpcion.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Retorno Final</span>
          </div>
        </section>

        {/* ACTIONS & NAVIGATION */}
        <section className="space-y-4 animate-in fade-in delay-500 duration-700">
          <Link href={`/juntas/${juntaId}/participantes`} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Participantes ({opciones.length})</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{totalOpciones} Opciones habilitadas</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </Link>

          <Link href={`/juntas/${juntaId}/prestamos`} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Préstamos</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{countPrestamosPendientes} en curso · {countPrestamosPagados} pagados</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </Link>
        </section>

        {/* CURRENT WEEK STATUS */}
        {junta.estado === 'activa' && semanaActual && (
          <section className="animate-in fade-in delay-700 duration-700">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">Semana Actual: {semanaActual.numero_semana}</h3>
                  <p className="text-3xl font-black">{opciones.length - listaPendientes.length} de {opciones.length}</p>
                  <p className="text-[10px] font-black text-emerald-400 uppercase mt-2 tracking-widest">SOCIOS HAN PAGADO</p>
                </div>
                <Link 
                  href={`/juntas/${juntaId}/semanas/${semanaActual.id}`}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90"
                >
                  <CalendarDays className="h-6 w-6" />
                </Link>
              </div>

              {listaPendientes.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-white/5 pt-6">Pendientes por cobrar:</p>
                  <div className="flex flex-wrap gap-2">
                    {listaPendientes.map((p, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-slate-300">
                        {p.participantes.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-emerald-400 border-t border-white/5 pt-6">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-xs font-black tracking-widest uppercase">¡Todo el grupo está al día!</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CONFIGURATION (if not active) */}
        {junta.estado === 'configuracion' && (
          <AccionesConfiguracion
            juntaId={junta.id}
            opciones={opciones}
            participantesDisponibles={participantesDisponibles}
          />
        )}

      </div>

      {/* FOOTER NAVIGATION */}
      {junta.estado === 'activa' && (
        <DashboardFooter 
          juntaId={juntaId}
          semanaActualId={semanaActual?.id}
          numeroSemanaActual={semanaActual?.numero_semana || 0}
          totalSemanas={junta.total_semanas}
        />
      )}
    </div>
  )
}
