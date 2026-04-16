'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SemanaJunta } from '@/types/database'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function SemanasCarousel({ semanas, juntaId }: { semanas: SemanaJunta[], juntaId: number }) {
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 12

  const totalPages = Math.ceil(semanas.length / itemsPerPage)
  const currentSemanas = semanas.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium text-secondary">
          Mostrando {currentPage * itemsPerPage + 1} - {Math.min((currentPage + 1) * itemsPerPage, semanas.length)} de {semanas.length} semanas
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 bg-muted disabled:opacity-50 hover:bg-muted/80 rounded-lg transition-colors border border-border"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 bg-muted disabled:opacity-50 hover:bg-muted/80 rounded-lg transition-colors border border-border"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {currentSemanas.map((sem) => (
          <Link key={sem.id} href={`/juntas/${juntaId}/semanas/${sem.id}`}>
            <div className={`p-4 rounded-2xl border transition-all h-full ${sem.cerrada ? 'bg-muted/50 border-border hover:bg-muted/70' : 'bg-primary/5 border-primary/20 hover:border-primary cursor-pointer'}`}>
              <div className="text-sm font-semibold text-muted-foreground mb-1">S{sem.numero_semana}</div>
              <div className="font-medium text-foreground">
                {sem.fecha_semana ? new Date(sem.fecha_semana).toLocaleDateString() : 'Por definir'}
              </div>
              {sem.cerrada ? (
                <span className="text-xs text-green-600 font-medium inline-block mt-2">Cerrada</span>
              ) : (
                <span className="text-xs text-primary font-medium inline-block mt-2">En curso</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
