import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Banknote, Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import { PrestamoDetalle } from '@/types/database'
import { BotonEliminarPrestamo } from './BotonEliminarPrestamo'

export default async function PrestamosPage() {
  const supabase = await createClient()

  // Using the view created in DB: v_prestamos_detalle
  const { data: prestamosRaw, error } = await supabase
    .from('v_prestamos_detalle')
    .select('*')
    .order('fecha_prestamo', { ascending: false })

  const prestamos = (prestamosRaw || []) as PrestamoDetalle[]

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* HEADER SECTION - PROFESSIONAL LOOK */}
      <div className="bg-white border-b border-border px-4 py-8 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100">Finanzas</span>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3 truncate">
              <Banknote className="h-8 w-8 text-primary" />
              Gestión de Préstamos
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">
              Control de deudas y amortizaciones activas
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Link 
              href="/"
              className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-600 active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
            <Link 
              href="/prestamos/nuevo"
              className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-primary hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-premium active:scale-95 text-sm"
            >
              + Nuevo Préstamo
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {error ? (
          <div className="p-8 border-2 border-dashed border-destructive/20 rounded-3xl text-center bg-destructive/5">
            <p className="text-destructive font-medium mb-2">Error obteniendo vista de préstamos</p>
            <p className="text-secondary text-sm">{error.message}</p>
          </div>
        ) : prestamos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestamos.map((prestamo, idx) => (
               <div key={idx} className="bg-white border border-border rounded-2xl p-6 shadow-premium hover:border-primary/30 transition-all flex flex-col">
                  <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                     <div className="min-w-0 flex-1">
                       <h2 className="text-lg font-bold text-foreground truncate leading-tight">
                          {prestamo.participante}
                       </h2>
                       <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md mt-1.5 inline-block uppercase border border-slate-100">
                          {prestamo.junta}
                       </span>
                     </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                        {prestamo.estado === 'activo' || prestamo.estado === 'pagado_parcial' ? (
                           <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                              <Clock className="w-3 h-3" /> ACTIVO
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100">
                              <CheckCircle className="w-3 h-3" /> PAGADO
                           </span>
                        )}
                        
                        {/* ACCIÓN ELIMINAR */}
                        <BotonEliminarPrestamo 
                          prestamoId={Number((prestamo as any).id) || 0} 
                          cuotasPagadas={prestamo.cuotas_pagadas} 
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                     <div>
                       <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Capital</div>
                       <div className="text-lg font-bold text-foreground">{Number(prestamo.monto_principal).toFixed(2)}</div>
                     </div>
                     <div>
                       <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</div>
                       <div className="text-lg font-bold text-slate-600 italic">{Number(prestamo.monto_total).toFixed(2)}</div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center mt-auto border border-slate-100">
                     <div>
                       <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-tight">Cuotas</div>
                       <div className="font-extrabold text-foreground text-sm">{prestamo.cuotas_pagadas} de {prestamo.total_cuotas}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-tight">Saldo Pendiente</div>
                       <div className="font-black text-rose-600 text-lg">{Number(prestamo.saldo_pendiente).toFixed(2)}</div>
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
            <h3 className="text-xl font-bold mb-2 text-foreground">Sin préstamos activos</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm">
              Aquí podrás monitorear todos los prestamos otorgados y sus planes de pagos semanales.
            </p>
            <Link 
              href="/prestamos/nuevo"
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-premium flex items-center gap-2 active:scale-95"
            >
              + Otorgar Primer Préstamo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
