import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Wallet, Settings2, PlayCircle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { SemanaJunta, PagoSemanal, Junta } from '@/types/database'
import { BotonManejarPago } from './BotonesPago'
import { generarPagos, toggleCerrarSemana } from '@/app/acciones/pagos'

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

  // Cuotas activas de préstamos de esta junta
  const { data: prestamosData } = await supabase
    .from('prestamos')
    .select('id, participante_id, cuotas_prestamo (id, monto_cuota, estado, numero_cuota)')
    .eq('junta_id', juntaId)
    .in('estado', ['activo', 'pagado_parcial'])

  const cuotasMap = new Map<number, { id: number, monto: number, num: number }>()
  if (prestamosData) {
    prestamosData.forEach(p => {
      const pd = (p.cuotas_prestamo as any[])?.filter(c => c.estado === 'pendiente') || []
      pd.sort((a: any, b: any) => a.numero_cuota - b.numero_cuota)
      if (pd.length > 0) {
        cuotasMap.set(p.participante_id, { id: pd[0].id, monto: Number(pd[0].monto_cuota), num: pd[0].numero_cuota })
      }
    })
  }

  const handleGenerarCaja = async () => { 'use server'; await generarPagos(semanaId, juntaId) }
  const handleToggleEstadoSemana = async () => { 'use server'; await toggleCerrarSemana(semanaId, semana.cerrada, juntaId) }

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
            <Link href={`/juntas/${juntaId}`} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <p className="text-xs text-muted-foreground font-medium truncate max-w-[140px]">{junta?.nombre}</p>
              <h1 className="text-base font-bold text-foreground">Semana {semana.numero_semana}</h1>
            </div>
          </div>

          {/* NAV SEMANAS */}
          <div className="flex items-center gap-2">
            {prevS ? (
              <Link href={`/juntas/${juntaId}/semanas/${prevS.id}`} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : <div className="w-9" />}
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${semana.cerrada ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-primary/10 text-primary'}`}>
              {semana.cerrada ? 'CERRADA' : 'ACTIVA'}
            </span>
            {nextS ? (
              <Link href={`/juntas/${juntaId}/semanas/${nextS.id}`} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : <div className="w-9" />}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">

        {/* RESUMEN CAJA */}
        {pagos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium mb-1">Esperado</p>
              <p className="text-base font-extrabold text-foreground">S/{totalEsperado.toFixed(0)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-3 text-center">
              <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Cobrado</p>
              <p className="text-base font-extrabold text-green-700 dark:text-green-400">S/{totalPagado.toFixed(0)}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Pendientes</p>
              <p className="text-base font-extrabold text-amber-700 dark:text-amber-400">{pendientes}</p>
            </div>
          </div>
        )}

        {/* BARRA DE PROGRESO */}
        {pagos.length > 0 && (
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${totalEsperado > 0 ? Math.round((totalPagado / totalEsperado) * 100) : 0}%` }}
            />
          </div>
        )}

        {/* SIN CAJA: GENERAR */}
        {pagos.length === 0 && (
          <div className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center bg-primary/5 flex flex-col items-center">
            <Settings2 className="h-10 w-10 text-primary/40 mb-3" />
            <h3 className="text-base font-bold mb-1 text-foreground">Abrir Caja de la Semana</h3>
            <p className="text-secondary text-sm max-w-xs mb-6">
              Al abrir, se generarán automáticamente los recibos de cobro pre-calculados para cada integrante.
            </p>
            <form action={handleGenerarCaja}>
              <button className="px-6 py-3 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-md">
                <PlayCircle className="h-5 w-5" /> Generar Cupones
              </button>
            </form>
          </div>
        )}

        {/* LISTA DE COBROS */}
        {pagos.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Control de Recaudación
              </h2>
              <form action={handleToggleEstadoSemana}>
                <button className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${semana.cerrada ? 'bg-muted text-foreground border-border' : 'bg-green-600 text-white border-green-700'}`}>
                  {semana.cerrada ? 'Reabrir' : 'Cerrar Semana'}
                </button>
              </form>
            </div>

            <div className="divide-y divide-border">
              {pagos.map(pago => {
                const cuota = cuotasMap.get(pago.participante_id)
                const isPendiente = pago.estado !== 'pagado'
                const cuotaMonto = isPendiente && cuota ? cuota.monto : 0
                const totalAbsoluto = Number(pago.monto_esperado) + cuotaMonto

                return (
                  <div
                    key={pago.id}
                    className={`p-4 ${pago.estado === 'pagado' ? 'bg-green-50/60 dark:bg-green-900/10' : ''}`}
                  >
                    {/* NOMBRE + ESTADO */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground leading-tight truncate">
                          {pago.participantes?.nombre} {pago.participantes?.apellido}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pago.opciones_cantidad} opción{pago.opciones_cantidad > 1 ? 'es' : ''}
                        </p>
                        {isPendiente && cuota && (
                          <span className="inline-block text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold px-2 py-0.5 rounded mt-1">
                            + Cuota {cuota.num} préstamo (S/{cuota.monto.toFixed(2)})
                          </span>
                        )}
                      </div>
                      {pago.estado === 'pagado' ? (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-md">
                          PAGADO
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-1 rounded-md">
                          PENDIENTE
                        </span>
                      )}
                    </div>

                    {/* MONTO + BOTÓN */}
                    <div className="flex items-center justify-between gap-3 bg-background rounded-xl border border-border/60 px-4 py-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total a Cobrar</p>
                        <p className="text-lg font-extrabold text-primary">S/ {totalAbsoluto.toFixed(2)}</p>
                      </div>
                      <BotonManejarPago
                        pagoId={pago.id}
                        montoEsperado={Number(pago.monto_esperado)}
                        estado={pago.estado}
                        juntaId={juntaId}
                        semanaId={semanaId}
                        cuotaId={isPendiente && cuota ? cuota.id : undefined}
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
          <p className="text-center text-xs text-muted-foreground">
            Fecha de la semana: {new Date(semana.fecha_semana).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}

      </div>
    </div>
  )
}
