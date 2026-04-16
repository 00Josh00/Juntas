'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { avanzarSemanaDashboard, retrocederSemanaDashboard } from '@/app/acciones/navegacion_semanas'

export function DashboardFooter({ 
  juntaId, 
  semanaActualId, 
  numeroSemanaActual, 
  totalSemanas 
}: { 
  juntaId: number, 
  semanaActualId?: number,
  numeroSemanaActual: number,
  totalSemanas: number
}) {
  const [loading, setLoading] = useState(false)

  const handleRetroceder = async () => {
    if (numeroSemanaActual <= 1 || loading) return
    if (!confirm(`¿Deseas retroceder a la semana ${numeroSemanaActual - 1}?`)) return
    setLoading(true)
    await retrocederSemanaDashboard(juntaId, numeroSemanaActual)
    setLoading(false)
  }

  const handleAvanzar = async () => {
    if (numeroSemanaActual >= totalSemanas || loading) return
    if (!confirm(`¿Finalizar semana ${numeroSemanaActual} y avanzar a la ${numeroSemanaActual + 1}?`)) return
    setLoading(true)
    await avanzarSemanaDashboard(juntaId, numeroSemanaActual)
    setLoading(false)
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 p-8 flex justify-center pointer-events-none">
      <div className="max-w-[280px] w-full flex items-center justify-between bg-white border border-slate-100 rounded-[2.5rem] p-2 shadow-2xl shadow-indigo-100/50 pointer-events-auto backdrop-blur-sm bg-white/90">
        <button 
          onClick={handleRetroceder}
          disabled={loading || numeroSemanaActual <= 1}
          className="w-14 h-14 flex items-center justify-center rounded-[1.8rem] bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-0 transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6 stroke-[3]" />
        </button>

        <div className="text-center px-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Semana</p>
          <p className="text-2xl font-black text-slate-900 leading-none">{numeroSemanaActual}</p>
        </div>

        <button 
          onClick={handleAvanzar}
          disabled={loading || numeroSemanaActual >= totalSemanas}
          className="w-14 h-14 flex items-center justify-center rounded-[1.8rem] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-0 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ChevronRight className="h-6 w-6 stroke-[3]" />
          )}
        </button>
      </div>
    </footer>
  )
}
