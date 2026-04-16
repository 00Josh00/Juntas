import { addJunta } from '@/app/acciones/juntas'
import { SubmitButton } from '@/components/SubmitButton'
import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'

export default function NuevaJuntaPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-10">
        <Link 
          href="/juntas"
          className="text-primary hover:underline font-medium inline-block mb-6"
        >
          &larr; Volver a juntas
        </Link>
        <h1 className="text-4xl font-extrabold flex items-center gap-3">
          <CalendarPlus className="h-10 w-10 text-primary" />
          Crear Junta
        </h1>
        <p className="text-secondary mt-2 text-lg">
          Configura las reglas base para una nueva ronda de ahorros.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-border p-8 md:p-10">
        <form action={addJunta} className="space-y-8">
          <div className="space-y-2">
            <label htmlFor="nombre" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Nombre de la Junta <span className="text-destructive">*</span>
            </label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre" 
              required 
              maxLength={150}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg font-medium"
              placeholder="Ej: Junta Navideña 2026"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="monto_por_opcion" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Monto Base Semanal (por Opción) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">S/</span>
                <input 
                  type="number" 
                  id="monto_por_opcion" 
                  name="monto_por_opcion" 
                  required
                  step="0.01"
                  min="0.01"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="20.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">Si un participante toma 2 opciones, pagará el doble.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="total_semanas" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Total de Semanas / Rondas <span className="text-destructive">*</span>
              </label>
              <input 
                type="number" 
                id="total_semanas" 
                name="total_semanas" 
                required 
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fecha_inicio" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Fecha de Inicio (Opcional)
            </label>
            <input 
              type="date" 
              id="fecha_inicio" 
              name="fecha_inicio" 
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="descripcion" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Descripción o Reglas Internas
            </label>
            <textarea 
              id="descripcion" 
              name="descripcion" 
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              placeholder="Notas, condiciones de atraso, consideraciones..."
            />
          </div>

          <div className="pt-6 border-t border-border mt-8 flex justify-end gap-4 items-center">
            <Link 
              href="/juntas"
              className="px-6 py-3 border border-border text-slate-700 dark:text-slate-300 hover:bg-muted font-medium rounded-xl transition-colors"
            >
              Cancelar
            </Link>
            <SubmitButton>
              Generar Junta
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
