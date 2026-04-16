import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Wallet, Settings2, PlayCircle, ArrowLeft, ChevronLeft, ChevronRight, CheckCheck, RotateCcw } from 'lucide-react'
import { SemanaJunta, PagoSemanal, Junta } from '@/types/database'
import { BotonManejarPago } from './BotonesPago'
import { generarPagos, toggleCerrarSemana, marcarTodoComoPagado, marcarTodoComoPendiente } from '@/app/acciones/pagos'

export default async function SemanaPage({ params }: { params: Promise<{ id: string, semanaId: string }> }) {
  const { id: juntaIdStr, semanaId: semanaIdStr } = await params
  const juntaId = parseInt(juntaIdStr, 10)
  const semanaId = parseInt(semanaIdStr, 10)
  const supabase = await createClient()

  const { data: juntaRaw } = await supabase.from('juntas').select('*').eq('id', juntaId).single()
  const junta = juntaRaw as Junta

  const { data: semanaRaw, error: semanaError } = await supabase
    .from('semanas_junta').select('*').eq('id', semanaId).single()
  if (semanaError || !semanaRaw) notFound()
  const semana = semanaRaw as SemanaJunta

  const { data: pagosRaw } = await supabase
    .from('pagos_semanales')
    .select(`*, participantes (*)`)
    .eq('semana_junta_id', semanaId)
  const pagos = (pagosRaw || []) as PagoSemanal[]

  // Cuotas (pendientes para cobrar + pagadas vinculadas a esta semana)
  const { data: prestamosData } = await supabase
    .from('prestamos')
    .select('id, participante_id, cuotas_prestamo (id, monto_cuota, monto_pagado, estado, numero_cuota, semana_junta_id)')
    .eq('junta_id', juntaId)

  const cuotasMap = new Map<number, { id: number, monto: number, num: number }>()
  const cuotasPagadasMap = new Map<number, { monto: number, num: number }>()

  if (prestamosData) {
    prestamosData.forEach(p => {
      // 1. Encontrar la cuota PENDIENTE más antigua (para el botón de cobrar)
      const pendientes = (p.cuotas_prestamo as any[])?.filter(c => c.estado === 'pendiente') || []
      pendientes.sort((a, b) => a.numero_cuota - b.numero_cuota)
      if (pendientes.length > 0) {
        cuotasMap.set(p.participante_id, { id: pendientes[0].id, monto: Number(pendientes[0].monto_cuota), num: pendientes[0].numero_cuota })
      }

      // 2. Encontrar cuotas PAGADAS en esta semana específica (para mostrar el histórico en la tarjeta)
      const pagadasEstaSemana = (p.cuotas_prestamo as any[])?.filter(c => c.estado === 'pagada' && c.semana_junta_id === semanaId) || []
      if (pagadasEstaSemana.length > 0) {
        cuotasPagadasMap.set(p.participante_id, { 
          monto: pagadasEstaSemana.reduce((sum, c) => sum + Number(c.monto_pagado), 0),
          num: pagadasEstaSemana[0].numero_cuota 
        })
      }
    })
  }

  const handleGenerarCaja = async () => { 'use server'; await generarPagos(semanaId, juntaId) }
  const handleToggleEstadoSemana = async () => { 'use server'; await toggleCerrarSemana(semanaId, semana.cerrada, juntaId) }
  const handleMarcarTodo = async () => { 'use server'; await marcarTodoComoPagado(semanaId, juntaId) }
  const handleDesmarcarTodo = async () => { 'use server'; await marcarTodoComoPendiente(semanaId, juntaId) }

  // Nav entre semanas
  const { data: prevS } = await supabase.from('semanas_junta').select('id').eq('junta_id', juntaId).eq('numero_semana', semana.numero_semana - 1).single()
  const { data: nextS } = await supabase.from('semanas_junta').select('id').eq('junta_id', juntaId).eq('numero_semana', semana.numero_semana + 1).single()

  // Stats de recaudación
  const totalEsperado = pagos.reduce((a, p) => a + Number(p.monto_esperado), 0)
  const totalPagado = pagos.filter(p => p.estado === 'pagado').reduce((a, p) => a + Number(p.monto_pagado), 0)
  const pendientes = pagos.filter(p => p.estado !== 'pagado').length

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/juntas/${juntaId}`} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[140px] leading-none mb-1">{junta?.nombre}</p>
              <h1 className="text-base font-black text-foreground leading-none">Semana {semana.numero_semana}</h1>
            </div>
          </div>

          {/* NAV SEMANAS */}
          <div className="flex items-center gap-2">
            {prevS ? (
              <Link href={`/juntas/${juntaId}/semanas/${prevS.id}`} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : <div className="w-9" />}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${semana.cerrada ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
              {semana.cerrada ? 'CERRADA' : 'ACTIVA'}
            </span>
            {nextS ? (
              <Link href={`/juntas/${juntaId}/semanas/${nextS.id}`} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : <div className="w-9" />}
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 max-w-2xl mx-auto">

        {/* RESUMEN CAJA */}
        {pagos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-border rounded-2xl p-4 text-center shadow-premium">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Esperado</p>
              <p className="text-lg font-black text-foreground leading-none">{totalEsperado.toFixed(0)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center shadow-premium">
              <p className="text-[10px] text-emerald-700/60 font-bold uppercase tracking-widest mb-1.5">Cobrado</p>
              <p className="text-lg font-black text-emerald-700 leading-none">{totalPagado.toFixed(0)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center shadow-premium">
              <p className="text-[10px] text-amber-700/60 font-bold uppercase tracking-widest mb-1.5">Pendientes</p>
              <p className="text-lg font-black text-amber-700 leading-none">{pendientes}</p>
            </div>
          </div>
        )}

        {/* BARRA DE PROGRESO */}
        {pagos.length > 0 && (
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${totalEsperado > 0 ? Math.round((totalPagado / totalEsperado) * 100) : 0}%` }}
            />
          </div>
        )}

        {/* SIN CAJA: GENERAR */}
        {pagos.length === 0 && (
          <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-10 text-center bg-indigo-50/30 flex flex-col items-center">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-premium mb-4">
               <Settings2 className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-black mb-2 text-foreground">Abrir Sesión Semanal</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-8 font-medium">
              Al abrir, se generarán automáticamente los registros de cobro para cada integrante de este grupo.
            </p>
            <form action={handleGenerarCaja}>
              <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-premium">
                <PlayCircle className="h-5 w-5" /> Generar Cobros
              </button>
            </form>
          </div>
        )}

        {/* ACCIONES EN MASA */}
        {pagos.length > 0 && !semana.cerrada && (
          <div className="flex gap-3">
            <form action={handleMarcarTodo} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all active:scale-[0.98] shadow-premium">
                <CheckCheck className="h-4 w-4" /> Cobrar Todos
              </button>
            </form>
            <form action={handleDesmarcarTodo} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl text-xs font-black transition-all active:scale-[0.98] shadow-sm">
                <RotateCcw className="h-4 w-4" /> Revertir Todo
              </button>
            </form>
          </div>
        )}

        {/* LISTA DE COBROS */}
        {pagos.length > 0 && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-premium">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between card-gradient">
              <h2 className="font-black text-[10px] text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                Lista de cobros de hoy
              </h2>
              <form action={handleToggleEstadoSemana}>
                <button className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all border uppercase tracking-widest ${semana.cerrada ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'}`}>
                  {semana.cerrada ? 'Reabrir Semana' : 'Cerrar esta semana'}
                </button>
              </form>
            </div>

            <div className="divide-y divide-slate-100">
              {pagos.map(pago => {
                const cuotaPendiente = cuotasMap.get(pago.participante_id)
                const cuotaYaPagada = cuotasPagadasMap.get(pago.participante_id)
                
                const isPendiente = pago.estado !== 'pagado'
                const cuotaMonto = isPendiente 
                  ? (cuotaPendiente ? cuotaPendiente.monto : 0)
                  : (cuotaYaPagada ? cuotaYaPagada.monto : 0)
                
                const totalAbsoluto = isPendiente
                  ? Number(pago.monto_esperado)
                  : Number(pago.monto_pagado)

                return (
                  <div
                    key={pago.id}
                    className={`p-5 transition-colors ${pago.estado === 'pagado' ? 'bg-emerald-50/30' : 'bg-white'}`}
                  >
                    {/* NOMBRE + ESTADO */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm text-foreground leading-tight truncate">
                          {pago.participantes?.nombre} {pago.participantes?.apellido}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                          {pago.opciones_cantidad} {pago.opciones_cantidad > 1 ? 'opciones' : 'opción'} registradas
                        </p>
                        
                        {/* Indicador de cuota de préstamo */}
                        {isPendiente && cuotaPendiente && (
                          <div className="inline-flex items-center gap-1.5 text-[10px] bg-orange-50 text-orange-700 font-black px-2.5 py-1 rounded-lg mt-2 border border-orange-100 uppercase tracking-tight">
                            ⚡ + Cuota {cuotaPendiente.num} préstamo ({cuotaPendiente.monto.toFixed(2)})
                          </div>
                        )}
                        {!isPendiente && cuotaYaPagada && (
                          <div className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-lg mt-2 border border-emerald-100 uppercase tracking-tight">
                            ✓ Incluye pago de su préstamo {cuotaYaPagada.num}
                          </div>
                        )}
                      </div>
                      
                      {pago.estado === 'pagado' ? (
                        <div className="flex-shrink-0 flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-lg border border-emerald-200 uppercase tracking-widest">
                          <CheckCheck className="h-3 w-3" /> Cobrado
                        </div>
                      ) : (
                        <div className="flex-shrink-0 text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 uppercase tracking-widest">
                          Pendiente
                        </div>
                      )}
                    </div>

                    {/* MONTO + BOTÓN */}
                    <div className="flex items-center justify-between gap-4 bg-slate-50/50 rounded-2xl border border-slate-100 px-5 py-3">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-0.5">Total Recibo</p>
                        <p className="text-xl font-black text-indigo-700 leading-none">{totalAbsoluto.toFixed(2)}</p>
                      </div>
                      <BotonManejarPago
                        pagoId={pago.id}
                        montoEsperado={Number(pago.monto_esperado)}
                        estado={pago.estado}
                        juntaId={juntaId}
                        semanaId={semanaId}
                        cuotaId={isPendiente && cuotaPendiente ? cuotaPendiente.id : undefined}
                        cuotaMonto={cuotaMonto || undefined}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* INFO FECHA */}
        {semana.fecha_semana && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {new Date(semana.fecha_semana).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
          </div>
        )}

      </div>
    </div>
  )
}
