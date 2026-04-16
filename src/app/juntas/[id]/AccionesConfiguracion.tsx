'use client'

import { useState } from 'react'
import { Participante, OpcionParticipante } from '@/types/database'
import { agregarParticipanteAJunta, removerParticipanteDeJunta, activarJunta } from '@/app/acciones/detalles_junta'
import { Plus, Trash2, Users, Play, Loader2 } from 'lucide-react'
import { SubmitButton } from '@/components/SubmitButton'

export function AccionesConfiguracion({
  juntaId,
  opciones,
  participantesDisponibles,
}: {
  juntaId: number
  opciones: OpcionParticipante[]
  participantesDisponibles: Participante[]
}) {
  const [isActivating, setIsActivating] = useState(false)

  const handleActivar = async () => {
    if (!confirm('¿Estás seguro de que deseas iniciar la junta? Esto generará todas las semanas correspondientes y no se podrá revertir al estado de configuración.')) {
      return
    }
    setIsActivating(true)
    await activarJunta(juntaId)
    setIsActivating(false)
  }

  return (
    <div className="space-y-6">
      {/* SECCIÓN DE PARTICIPANTES (CONFIGURACIÓN) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-premium">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2 text-foreground">
              <Users className="text-primary h-6 w-6" />
              Configurar Integrantes
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Suma personas a este grupo para iniciar la junta.</p>
          </div>
          {opciones.length >= 2 && (
            <button
              onClick={handleActivar}
              disabled={isActivating}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-premium flex items-center justify-center gap-2"
            >
              {isActivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              ¡INICIAR JUNTA!
            </button>
          )}
        </div>

        {opciones.length === 0 && (
          <div className="p-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-2xl mb-8 font-bold text-sm">
            Nota: Debes agregar al menos a dos personas para poder activar este grupo.
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* TABLA DE PARTICIPANTES AGREGADOS */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Participante</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Opciones</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {opciones.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-slate-400 italic text-sm">
                        Sin participantes todavía.
                      </td>
                    </tr>
                  ) : (
                    opciones.map((opc) => (
                      <tr key={opc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-sm text-foreground">
                          {opc.participantes?.nombre} {opc.participantes?.apellido}
                        </td>
                        <td className="p-4 text-center">
                           <span className="bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-lg text-sm">
                            {opc.cantidad_opciones}
                           </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => removerParticipanteDeJunta(juntaId, opc.participante_id)}
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                            title="Quitar integrante"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FORMULARIO PARA AGREGAR PARTICIPANTE */}
          <div className="w-full lg:w-80 order-1 lg:order-2">
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6">Nuevo Integrante</h3>
              <form action={agregarParticipanteAJunta} className="space-y-5">
                <input type="hidden" name="junta_id" value={juntaId} />
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">Persona</label>
                  <select 
                    name="participante_id" 
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="">-- Seleccionar --</option>
                    {participantesDisponibles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">Cantidad Opciones</label>
                  <input 
                    type="number" 
                    name="cantidad_opciones"
                    min="1"
                    defaultValue="1"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">1 opción = monto base semanal</p>
                </div>

                <SubmitButton className="w-full mt-4 bg-indigo-600 text-white rounded-2xl font-black text-xs py-3.5 shadow-premium">
                  <Plus className="h-4 w-4" /> AGREGAR A LISTA
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
