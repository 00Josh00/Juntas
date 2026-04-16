import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Users, ChevronRight } from 'lucide-react'
import { Junta, OpcionParticipante } from '@/types/database'

export default async function JuntaParticipantesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const juntaId = parseInt(id, 10)

  const { data: juntaRaw } = await supabase.from('juntas').select('*').eq('id', juntaId).single()
  if (!juntaRaw) notFound()
  const junta = juntaRaw as Junta

  const { data: opcionesRaw } = await supabase
    .from('opciones_participante')
    .select('*, participantes (*)')
    .eq('junta_id', juntaId)
    .order('created_at', { ascending: true })
  const opciones = (opcionesRaw || []) as OpcionParticipante[]

  const totalOpciones = opciones.reduce((a, o) => a + o.cantidad_opciones, 0)
  const montoPorSemana = totalOpciones * junta.monto_por_opcion

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/juntas/${juntaId}`} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{junta.nombre}</p>
            <h1 className="text-base font-black text-foreground">Socios del Grupo</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 max-w-2xl mx-auto">

        {/* RESUMEN FINANCIERO GRUPO */}
        <div className="bg-white border border-border rounded-3xl p-6 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="h-24 w-24 text-indigo-600" />
          </div>
          <div className="relative">
            <p className="text-indigo-700 text-[10px] font-black uppercase tracking-wider mb-2">Bolsa Semanal Colectiva</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground">{montoPorSemana.toFixed(2)}</span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] font-bold text-slate-400">
               <span>{opciones.length} Miembros</span>
               <span>·</span>
               <span>{totalOpciones} Opciones Totales</span>
            </div>
          </div>
        </div>

        {/* LISTA DE SOCIOS CON SUS APORTES */}
        <div className="space-y-3">
          <h2 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aportes por Persona</h2>
          
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-premium divide-y divide-slate-50">
            {opciones.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400 italic">
                No hay aportantes registrados todavía.
              </div>
            ) : opciones.map((opc, idx) => (
              <div key={opc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black text-indigo-600">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {opc.participantes?.nombre} {opc.participantes?.apellido}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {(opc.cantidad_opciones * junta.monto_por_opcion).toFixed(2)} por sesión
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3 text-right">
                  <span className="inline-block text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100">
                    x{opc.cantidad_opciones} OP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
