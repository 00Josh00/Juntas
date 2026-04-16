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
    if (estado === 'activa') return 'bg-indigo-50 text-indigo-700 border-indigo-100 border';
    if (estado === 'configuracion') return 'bg-slate-50 text-slate-500 border-slate-200 border';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100 border';
  };

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* HEADER */}
      <div className="px-4 pt-8 pb-10 bg-[#0f172a] text-white">
        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Sistema de Ahorros</p>
        <h1 className="text-3xl font-black tracking-tight mb-2">Mis Juntas</h1>
        <p className="text-slate-400 text-sm font-medium">Control fácil de tus ahorros y préstamos</p>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-2xl font-black leading-none">{juntas.length}</p>
            <p className="text-slate-500 text-[9px] uppercase font-bold mt-2 tracking-widest">Grupos</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-2xl font-black leading-none text-indigo-400">{juntasActivas}</p>
            <p className="text-slate-500 text-[9px] uppercase font-bold mt-2 tracking-widest">Activas</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-2xl font-black leading-none">{totalParticipantes ?? 0}</p>
            <p className="text-slate-500 text-[9px] uppercase font-bold mt-2 tracking-widest">Socios</p>
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
            <div className="space-y-4">
              {juntas.map((j) => (
                <Link href={`/juntas/${j.id}`} key={j.id} className="block">
                  <div className="bg-white border border-border rounded-2xl p-5 hover:border-indigo-400 shadow-premium transition-all active:scale-[0.99] group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${estadoStyle(j.estado)}`}>
                            {estadoIcon(j.estado)}
                            {j.estado === 'configuracion' ? 'Organizando' : (j.estado === 'activa' ? 'En marcha' : 'Terminado')}
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground text-base leading-tight truncate">{j.nombre}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">{Number(j.monto_por_opcion).toFixed(2)} / opción</span>
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

        {/* SOCIOS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground text-sm flex items-center gap-2 uppercase tracking-widest text-[10px]">
              Nuestros Socios
            </h2>
          </div>

          <Link href="/participantes" className="block">
            <div className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between hover:border-indigo-400 shadow-premium transition-all active:scale-[0.99] group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-foreground text-base">Socios Registrados</p>
                  <p className="text-[11px] text-slate-500 font-medium">{totalParticipantes ?? 0} socios en el sistema</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                Ver lista
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          </Link>
          

        </section>



      </div>
    </div>
  );
}
