import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Banknote, Briefcase, Clock, CheckCircle } from 'lucide-react'
import { PrestamoDetalle } from '@/types/database'

export default async function PrestamosPage() {
  const supabase = await createClient()

  // Using the view created in DB: v_prestamos_detalle
  const { data: prestamosRaw, error } = await supabase
    .from('v_prestamos_detalle')
    .select('*')
    .order('fecha_prestamo', { ascending: false })

  const prestamos = (prestamosRaw || []) as PrestamoDetalle[]

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
            <Banknote className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            Préstamos Activos
          </h1>
          <p className="text-secondary mt-1 sm:text-lg">
            Administración de capital financiado de la bolsa de ahorros.
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
            href="/prestamos/nuevo"
            className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Otorgar Préstamo
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-8 border-2 border-dashed border-destructive/20 rounded-3xl text-center bg-destructive/5">
          <p className="text-destructive font-medium mb-2">Error obteniendo vista de préstamos</p>
          <p className="text-secondary text-sm">{error.message}</p>
        </div>
      ) : prestamos.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {prestamos.map((prestamo, idx) => (
             <div key={idx} className="bg-white dark:bg-slate-900 border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
                <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                   <div>
                     <h2 className="text-xl font-bold flex items-center gap-2">
                         <Briefcase className="h-5 w-5 text-primary" />
                         {prestamo.participante}
                     </h2>
                     <span className="text-xs font-semibold text-secondary bg-muted px-2 py-1 rounded-md mt-2 inline-block">
                        Junta: {prestamo.junta}
                     </span>
                   </div>
                   <div className="text-right">
                      {prestamo.estado === 'activo' || prestamo.estado === 'pagado_parcial' ? (
                         <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> ACTIVO
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> PAGADO
                         </span>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                   <div>
                     <div className="text-xs text-muted-foreground uppercase font-bold">Principal</div>
                     <div className="text-xl font-semibold">S/ {Number(prestamo.monto_principal).toFixed(2)}</div>
                   </div>
                   <div>
                     <div className="text-xs text-muted-foreground uppercase font-bold">Total (Con Interés)</div>
                     <div className="text-lg font-medium text-secondary">S/ {Number(prestamo.monto_total).toFixed(2)}</div>
                   </div>
                </div>

                <div className="bg-muted p-4 rounded-xl flex justify-between items-center">
                   <div>
                     <div className="text-xs text-muted-foreground mb-1">Cuotas</div>
                     <div className="font-bold text-foreground">{prestamo.cuotas_pagadas} / {prestamo.total_cuotas}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-xs text-muted-foreground mb-1">Saldo Restante</div>
                     <div className="font-extrabold text-destructive text-xl">S/ {Number(prestamo.saldo_pendiente).toFixed(2)}</div>
                   </div>
                </div>

             </div>
          ))}
        </div>
      ) : (
        <div className="p-16 border-2 border-dashed border-border rounded-3xl text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Banknote className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">Bandeja de préstamos vacía</h3>
          <p className="text-secondary max-w-md mx-auto mb-8">
            Aquí podrás revisar todos los prestamos otorgados y sus amortizaciones semanales respectivas.
          </p>
          <Link 
            href="/prestamos/nuevo"
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Préstamo
          </Link>
        </div>
      )}
    </div>
  )
}
