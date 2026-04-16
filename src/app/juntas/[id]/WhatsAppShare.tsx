'use client'

import { Share2 } from 'lucide-react'

export function WhatsAppShare({ 
  juntaNombre, 
  semanaActual, 
  pendientes 
}: { 
  juntaNombre: string, 
  semanaActual: number, 
  pendientes: string[] 
}) {
  const compartirSemana = () => {
    let mensaje = `🏦 *Semana ${semanaActual} — ${juntaNombre}*\n\n`
    if (pendientes.length > 0) {
      mensaje += `❌ *PENDIENTES POR COBRAR (${pendientes.length}):*\n`
      pendientes.forEach(p => mensaje += `- ${p}\n`)
    } else {
      mensaje += `✅ *¡TODOS AL DÍA EN ESTA SEMANA!*\n`
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  return (
    <button 
      onClick={compartirSemana}
      className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform hover:opacity-90"
      title="Compartir resumen por WhatsApp"
    >
      <Share2 className="h-4 w-4" />
    </button>
  )
}
