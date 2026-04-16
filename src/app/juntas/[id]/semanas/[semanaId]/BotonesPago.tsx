'use client'

import { useState } from 'react'
import { registrarPago, revertirPago } from '@/app/acciones/pagos'
import { CheckCircle2, RotateCcw, Loader2 } from 'lucide-react'
import { PagoEstado } from '@/types/database'

export function BotonManejarPago({ 
  pagoId, 
  montoEsperado, 
  estado,
  juntaId,
  semanaId 
}: { 
  pagoId: number, 
  montoEsperado: number, 
  estado: PagoEstado,
  juntaId: number,
  semanaId: number
}) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    if (estado === 'pagado') {
      await revertirPago(pagoId, juntaId, semanaId)
    } else {
      await registrarPago(pagoId, montoEsperado, juntaId, semanaId)
    }
    setLoading(false)
  }

  if (estado === 'pagado') {
    return (
      <button 
        onClick={handleAction}
        disabled={loading}
        className="px-4 py-2 border border-border text-secondary hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group w-full sm:w-auto"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 group-hover:-rotate-45 transition-transform" />}
        Revertir Pago
      </button>
    )
  }

  return (
    <button 
      onClick={handleAction}
      disabled={loading}
      className="px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl font-medium transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed w-full sm:w-auto"
    >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Confirmar Recepción
    </button>
  )
}
