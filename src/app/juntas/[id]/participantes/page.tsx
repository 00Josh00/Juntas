import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
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
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href={`/juntas/${juntaId}`} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground font-medium truncate">{junta.nombre}</p>
          <h1 className="text-base font-bold text-foreground">Integrantes del Grupo</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-xl mx-auto">

        {/* RESUMEN */}
        <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-wider">{opciones.length} Integrantes</p>
            <p className="font-extrabold text-foreground text-xl">S/ {montoPorSemana.toFixed(2)}<span className="text-sm font-medium text-muted-foreground">/semana</span></p>
            <p className="text-xs text-muted-foreground">{totalOpciones} opciones totales · S/ {Number(junta.monto_por_opcion).toFixed(2)}/opción</p>
          </div>
        </div>

        {/* LISTA */}
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {opciones.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay integrantes en esta junta todavía.
              </div>
            ) : opciones.map((opc, idx) => (
              <div key={opc.id} className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 bg-muted rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {opc.participantes?.nombre} {opc.participantes?.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      S/ {(opc.cantidad_opciones * junta.monto_por_opcion).toFixed(2)}/sem
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3 text-right">
                  <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg">
                    x{opc.cantidad_opciones}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {opc.cantidad_opciones > 1 ? 'opciones' : 'opción'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
