import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Banknote, Clock, CheckCircle, ArrowLeft, Filter } from 'lucide-react'
import { PrestamoDetalle, Junta } from '@/types/database'
import { BotonEliminarPrestamo } from '@/app/prestamos/BotonEliminarPrestamo'
import { notFound } from 'next/navigation'

export default async function JuntaPrestamosPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ filter?: string }>
}) {
  const { id: juntaIdStr } = await params
  const { filter = 'todos' } = await searchParams
  const juntaId = parseInt(juntaIdStr, 10)
  const supabase = await createClient()

  const { data: junta } = await supabase.from('juntas').select('nombre').eq('id', juntaId).single()
  if (!junta) notFound()

  // Filtramos por la junta específica
  const { data: prestamosRaw, error } = await supabase
    .from('v_prestamos_detalle')
    .select('*')
    .eq('junta', junta.nombre)
    .order('fecha_prestamo', { ascending: false })

  let prestamos = (prestamosRaw || []) as PrestamoDetalle[]

  // Aplicar filtro
  if (filter === 'curso') {
    prestamos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'pagado_parcial')
  } else if (filter === 'pagados') {
    prestamos = prestamos.filter(p => p.estado === 'pagado_total')
  }

  const tabClass = (t: string) => `px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-border px-4 py-8 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100">Préstamos del Grupo</span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3 truncate">
              {junta.nombre}
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Lista de préstamos y sus estados de pago
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Link 
              href={`/juntas/${juntaId}`}
              className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-600 active:scale-95 text-xs flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
            <Link 
              href={`/prestamos/nuevo?junta=${juntaId}`}
              className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-premium active:scale-95 text-xs flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Plus className="h-4 w-4" /> Nuevo Préstamo
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        
        {/* FILTROS */}
        <div className="flex items-center gap-1 bg-white border border-border p-1.5 rounded-2xl mb-8 w-fit shadow-sm">
          <Link href={`?filter=todos`} className={tabClass('todos')}>Todos</Link>
          <Link href={`?filter=curso`} className={tabClass('curso')}>En Curso</Link>
          <Link href={`?filter=pagados`} className={tabClass('pagados')}>Pagados</Link>
        </div>

        {error ? (
          <div className="p-8 border-2 border-dashed border-rose-200 rounded-3xl text-center bg-rose-50/50">
            <p className="text-rose-600 font-black mb-2 uppercase tracking-widest text-[10px]">Error de Sistema</p>
            <p className="text-slate-600 text-sm font-medium">{error.message}</p>
          </div>
        ) : prestamos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {prestamos.map((prestamo, idx) => (
               <div key={idx} className="bg-white border border-border rounded-2xl p-6 shadow-premium hover:border-indigo-400 transition-all flex flex-col relative overflow-hidden group">
                  <div className="flex justify-between items-start border-b border-slate-50 pb-4 mb-4">
                     <div className="min-w-0 flex-1">
                       <h2 className="text-base font-black text-foreground truncate leading-tight group-hover:text-indigo-600 transition-colors">
                          {prestamo.participante}
                       </h2>
                       <div className="mt-1 flex items-center gap-2">
                        {prestamo.estado === 'activo' || prestamo.estado === 'pagado_parcial' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-tighter">
                                <Clock className="w-2.5 h-2.5" /> Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-tighter">
                                <CheckCircle className="w-2.5 h-2.5" /> Liquidado
                            </span>
                          )}
                       </div>
                     </div>
                     <BotonEliminarPrestamo 
                        prestamoId={Number((prestamo as any).prestamo_id) || 0} 
                        cuotasPagadas={prestamo.cuotas_pagadas} 
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                     <div>
                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Dinero Prestado</p>
                       <p className="text-lg font-black text-foreground">{Number(prestamo.monto_principal).toFixed(2)}</p>
                     </div>
                     <div>
                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Total a Devolver</p>
                       <p className="text-lg font-bold text-slate-400 italic">{Number(prestamo.monto_total).toFixed(2)}</p>
                     </div>
                  </div>

                  <div className={`p-4 rounded-xl flex justify-between items-center mt-auto border transition-colors ${prestamo.estado === 'pagado_total' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                     <div>
                       <p className="text-[9px] text-slate-500 mb-1 uppercase font-black tracking-tight">Pagos realizados</p>
                       <p className="font-black text-foreground text-sm">{prestamo.cuotas_pagadas} / {prestamo.total_cuotas} cuotas</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] text-rose-500 mb-1 uppercase font-black tracking-tight flex items-center justify-end gap-1">
                          Lo que falta pagar
                       </p>
                       <p className="font-black text-rose-600 text-lg">{Number(prestamo.saldo_pendiente).toFixed(2)}</p>
                     </div>
                  </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="p-16 border-2 border-dashed border-slate-100 rounded-3xl text-center flex flex-col items-center bg-white shadow-premium">
            <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Banknote className="h-10 w-10 text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">No se encontraron préstamos</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-10 text-sm font-medium">
              Aún no hay registros que coincidan con este filtro en este grupo.
            </p>
            {filter !== 'todos' ? (
              <Link href="?" className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Ver todos los préstamos</Link>
            ) : (
              <Link 
                href={`/prestamos/nuevo?junta=${juntaId}`}
                className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-premium flex items-center gap-2 active:scale-95 uppercase text-xs"
              >
                <Plus className="h-5 w-5" />
                Otorgar Préstamo
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
