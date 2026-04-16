import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Wallet, Users, PlusCircle, ChevronRight, Activity, CheckCircle2, Settings, Play } from 'lucide-react';
import { Junta, Participante } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  const { data: juntasRaw } = await supabase
    .from('juntas')
    .select('*')
    .order('created_at', { ascending: false });
  const juntas = (juntasRaw || []) as Junta[];

  const { data: participantesRaw } = await supabase
    .from('participantes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);
  const participantes = (participantesRaw || []) as Participante[];

  const { count: totalParticipantes } = await supabase
    .from('participantes')
    .select('*', { count: 'exact', head: true });

  const juntasActivas = juntas.filter(j => j.estado === 'activa').length;
  const juntasConfig = juntas.filter(j => j.estado === 'configuracion').length;

  const estadoIcon = (estado: string) => {
    if (estado === 'activa') return <Play className="h-3.5 w-3.5" />;
    if (estado === 'configuracion') return <Settings className="h-3.5 w-3.5" />;
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  };

  const estadoStyle = (estado: string) => {
    if (estado === 'activa') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    if (estado === 'configuracion') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  };

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* HEADER */}
      <div className="px-4 pt-8 pb-6 bg-gradient-to-b from-blue-950 to-blue-900 text-white">
        <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">Panel Principal</p>
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Mis Juntas de Dinero</h1>
        <p className="text-blue-200/70 text-sm">Gestiona tus grupos, pagos y préstamos</p>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold">{juntas.length}</p>
            <p className="text-blue-200 text-[10px] uppercase font-semibold mt-0.5">Grupos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold">{juntasActivas}</p>
            <p className="text-blue-200 text-[10px] uppercase font-semibold mt-0.5">Activos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold">{totalParticipantes ?? 0}</p>
            <p className="text-blue-200 text-[10px] uppercase font-semibold mt-0.5">Personas</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-5">

        {/* JUNTAS */}
        <section>
          <div className="flex items-center justify-between mb-3 mt-5">
            <h2 className="font-bold text-foreground text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Mis Grupos
            </h2>
            <Link
              href="/juntas/nuevo"
              className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Nuevo
            </Link>
          </div>

          {juntas.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">No tienes grupos creados aún.</p>
              <Link href="/juntas/nuevo" className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
                Crear mi primer grupo →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {juntas.map((j) => (
                <Link href={`/juntas/${j.id}`} key={j.id} className="block">
                  <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 hover:border-primary hover:shadow-sm transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${estadoStyle(j.estado)}`}>
                            {estadoIcon(j.estado)}
                            {j.estado === 'configuracion' ? 'Config' : j.estado}
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground text-base leading-tight truncate">{j.nombre}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">S/ {Number(j.monto_por_opcion).toFixed(2)}/opción</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{j.total_semanas} sem</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* PARTICIPANTES */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" />
              Participantes
            </h2>
            <Link href="/participantes" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
              Ver todos ({totalParticipantes ?? 0})
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
            {participantes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No hay personas registradas todavía.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {participantes.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-xs font-bold">
                          {p.nombre.charAt(0)}{p.apellido.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{p.nombre} {p.apellido}</p>
                        {p.telefono && <p className="text-xs text-muted-foreground">{p.telefono}</p>}
                      </div>
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 bg-muted/30 border-t border-border">
              <Link
                href="/participantes/nuevo"
                className="w-full block text-center py-2.5 bg-white dark:bg-slate-800 border border-border hover:border-primary text-foreground font-semibold rounded-xl transition text-sm"
              >
                + Registrar Persona Nueva
              </Link>
            </div>
          </div>
        </section>

        {/* ACCESO RAPIDO A PRESTAMOS */}
        <section>
          <Link href="/prestamos" className="block">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Panel Global</p>
                <p className="font-bold text-base">Estado de Préstamos →</p>
                <p className="text-indigo-200/80 text-xs mt-1">Ver cuotas, saldos y estado de préstamos</p>
              </div>
              <Wallet className="h-10 w-10 text-white/20 flex-shrink-0" />
            </div>
          </Link>
        </section>

      </div>
    </div>
  );
}
