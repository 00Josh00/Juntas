import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import { Briefcase } from 'lucide-react'
import { addPrestamo } from '@/app/acciones/prestamos'

export default async function NuevoPrestamoPage() {
  const supabase = await createClient()

  // Obtener juntas activas
  const { data: juntas } = await supabase.from('juntas').select('id, nombre').in('estado', ['activa', 'configuracion'])
  
  // Obtener participantes (para el MVP, mostramos todos los activos, aunque en la BD se filtran al seleccionarlo idealmente)
  const { data: participantes } = await supabase.from('participantes').select('id, nombre, apellido').eq('activo', true)

  return (
    <div className="p-8 max-w-3xl mx-auto">
       <div className="mb-10">
        <Link href="/prestamos" className="text-primary hover:underline font-medium inline-block mb-6">
          &larr; Volver a Préstamos
        </Link>
        <h1 className="text-4xl font-extrabold flex items-center gap-3">
          <Briefcase className="h-10 w-10 text-primary" />
          Registrar Préstamo
        </h1>
        <p className="text-secondary mt-2 text-lg">
          Genera un nuevo acuerdo con sus cuotas correspondientes y capital calculado automáticamente.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-border p-8 md:p-10">
        <form action={addPrestamo} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Junta Asociada <span className="text-destructive">*</span></label>
                <select name="junta_id" required className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Selecciona una Junta</option>
                  {(juntas || []).map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Participante <span className="text-destructive">*</span></label>
                <select name="participante_id" required className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Beneficiario</option>
                  {(participantes || []).map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100" title="Capital a enviar prestado">Monto Solicitado (S/) <span className="text-destructive">*</span></label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">S/</span>
                   <input type="number" name="monto_principal" required step="0.01" min="1" placeholder="500.00" className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Semana de Emisión (ID de semana) <span className="text-destructive">*</span></label>
                <input type="number" name="semana_inicio_id" required placeholder="Ex: ID de semana_junta" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"/>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tasa de Interés Total (%) <span className="text-destructive">*</span></label>
                <input type="number" name="tasa_interes" required step="0.01" min="0" defaultValue="10" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"/>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total Cuotas <span className="text-destructive">*</span></label>
                <input type="number" name="total_cuotas" required min="1" defaultValue="4" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"/>
             </div>
           </div>

           <div className="pt-6 border-t border-border mt-8 flex justify-end gap-4 items-center">
            <Link href="/prestamos" className="px-6 py-3 border border-border text-slate-700 dark:text-slate-300 hover:bg-muted font-medium rounded-xl transition-colors inline-block text-center">
              Cancelar
            </Link>
            <SubmitButton>Confirmar Préstamo</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
