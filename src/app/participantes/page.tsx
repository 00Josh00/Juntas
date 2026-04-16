import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Users, UserCheck, UserX } from 'lucide-react'
import { Participante } from '@/types/database'

export default async function ParticipantesPage() {
  const supabase = await createClient()

  const { data: participantes, error } = await supabase
    .from('participantes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            Participantes
          </h1>
          <p className="text-secondary mt-1 sm:text-lg">
            Gestión de integrantes de las juntas de dinero.
          </p>
        </div>

        <div className="flex gap-4">
          <Link 
            href="/"
            className="px-5 py-2.5 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-colors font-medium text-secondary hover:text-foreground inline-flex items-center"
          >
            &larr; Volver
          </Link>
          <Link 
            href="/participantes/nuevo"
            className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Nuevo Participante
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-8 border-2 border-dashed border-destructive/20 rounded-3xl text-center bg-destructive/5">
          <p className="text-destructive font-medium mb-2">No se pudo cargar la información</p>
          <p className="text-secondary text-sm">{error.message}</p>
        </div>
      ) : participantes && participantes.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-3 sm:p-5 font-semibold text-muted-foreground w-16 text-center text-xs sm:text-base">ID</th>
                  <th className="p-3 sm:p-5 font-semibold text-muted-foreground text-xs sm:text-base">Nombre Completo</th>
                  <th className="p-3 sm:p-5 font-semibold text-muted-foreground text-xs sm:text-base">Contacto</th>
                  <th className="p-3 sm:p-5 font-semibold text-muted-foreground text-xs sm:text-base">DNI</th>
                  <th className="p-3 sm:p-5 font-semibold text-muted-foreground text-center text-xs sm:text-base">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {participantes.map((p: Participante) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 sm:p-5 text-center text-muted-foreground font-mono text-xs sm:text-sm">
                      #{p.id}
                    </td>
                    <td className="p-3 sm:p-5">
                      <div className="font-medium text-foreground text-sm sm:text-base">
                        {p.nombre} {p.apellido}
                      </div>
                    </td>
                    <td className="p-3 sm:p-5 text-secondary">
                      <div className="flex flex-col gap-1 text-xs sm:text-sm">
                        {p.telefono && <span>📞 {p.telefono}</span>}
                        {p.email && <span>✉️ {p.email}</span>}
                        {!p.telefono && !p.email && <span className="text-muted-foreground italic">Sin contacto</span>}
                      </div>
                    </td>
                    <td className="p-3 sm:p-5 text-secondary text-xs sm:text-sm">
                      {p.dni || '-'}
                    </td>
                    <td className="p-3 sm:p-5 text-center">
                      {p.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <UserCheck className="h-3.5 w-3.5" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <UserX className="h-3.5 w-3.5" />
                          Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-16 border-2 border-dashed border-border rounded-3xl text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No hay participantes</h3>
          <p className="text-secondary max-w-md mx-auto mb-8">
            Aún no se han registrado personas en el sistema. Comienza agregando al primer participante.
          </p>
          <Link 
            href="/participantes/nuevo"
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Agregar Participante
          </Link>
        </div>
      )}
    </div>
  )
}
