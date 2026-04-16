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
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-primary" />
            Integrantes de la Junta
          </h2>
          {opciones.length >= 2 && (
            <button
              onClick={handleActivar}
              disabled={isActivating}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2"
            >
              {isActivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              ¡Iniciar Junta!
            </button>
          )}
        </div>

        {opciones.length === 0 && (
          <div className="p-4 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl mb-8">
            Debes agregar al menos a dos participantes para poder activar y comenzar la junta.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TABLA DE PARTICIPANTES AGREGADOS */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 font-semibold text-muted-foreground">Participante</th>
                    <th className="p-4 font-semibold text-muted-foreground text-center">Opciones (Cupos)</th>
                    <th className="p-4 font-semibold text-muted-foreground text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {opciones.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground italic">
                        No hay participantes agregados todavía.
                      </td>
                    </tr>
                  ) : (
                    opciones.map((opc) => (
                      <tr key={opc.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium text-foreground">
                          {opc.participantes?.nombre} {opc.participantes?.apellido}
                        </td>
                        <td className="p-4 text-center font-bold text-lg">
                          {opc.cantidad_opciones}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => removerParticipanteDeJunta(juntaId, opc.participante_id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Quitar participante"
                          >
                            <Trash2 className="h-5 w-5" />
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
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-muted/30 border border-border p-6 rounded-2xl">
              <h3 className="font-bold text-lg mb-4">Agregar Participante</h3>
              <form action={agregarParticipanteAJunta} className="space-y-4">
                <input type="hidden" name="junta_id" value={juntaId} />
                
                <div>
                  <label className="text-sm font-semibold block mb-1">Seleccionar Persona</label>
                  <select 
                    name="participante_id" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">-- Elige un participante --</option>
                    {participantesDisponibles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">Cantidad de Opciones</label>
                  <input 
                    type="number" 
                    name="cantidad_opciones"
                    min="1"
                    defaultValue="1"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">1 opción = pago normal semanal</p>
                </div>

                <SubmitButton className="w-full mt-2">
                  <Plus className="h-4 w-4" /> Agregar
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
