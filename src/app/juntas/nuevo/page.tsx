import { addJunta } from '@/app/acciones/juntas'
import { SubmitButton } from '@/components/SubmitButton'
import Link from 'next/link'
import { CalendarPlus, ArrowLeft } from 'lucide-react'

export default function NuevaJuntaPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* HEADER PROFESSIONAL */}
      <div className="bg-white border-b border-border px-4 py-8 mb-6 text-center sm:text-left">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3 justify-center sm:justify-start">
              <CalendarPlus className="h-8 w-8 text-indigo-600" />
              Nueva Junta
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Define las reglas base para tu nuevo grupo de ahorro
            </p>
          </div>
          <Link 
            href="/"
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-600 active:scale-95 text-xs flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl border border-border p-6 sm:p-10 shadow-premium">
          <form action={addJunta} className="space-y-6">
            
            <div className="space-y-1.5">
              <label htmlFor="nombre" className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                Nombre del Grupo <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                id="nombre" 
                name="nombre" 
                required 
                maxLength={150}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Ej: Ahorro Familiar 2026"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="monto_por_opcion" className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                  Monto Semanal por Opción <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number" 
                  id="monto_por_opcion" 
                  name="monto_por_opcion" 
                  required
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="0.00"
                />
                <p className="text-[10px] text-slate-400 font-medium">Ejemplo: 50.00</p>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="total_semanas" className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                  Duración Total (Semanas) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number" 
                  id="total_semanas" 
                  name="total_semanas" 
                  required 
                  min="1"
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="24"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fecha_inicio" className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                Fecha de Inicio estimada
              </label>
              <input 
                type="date" 
                id="fecha_inicio" 
                name="fecha_inicio" 
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="descripcion" className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
                Reglas o Notas Adicionales
              </label>
              <textarea 
                id="descripcion" 
                name="descripcion" 
                rows={3}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                placeholder="Monto de multa, orden de cobro, etc."
              />
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <Link 
                href="/"
                className="order-2 sm:order-1 px-8 py-3.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-black rounded-2xl transition-all text-sm text-center"
              >
                CANCELAR
              </Link>
              <SubmitButton className="order-1 sm:order-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-premium active:scale-95">
                GENERAR GRUPO DE AHORRO
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
