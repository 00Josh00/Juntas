'use client'

import { useState } from 'react'
import { registrarPago, revertirPago } from '@/app/acciones/pagos'
import { registrarCuota } from '@/app/acciones/prestamos'
import { CheckCircle2, RotateCcw, Loader2 } from 'lucide-react'
import { PagoEstado } from '@/types/database'

export function BotonManejarPago({ 
  pagoId, 
  montoEsperado, 
  estado,
  juntaId,
  semanaId,
  cuotaId,
  cuotaMonto
}: { 
  pagoId: number, 
  montoEsperado: number, 
  estado: PagoEstado,
  juntaId: number,
  semanaId: number,
  cuotaId?: number,
  cuotaMonto?: number
}) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    if (estado === 'pagado') {
      // Revertir pago de semana
      await revertirPago(pagoId, juntaId, semanaId)
      // Nota: Aquí no revertimos la cuota de préstamo por seguridad (tendrían que ir al panel de préstamos o la dejamos como está)
      // ya que revertir préstamos de una semana implica cálculos más complejos de saldo.
    } else {
      // Registrar pago semanal
      await registrarPago(pagoId, montoEsperado, juntaId, semanaId)
      // Si tiene cuota activa asociada, la pagamos en la misma transacción virtual
      if (cuotaId && cuotaMonto) {
         await registrarCuota(cuotaId, cuotaMonto)
      }
    }
    setLoading(false)
  }

  if (estado === 'pagado') {
    return (
      <button 
        onClick={handleAction}
        disabled={loading}
        className="px-4 py-2 border border-border text-secondary hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group w-full sm:w-auto text-sm"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 group-hover:-rotate-45 transition-transform" />}
        Revertir Pago Semanal
      </button>
    )
  }

  return (
    <button 
      onClick={handleAction}
      disabled={loading}
      className={`px-4 py-2 text-white rounded-xl font-medium transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-70 disabled:hover:scale-100 w-full sm:w-auto text-sm ${cuotaId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary hover:bg-blue-700'}`}
    >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {cuotaId ? 'Cobrar Opción + Cuota' : 'Cobrar Opción'}
    </button>
  )
}
