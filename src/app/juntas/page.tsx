import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, CalendarDays, Settings, Play, CheckCircle2, XCircle, ArrowLeft, ChevronRight } from 'lucide-react'
import { Junta } from '@/types/database'

const EstadoBadge = ({ estado }: { estado: string }) => {
  switch (estado) {
    case 'configuracion':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest"><Settings className="h-3 w-3" /> Organizando</span>
    case 'activa':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest"><Play className="h-3 w-3" /> En marcha</span>
    case 'cerrada':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-widest"><CheckCircle2 className="h-3 w-3" /> Finalizada</span>
    case 'cancelada':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-widest"><XCircle className="h-3 w-3" /> Cancelada</span>
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">{estado}</span>
  }
}

export default async function JuntasPage() {
  const supabase = await createClient()

  const { data: juntas, error } = await supabase
    .from('juntas')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* HEADER PROFESSIONAL */}
      <div className="bg-white border-b border-border px-4 py-8 mb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100">Grupos Activos</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-indigo-600" />
              Nuestras Juntas
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Tus grupos y ahorros</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Link 
              href="/"
              className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-600 active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
            <Link 
              href="/juntas/nuevo"
              className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-premium active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Crear Junta
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {error ? (
          <div className="p-8 border-2 border-dashed border-rose-200 rounded-3xl text-center bg-rose-50/50">
            <p className="text-rose-600 font-black mb-2 uppercase tracking-widest text-[10px]">Error de Sistema</p>
            <p className="text-slate-600 text-sm font-medium">{error.message}</p>
          </div>
        ) : juntas && juntas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {juntas.map((junta: Junta) => (
              <Link key={junta.id} href={`/juntas/${junta.id}`} className="group">
                <div className="bg-white border border-border rounded-2xl p-5 shadow-premium hover:border-indigo-400 transition-all active:scale-[0.99] h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1 mr-3">
                      <h2 className="text-lg font-black text-foreground group-hover:text-indigo-600 transition-colors leading-tight">
                        {junta.nombre}
                      </h2>
                    </div>
                    <EstadoBadge estado={junta.estado} />
                  </div>
                  
                  {junta.descripcion && (
                    <p className="text-slate-500 mb-6 text-xs font-medium line-clamp-2 leading-relaxed">
                      {junta.descripcion}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Cobro semanal</p>
                      <p className="font-black text-foreground text-sm">{Number(junta.monto_por_opcion).toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Duración</p>
                      <p className="font-black text-foreground text-sm">{junta.total_semanas} semanas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {junta.fecha_inicio ? `Inicia: ${new Date(junta.fecha_inicio).toLocaleDateString('es-PE')}` : 'Sin fecha definida'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-16 border-2 border-dashed border-slate-100 rounded-3xl text-center flex flex-col items-center bg-white shadow-premium">
            <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <CalendarDays className="h-10 w-10 text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">Aún no hay juntas</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-10 text-sm font-medium">
              Comienza configurando tu primera ronda de ahorros.
            </p>
            <Link 
              href="/juntas/nuevo"
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black transition shadow-premium flex items-center gap-2 active:scale-95 uppercase text-xs"
            >
              <Plus className="h-5 w-5" />
              Crear Primera Junta
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
