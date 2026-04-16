import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, CalendarDays, Settings, Play, CheckCircle2, XCircle } from 'lucide-react'
import { Junta } from '@/types/database'

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

export default async function JuntasPage() {
  const supabase = await createClient()

  const { data: juntas, error } = await supabase
    .from('juntas')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
            <CalendarDays className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            Juntas
          </h1>
          <p className="text-secondary mt-1 sm:text-lg">
            Control de rondas de ahorro y prestamos activos.
          </p>
        </div>

        <div className="flex gap-4">
          <Link 
            href="/"
            className="px-5 py-2.5 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-colors font-medium text-secondary hover:text-foreground inline-flex items-center"
          >
            &larr; Volver
          </Link>
          <Link 
            href="/juntas/nuevo"
            className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Nueva Junta
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-8 border-2 border-dashed border-destructive/20 rounded-3xl text-center bg-destructive/5">
          <p className="text-destructive font-medium mb-2">No se pudo cargar la información</p>
          <p className="text-secondary text-sm">{error.message}</p>
          <Link href="/" className="mt-4 text-primary hover:underline font-medium inline-block">Regresar al inicio</Link>
        </div>
      ) : juntas && juntas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {juntas.map((junta: Junta) => (
            <div key={junta.id} className="group p-6 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              {/* Contenedor del contenido */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-foreground pr-4 line-clamp-2 leading-tight">
                    {junta.nombre}
                  </h2>
                  <div className="shrink-0 mt-1">
                    <EstadoBadge estado={junta.estado} />
                  </div>
                </div>
                
                {junta.descripcion && (
                  <p className="text-secondary mb-6 text-sm line-clamp-3">
                    {junta.descripcion}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">Monto por Opción</div>
                    <div className="font-semibold text-lg text-foreground">S/ {Number(junta.monto_por_opcion).toFixed(2)}</div>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">Semanas</div>
                    <div className="font-semibold text-lg text-foreground">{junta.total_semanas}</div>
                  </div>
                </div>
              </div>
              
              {/* Footer de la tarjeta */}
              <div className="pt-4 border-t border-border mt-auto flex justify-between items-center text-sm">
                <span className="text-secondary font-medium">
                  Inicio: {junta.fecha_inicio ? new Date(junta.fecha_inicio).toLocaleDateString() : 'Por definir'}
                </span>
                <Link href={`/juntas/${junta.id}`} className="text-primary font-semibold hover:underline px-2 py-1">
                  Ver detalles &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 border-2 border-dashed border-border rounded-3xl text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarDays className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No hay juntas registradas</h3>
          <p className="text-secondary max-w-md mx-auto mb-8">
            Comienza configurando tu primera junta de ahorros para administrar los pagos y préstamos.
          </p>
          <Link 
            href="/juntas/nuevo"
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Crear Primera Junta
          </Link>
        </div>
      )}
    </div>
  )
}
