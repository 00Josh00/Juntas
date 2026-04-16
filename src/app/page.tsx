import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { CalendarDays, Wallet, Settings, Users, PlusCircle, Activity } from 'lucide-react';
import { Junta, Participante } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // Traer Juntas
  const { data: juntasRaw } = await supabase
    .from('juntas')
    .select('*')
    .order('created_at', { ascending: false });

  const juntas = (juntasRaw || []) as Junta[];

  // Traer Participantes Globales (solo conteo o muestra)
  const { data: participantesRaw } = await supabase
    .from('participantes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5); // Una pequeña previsualización en el dashboard

  const participantes = (participantesRaw || []) as Participante[];
  const { count: totalParticipantes } = await supabase.from('participantes').select('*', { count: 'exact', head: true });

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`;

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-background">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Panel Principal
          </h1>
          <p className="text-secondary text-sm">Resumen global de todos tus grupos ("Banquitos") y participantes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA PRINCIPAL: JUNTAS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-border p-5 rounded-2xl shadow-sm">
             <div className="flex items-center gap-3">
               <Wallet className="text-primary h-6 w-6" />
               <h2 className="text-xl font-bold">Mis Grupos (Juntas)</h2>
             </div>
             <Link href="/juntas/nuevo" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm">
                <PlusCircle className="h-4 w-4" /> Nuevo Grupo
             </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {juntas.length === 0 ? (
               <div className="col-span-full p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground bg-muted/20">
                 No has creado ningún grupo todavía.
               </div>
            ) : juntas.map((j) => (
               <Link href={`/juntas/${j.id}`} key={j.id} className="block group">
                 <div className="bg-white dark:bg-slate-900 border border-border p-6 rounded-2xl shadow-sm hover:border-primary hover:shadow-md transition-all h-full relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{j.nombre}</h3>
                       {j.estado === 'activa' ? (
                          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Activa</span>
                       ) : j.estado === 'configuracion' ? (
                          <span className="bg-secondary/10 text-secondary text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Configuración</span>
                       ) : (
                          <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Cerrada</span>
                       )}
                    </div>
                    <div className="space-y-2 mb-4">
                       <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monto por opción:</span>
                          <span className="font-semibold">{formatCurrency(j.monto_por_opcion)}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Semanas Totales:</span>
                          <span className="font-semibold">{j.total_semanas}</span>
                       </div>
                    </div>
                    <div className="text-xs text-primary font-medium flex items-center gap-1">
                       Abrir gestión de este grupo &rarr;
                    </div>
                 </div>
               </Link>
            ))}
          </div>
        </div>

        {/* COLUMNA LATERAL: PARTICIPANTES */}
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-border p-5 rounded-2xl shadow-sm">
             <div className="flex items-center gap-3">
               <Users className="text-secondary h-6 w-6" />
               <h2 className="text-xl font-bold">Participantes</h2>
             </div>
             <Link href="/participantes" className="text-sm text-primary hover:underline font-medium">Ver todos ({totalParticipantes})</Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm">
             <div className="divide-y divide-border">
                {participantes.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No hay participantes registrados.</div>
                ) : participantes.map((p) => (
                  <div key={p.id} className="p-4 flex justify-between items-center">
                     <div>
                        <p className="font-bold text-sm text-foreground">{p.nombre} {p.apellido}</p>
                        {p.telefono && <p className="text-xs text-muted-foreground">{p.telefono}</p>}
                     </div>
                     <Activity className="h-4 w-4 text-secondary/30" />
                  </div>
                ))}
             </div>
             <div className="p-4 bg-muted/20 border-t border-border mt-auto">
                <Link href="/participantes/nuevo" className="w-full block text-center px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary font-medium rounded-lg transition text-sm">
                  + Registrar Nuevo
                </Link>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
