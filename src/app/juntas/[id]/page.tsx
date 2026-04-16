import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CalendarDays, Settings, Play, CheckCircle2, XCircle, Users, AlertCircle } from 'lucide-react'
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-border shadow-sm">
           <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CalendarDays className="text-primary" />
            Progreso Semanal
          </h2>
          
          <SemanasCarousel semanas={semanas} juntaId={juntaId} />
        </div>
      )}

    </div>
  )
}
