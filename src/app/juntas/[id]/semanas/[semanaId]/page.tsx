import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Wallet, Settings2, PlayCircle, Loader2 } from 'lucide-react'
import { SemanaJunta, PagoSemanal, Junta } from '@/types/database'
import { BotonManejarPago } from './BotonesPago'
import { generarPagos, toggleCerrarSemana } from '@/app/acciones/pagos'

export default async function SemanaPage({ params }: { params: Promise<{ id: string, semanaId: string }> }) {
  const { id: juntaIdStr, semanaId: semanaIdStr } = await params
  const juntaId = parseInt(juntaIdStr, 10)
  const semanaId = parseInt(semanaIdStr, 10)
  const supabase = await createClient()

  // Info Junta
  const { data: juntaRaw } = await supabase.from('juntas').select('*').eq('id', juntaId).single()
  const junta = juntaRaw as Junta

  // Info Semana
  const { data: semanaRaw, error: semanaError } = await supabase
    .from('semanas_junta')
    .select('*')
    .eq('id', semanaId)
    .single()

  if (semanaError || !semanaRaw) notFound()
  const semana = semanaRaw as SemanaJunta

  // Info Pagos
  const { data: pagosRaw } = await supabase
    .from('pagos_semanales')
    .select(`*, participantes (*)`)
    .eq('semana_junta_id', semanaId)

  const pagos = (pagosRaw || []) as PagoSemanal[]

  // Info Cuotas Activas
  const { data: prestamosData } = await supabase
    .from('prestamos')
    .select('id, participante_id, cuotas_prestamo (id, monto_cuota, estado, numero_cuota)')
    .eq('junta_id', juntaId)
    .in('estado', ['activo', 'pagado_parcial'])

  const cuotasMap = new Map<number, { id: number, monto: number, num: number }>()
  
  if (prestamosData) {
     prestamosData.forEach(p => {
        const pd = p.cuotas_prestamo?.filter((c: any) => c.estado === 'pendiente') || []
        pd.sort((a: any, b: any) => a.numero_cuota - b.numero_cuota)
        if (pd.length > 0) {
           cuotasMap.set(p.participante_id, {
             id: pd[0].id,
             monto: Number(pd[0].monto_cuota),
             num: pd[0].numero_cuota
           })
        }
     })
  }


  // Action Component for Generating Payments list if empty
  const handleGenerarCaja = async () => {
    'use server'
    await generarPagos(semanaId, juntaId)
  }
  
  const handleToggleEstadoSemana = async () => {
    'use server'
    await toggleCerrarSemana(semanaId, semana.cerrada, juntaId)
  }

  // Navegación rápida entre semanas
  const { data: prevSemanaRaw } = await supabase
    .from('semanas_junta')
    .select('id')
    .eq('junta_id', juntaId)
    .eq('numero_semana', semana.numero_semana - 1)
    .single()

  const { data: nextSemanaRaw } = await supabase
    .from('semanas_junta')
    .select('id')
    .eq('junta_id', juntaId)
    .eq('numero_semana', semana.numero_semana + 1)
    .single()

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <Link href={`/juntas/${juntaId}`} className="text-primary hover:underline text-sm font-medium inline-block">&larr; Volver a Panel de la Junta</Link>
          
          <div className="flex items-center gap-3">
             {prevSemanaRaw && (
               <Link href={`/juntas/${juntaId}/semanas/${prevSemanaRaw.id}`} className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                  &lt; Ant
               </Link>
             )}
             {nextSemanaRaw && (
               <Link href={`/juntas/${juntaId}/semanas/${nextSemanaRaw.id}`} className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                  Sig &gt;
               </Link>
             )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground flex items-center gap-2 sm:gap-3">
              <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              Semana {semana.numero_semana}
            </h1>
            <p className="text-secondary mt-1 tracking-wide uppercase text-[10px] sm:text-sm font-bold">
              {junta.nombre}
            </p>
          </div>
          <div className="bg-muted p-3 sm:p-4 rounded-2xl flex items-center justify-between sm:justify-start gap-4">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fecha Correspondiente</div>
              <div className="text-sm sm:text-base font-semibold">{semana.fecha_semana ? new Date(semana.fecha_semana).toLocaleDateString() : 'No definida'}</div>
            </div>
            <div className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${semana.cerrada ? 'bg-green-100 text-green-700 border-green-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
              {semana.cerrada ? 'CERRADA' : 'ACTIVA'}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES ESTADO */}
      {pagos.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-primary/30 rounded-3xl text-center bg-primary/5 flex flex-col items-center">
            <Settings2 className="h-12 w-12 text-primary/50 mb-4" />
            <h3 className="text-xl font-bold mb-2 text-foreground">Abrir Caja de la Semana</h3>
             <p className="text-secondary max-w-lg mb-8">
                Al abrir la caja se generarán los recibos de cobro automáticos pre-calculados basados en las opciones que tiene actualmente cada integrante matriculado.
             </p>
             <form action={handleGenerarCaja}>
               <button className="px-6 py-3 bg-primary hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                  <PlayCircle className="h-5 w-5" />
                  Generar Cupones de Cobro
               </button>
             </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-lg font-bold">Control de Recaudación</h2>
            <form action={handleToggleEstadoSemana}>
               <button 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors border ${semana.cerrada ? 'bg-muted text-foreground border-border hover:bg-muted/80' : 'bg-green-600 text-white border-green-700 hover:bg-green-700'}`}
               >
                  {semana.cerrada ? 'Reabrir Semana' : 'Cerrar Semana Oficialmente'}
               </button>
            </form>
          </div>
          <div className="md:hidden divide-y divide-border">
            {pagos.map(pago => {
              const cuota = cuotasMap.get(pago.participante_id);
              const isPendiente = pago.estado !== 'pagado';
              const cuotaMonto = (isPendiente && cuota) ? cuota.monto : 0;
              const totalAbsoluto = Number(pago.monto_esperado) + cuotaMonto;

              return (
              <div key={`mob-${pago.id}`} className={`p-5 transition-colors ${pago.estado === 'pagado' ? 'bg-green-50/50 dark:bg-green-900/10' : 'hover:bg-muted/10'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                     <div className="font-bold text-base text-foreground leading-tight">{pago.participantes?.nombre} {pago.participantes?.apellido}</div>
                     <div className="text-xs text-secondary font-medium mt-1">Opciones tomadas: {pago.opciones_cantidad}</div>
                     {isPendiente && cuota && (
                        <div className="text-[10px] text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 font-bold px-2 py-0.5 rounded mt-2 inline-block">
                           + Cuota {cuota.num} Préstamo (S/ {cuota.monto.toFixed(2)})
                        </div>
                     )}
                  </div>
                  <div>
                    {pago.estado === 'pagado' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        PAGADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                        PENDIENTE
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-end gap-4 bg-background p-3 rounded-xl border border-border/50">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Total a Cobrar</div>
                    <div className="font-extrabold text-xl text-primary">S/ {totalAbsoluto.toFixed(2)}</div>
                  </div>
                  <div>
                    <BotonManejarPago pagoId={pago.id} montoEsperado={Number(pago.monto_esperado)} estado={pago.estado} juntaId={juntaId} semanaId={semanaId} cuotaId={isPendiente && cuota ? cuota.id : undefined} cuotaMonto={cuotaMonto} />
                  </div>
                </div>
              </div>
            )})}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-muted/50 border-b border-border text-sm font-semibold text-muted-foreground">
                    <th className="p-5">Participante</th>
                    <th className="p-5 text-center">Opciones</th>
                    <th className="p-5 text-right">Monto a Cobrar</th>
                    <th className="p-5 text-center">Estado</th>
                    <th className="p-5">Acciones</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagos.map(pago => {
                  const cuota = cuotasMap.get(pago.participante_id);
                  const isPendiente = pago.estado !== 'pagado';
                  const cuotaMonto = (isPendiente && cuota) ? cuota.monto : 0;
                  const totalAbsoluto = Number(pago.monto_esperado) + cuotaMonto;

                  return (
                  <tr key={pago.id} className={`transition-colors ${pago.estado === 'pagado' ? 'bg-green-50/30' : 'hover:bg-muted/20'}`}>
                    <td className="p-5 font-medium">
                        {pago.participantes?.nombre} {pago.participantes?.apellido}
                        {isPendiente && cuota && (
                           <div className="text-[10px] text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 font-bold px-2 py-0.5 rounded mt-2 inline-table">
                              + Cuota de Prestamo (S/ {cuota.monto.toFixed(2)})
                           </div>
                        )}
                    </td>
                    <td className="p-5 text-center font-mono">{pago.opciones_cantidad}</td>
                    <td className="p-5 text-right font-bold text-lg">S/ {totalAbsoluto.toFixed(2)}</td>
                    <td className="p-5 text-center">
                       {pago.estado === 'pagado' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                             PAGADO
                          </span>
                       ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-500">
                             PENDIENTE
                          </span>
                       )}
                    </td>
                    <td className="p-5">
                       <BotonManejarPago pagoId={pago.id} montoEsperado={Number(pago.monto_esperado)} estado={pago.estado} juntaId={juntaId} semanaId={semanaId} cuotaId={isPendiente && cuota ? cuota.id : undefined} cuotaMonto={cuotaMonto} />
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
