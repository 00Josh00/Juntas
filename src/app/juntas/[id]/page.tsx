import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarDays, Settings, Play, CheckCircle2, XCircle, Users, AlertCircle, Wallet } from 'lucide-react'
import { Junta, Participante, OpcionParticipante, SemanaJunta } from '@/types/database'
import { AccionesConfiguracion } from '@/app/juntas/[id]/AccionesConfiguracion'
import { SemanasCarousel } from '@/app/juntas/[id]/SemanasCarousel'
import { notFound } from 'next/navigation'

const EstadoBadge = ({ estado }: { estado: string }) => {
  switch (estado) {
    case 'configuracion':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-muted-foreground border border-secondary/20"><Settings className="h-3.5 w-3.5" /> Configuración</span>
    case 'activa':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><Play className="h-3.5 w-3.5" /> Activa</span>
    case 'cerrada':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800"><CheckCircle2 className="h-3.5 w-3.5" /> Cerrada</span>
    case 'cancelada':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800"><XCircle className="h-3.5 w-3.5" /> Cancelada</span>
    default:
      return <span>{estado}</span>
  }
}

export default async function DetalleJuntaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const juntaId = parseInt(id, 10)

  // 1. Cargar datos de la Junta
  const { data: juntaRaw, error: juntaError } = await supabase
    .from('juntas')
    .select('*')
    .eq('id', juntaId)
    .single()

  if (juntaError || !juntaRaw) {
    notFound()
  }

  const junta = juntaRaw as Junta

  // 2. Cargar participantes agregados
  const { data: opcionesRaw } = await supabase
    .from('opciones_participante')
    .select(`
      *,
      participantes (*)
    `)
    .eq('junta_id', juntaId)

  const opciones = (opcionesRaw || []) as OpcionParticipante[]
  
  // Total de opciones acumuladas en esta junta
  const totalOpciones = opciones.reduce((acc, opc) => acc + opc.cantidad_opciones, 0)
  const montoBolsaSemanalEstimada = totalOpciones * junta.monto_por_opcion

  // 3. Si no está en configuración, cargar semanas y estado
  const { data: semanasRaw } = await supabase
    .from('semanas_junta')
    .select('*')
    .eq('junta_id', juntaId)
    .order('numero_semana', { ascending: true })

  const semanas = (semanasRaw || []) as SemanaJunta[]

  // 4. Cargar lista de participantes totales en el sistema (activos) para poder agregar
  const { data: todosLosParticipantes } = await supabase
    .from('participantes')
    .select('*')
    .eq('activo', true)
    
  // Filtrar los que ya están
  const idsYaAgregados = opciones.map(o => o.participante_id)
  const participantesDisponibles = (todosLosParticipantes || []).filter(p => !idsYaAgregados.includes(p.id))

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* HEADER DE LA JUNTA */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/juntas" className="text-primary hover:underline text-sm font-medium mb-3 sm:mb-4 inline-block">&larr; Volver a juntas</Link>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">{junta.nombre}</h1>
            <EstadoBadge estado={junta.estado} />
          </div>
          <p className="text-secondary max-w-3xl text-sm sm:text-base">{junta.descripcion || 'Sin descripción.'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full md:w-auto">
          <div className="bg-muted p-3 sm:p-4 rounded-2xl min-w-[120px] sm:min-w-[140px]">
            <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Monto Base</div>
            <div className="text-xl sm:text-2xl font-bold">S/ {Number(junta.monto_por_opcion).toFixed(2)}</div>
          </div>
          <div className="bg-muted p-3 sm:p-4 rounded-2xl min-w-[120px] sm:min-w-[140px]">
            <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Semanas</div>
            <div className="text-xl sm:text-2xl font-bold">{junta.total_semanas}</div>
          </div>
          <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl col-span-2 text-primary">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Recaudación Semanal Estimada</div>
            <div className="text-2xl sm:text-3xl font-extrabold flex justify-between items-center">
              <span>S/ {montoBolsaSemanalEstimada.toFixed(2)}</span>
              <span className="text-xs sm:text-sm font-medium opacity-80">{totalOpciones} opciones totales</span>
            </div>
          </div>
        </div>
      </div>

      {junta.estado === 'configuracion' && (
        <AccionesConfiguracion 
          juntaId={junta.id} 
          opciones={opciones}
          participantesDisponibles={participantesDisponibles} 
        />
      )}

      {junta.estado === 'activa' && (
        <div className="space-y-6 sm:space-y-8">
          
          {/* CAZADOR DE SEMANA Y CAJA (DASHBOARD) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* CAJA ACTUAL */}
             <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                   <AlertCircle className="h-24 w-24" />
                </div>
                <div>
                   <h3 className="text-blue-200 font-semibold uppercase tracking-widest text-xs mb-1">Caja en Efectivo</h3>
                   <div className="text-4xl sm:text-5xl font-extrabold mb-4 border-b border-blue-800/50 pb-4 inline-block">
                     S/ {(
                        (await supabase.from('pagos_semanales').select('monto_pagado, semanas_junta!inner(junta_id)').eq('semanas_junta.junta_id', juntaId).eq('estado', 'pagado')).data?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0
                     ) - (
                       (await supabase.from('prestamos').select('monto_principal').eq('junta_id', juntaId)).data?.reduce((a, b) => a + Number(b.monto_principal), 0) || 0
                     ) + (
                       (await supabase.from('pagos_cuotas').select('monto_pagado, prestamos!inner(junta_id)').eq('prestamos.junta_id', juntaId)).data?.reduce((a, b) => a + Number(b.monto_pagado), 0) || 0
                     )}.00
                   </div>
                   <div className="text-sm font-medium text-blue-100/80">Recaudado menos préstamos activos + recupero.</div>
                </div>
             </div>

             {/* SEMANA ACTUAL */}
             {(() => {
                const semanaActual = semanas.find(s => !s.cerrada) || semanas[semanas.length - 1];
                return semanaActual ? (
                  <div className="bg-white dark:bg-slate-900 border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                     <div>
                        <h3 className="text-muted-foreground font-semibold uppercase tracking-widest text-xs mb-1">Punto de Control</h3>
                        <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                          Semana {semanaActual.numero_semana}
                        </div>
                        <p className="text-secondary text-sm mb-6 max-w-sm">
                          Esta es la semana en curso basada en tu progreso manual de recaudación.
                        </p>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        <Link href={`/juntas/${juntaId}/semanas/${semanaActual.id}`} className="px-5 py-3 bg-primary text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
                           Administrar Semana Actual &rarr;
                        </Link>
                     </div>
                  </div>
                ) : null;
             })()}
          </div>

          {/* LISTA DE SEMANAS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CalendarDays className="text-primary" />
              Progreso General
            </h2>
            <SemanasCarousel semanas={semanas} juntaId={juntaId} />
          </div>

          {/* GESTIÓN DE PRÉSTAMOS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-border shadow-sm">
            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="text-primary" />
                Préstamos de este Grupo
              </h2>
              <Link href={`/prestamos/nuevo?junta=${juntaId}`} className="px-5 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 font-bold rounded-xl transition flex items-center gap-2 text-sm">
                + Otorgar Préstamo
              </Link>
            </div>
            
            {(() => {
                // Render loans locally using the component logic
                return (
                  <div>
                    <p className="text-muted-foreground text-sm mb-4">Los préstamos emitidos aquí programarán sus cuotas para que se cobren durante las semanas de esta misma junta.</p>
                    <Link href={`/prestamos`} className="text-primary font-medium hover:underline flex items-center gap-1 text-sm mt-4">
                       Ir al Panel Completo de Préstamos para ver estado de cuotas &rarr;
                    </Link>
                  </div>
                )
            })()}
          </div>
        </div>
      )}

    </div>
  )
}
