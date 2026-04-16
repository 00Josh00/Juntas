import { addParticipante } from '@/app/acciones/participantes'
import { SubmitButton } from '@/components/SubmitButton'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export default function NuevoParticipantePage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-10">
        <Link 
          href="/participantes"
          className="text-primary hover:underline font-medium inline-block mb-6"
        >
          &larr; Volver a participantes
        </Link>
        <h1 className="text-4xl font-extrabold flex items-center gap-3">
          <UserPlus className="h-10 w-10 text-primary" />
          Nuevo Participante
        </h1>
        <p className="text-secondary mt-2">
          Ingresa los datos para registrar un nuevo integrante del sistema.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-border p-8 md:p-10">
        <form action={addParticipante} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nombres <span className="text-destructive">*</span>
              </label>
              <input 
                type="text" 
                id="nombre" 
                name="nombre" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Juan Carlos"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="apellido" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Apellidos <span className="text-destructive">*</span>
              </label>
              <input 
                type="text" 
                id="apellido" 
                name="apellido" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Pérez García"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="dni" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                DNI / Documento
              </label>
              <input 
                type="text" 
                id="dni" 
                name="dni" 
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="telefono" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Teléfono
              </label>
              <input 
                type="tel" 
                id="telefono" 
                name="telefono" 
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="juan@ejemplo.com"
            />
          </div>

          <div className="pt-6 border-t border-border mt-8 flex justify-end gap-4">
            <Link 
              href="/participantes"
              className="px-6 py-3 border border-border text-slate-700 dark:text-slate-300 hover:bg-muted font-medium rounded-xl transition-colors inline-block text-center"
            >
              Cancelar
            </Link>
            <SubmitButton>
              Guardar Participante
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
