'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'
import { deletePrestamo } from '@/app/acciones/prestamos'

export function BotonEliminarPrestamo({ prestamoId, cuotasPagadas }: { prestamoId: number, cuotasPagadas: number }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (cuotasPagadas > 0) return
    
    if (!confirm('¿Estás seguro de que deseas eliminar este préstamo? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    const result = await deletePrestamo(prestamoId)
    if (result?.error) {
      alert(result.error)
    }
    setLoading(false)
  }

  if (cuotasPagadas > 0) return null

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90 disabled:opacity-50"
      title="Eliminar préstamo (Solo si no tiene cuotas pagadas)"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  )
}
