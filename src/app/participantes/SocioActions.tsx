'use client'

import { useState } from 'react'
import { updateParticipante, deleteParticipante } from '@/app/acciones/participantes'
import { Edit2, Trash2, X, Check, Save, User, Phone, Mail, Fingerprint, Activity } from 'lucide-react'
import { Participante } from '@/types/database'

export function SocioActions({ socio }: { socio: Participante }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isDeleting) {
    return (
      <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-xl animate-in fade-in slide-in-from-right-2">
        <p className="text-[10px] font-bold text-rose-700 uppercase">¿Eliminar?</p>
        <button 
          onClick={async () => {
            const res = await deleteParticipante(socio.id)
            if (res?.error) setError(res.error)
            else setIsDeleting(false)
          }}
          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Check className="h-4 w-4" />
        </button>
        <button 
          onClick={() => setIsDeleting(false)}
          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {error && <p className="fixed bottom-4 right-4 bg-rose-600 text-white p-4 rounded-2xl shadow-premium text-xs font-bold z-50">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => setIsEditing(true)}
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button 
        onClick={() => setIsDeleting(true)}
        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* MODAL EDITAR */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-premium overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-indigo-600" />
                Editar Perfil de Socio
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <form action={async (fd) => {
              const res = await updateParticipante(fd)
              if (res?.success) setIsEditing(false)
              else if (res?.error) setError(res.error)
            }} className="p-6 space-y-4">
              <input type="hidden" name="id" value={socio.id} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre</label>
                  <input name="nombre" defaultValue={socio.nombre} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none font-bold text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Apellido</label>
                  <input name="apellido" defaultValue={socio.apellido} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none font-bold text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input name="telefono" defaultValue={socio.telefono || ''} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none font-medium text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input name="email" type="email" defaultValue={socio.email || ''} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none font-medium text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">DNI / Identificación</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input name="dni" defaultValue={socio.dni || ''} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none font-bold text-sm" />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <input type="checkbox" id="activo" name="activo" defaultChecked={socio.activo} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="activo" className="text-[11px] font-black uppercase text-slate-600 cursor-pointer flex items-center gap-2">
                  <Activity className="h-3 w-3" /> Socio en Estado Activo
                </label>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-premium transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
