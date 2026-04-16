import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Users, UserCheck, UserX, ArrowLeft, Search, Phone, Mail, ChevronRight } from 'lucide-react'
import { Participante } from '@/types/database'
import { SocioActions } from './SocioActions'

export default async function ParticipantesPage() {
  const supabase = await createClient()

  const { data: participantes, error } = await supabase
    .from('participantes')
    .select('*')
    .order('nombre', { ascending: true })

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* HEADER PROFESSIONAL */}
      <div className="bg-white border-b border-border px-4 py-8 mb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">Directorio</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-indigo-600" />
              Nuestros Socios
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">
              Administración de miembros y sus datos de contacto
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Link 
              href="/"
              className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-600 active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
            <Link 
              href="/participantes/nuevo"
              className="flex-1 sm:flex-none text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-black shadow-premium active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Agregar Socio
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">

        {error ? (
          <div className="p-8 border-2 border-dashed border-rose-200 rounded-3xl text-center bg-rose-50/50">
            <p className="text-rose-600 font-black mb-2 uppercase tracking-widest text-[10px]">Error de Sistema</p>
            <p className="text-slate-600 text-sm font-medium">{error.message}</p>
          </div>
        ) : participantes && participantes.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista Alfabética ({participantes.length})</span>
            </div>
            
            {participantes.map((p: Participante) => (
              <div key={p.id} className="bg-white border border-border rounded-xl p-4 shadow-premium hover:border-indigo-400 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm border ${p.activo ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {p.nombre.charAt(0)}{p.apellido.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground text-base truncate">{p.nombre} {p.apellido}</p>
                      {!p.activo && (
                        <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-100 uppercase">INACTIVO</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      {p.telefono && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Phone className="h-3 w-3 text-slate-300" /> {p.telefono}
                        </div>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                          <Mail className="h-3 w-3 text-slate-300" /> {p.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <SocioActions socio={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 border-2 border-dashed border-slate-100 rounded-3xl text-center flex flex-col items-center bg-white shadow-premium">
            <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">El registro está vacío</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-10 text-sm font-medium">
              No se han encontrado socios registrados. Comienza creando el primer perfil de tu red.
            </p>
            <Link 
              href="/participantes/nuevo"
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-premium flex items-center gap-2 active:scale-95 uppercase text-xs"
            >
              <Plus className="h-5 w-5" />
              Agregar Primer Socio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
