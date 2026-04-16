import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Wallet, Settings2, PlayCircle, Loader2 } from 'lucide-react'
import { SemanaJunta, PagoSemanal, Junta } from '@/types/database'
import { BotonManejarPago } from './BotonesPago'
import { generarPagos } from '@/app/acciones/pagos'

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

  // Action Component for Generating Payments list if empty
  const handleGenerarCaja = async () => {
    'use server'
    await generarPagos(semanaId, juntaId)
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
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-lg font-bold">Control de Recaudación</h2>
          </div>
          <div className="overflow-x-auto">
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
                {pagos.map(pago => (
                  <tr key={pago.id} className={`transition-colors ${pago.estado === 'pagado' ? 'bg-green-50/30' : 'hover:bg-muted/20'}`}>
                    <td className="p-5 font-medium">{pago.participantes?.nombre} {pago.participantes?.apellido}</td>
                    <td className="p-5 text-center font-mono">{pago.opciones_cantidad}</td>
                    <td className="p-5 text-right font-bold text-lg">S/ {Number(pago.monto_esperado).toFixed(2)}</td>
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
                       <BotonManejarPago pagoId={pago.id} montoEsperado={pago.monto_esperado} estado={pago.estado} juntaId={juntaId} semanaId={semanaId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
