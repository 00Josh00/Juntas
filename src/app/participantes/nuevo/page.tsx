import { addParticipante } from '@/app/acciones/participantes'
import { SubmitButton } from '@/components/SubmitButton'
import Link from 'next/link'
import { UserPlus, ArrowLeft, Users } from 'lucide-react'

export default function NuevoParticipantePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* HEADER PROFESSIONAL */}
      <div className="bg-white border-b border-border px-4 py-8 mb-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">Nuevo Perfil</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-indigo-600" />
              Registrar Socio
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Define los datos de contacto y membrecía</p>
          </div>
          <Link 
            href="/participantes"
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-600 active:scale-95 text-xs flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Cancelar
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl border border-border p-6 sm:p-10 shadow-premium">
          <form action={addParticipante} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">Nombres <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="nombre" 
                  required 
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Ej: Juan Carlos"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">Apellidos <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="apellido" 
                  required 
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Ej: Pérez García"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">DNI / Identificación</label>
                <input 
                  type="text" 
                  name="dni" 
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="87654321"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">Teléfono / Celular</label>
                <input 
                  type="tel" 
                  name="telefono" 
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="+51 900 000 000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">Correo Electrónico (Opcional)</label>
              <input 
                type="email" 
                name="email" 
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="socio@ejemplo.com"
              />
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <Link 
                href="/participantes"
                className="order-2 sm:order-1 px-8 py-3.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-black rounded-2xl transition-all text-xs text-center"
              >
                CANCELAR
              </Link>
              <SubmitButton className="order-1 sm:order-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-premium active:scale-95 uppercase tracking-widest">
                Guardar Nuevo Socio
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
