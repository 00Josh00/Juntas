'use client'

import { useState, useEffect } from 'react'

export function CalculadoraPrestamo({ disponible }: { disponible: number }) {
  const [monto, setMonto] = useState<number>(0)
  const [tasa, setTasa] = useState<number>(10)
  const [cuotas, setCuotas] = useState<number>(4)

  const interesSoles = (monto * tasa) / 100
  const totalDevolver = monto + interesSoles
  const cuotaSemanal = cuotas > 0 ? totalDevolver / cuotas : 0

  const excedeCaja = monto > disponible

  return (
    <div className="space-y-6">
      
      {/* VISIBILIDAD DE CAJA */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${excedeCaja ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Dinero en Caja hoy</p>
          <p className={`text-xl font-black ${excedeCaja ? 'text-rose-600' : 'text-emerald-700'}`}>{disponible.toFixed(2)}</p>
        </div>
        {excedeCaja && (
          <div className="text-right">
             <p className="text-[10px] font-black text-rose-500 uppercase animate-pulse">⚠ Saldo insuficiente</p>
          </div>
        )}
      </div>

      {/* MONTO */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
          Monto a pedir <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            name="monto_principal"
            required
            step="0.01"
            min="1"
            value={monto || ''}
            onChange={(e) => setMonto(Number(e.target.value))}
            className={`w-full px-4 py-4 rounded-2xl border bg-white font-black text-2xl focus:outline-none focus:ring-2 transition-all ${excedeCaja ? 'border-rose-300 text-rose-600 focus:ring-rose-500/50' : 'border-slate-200 text-indigo-700 focus:ring-indigo-500/50'}`}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* TASA E CUOTAS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
            Tasa Interés (%)
          </label>
          <input
            type="number"
            name="tasa_interes"
            required
            step="0.1"
            min="0"
            value={tasa}
            onChange={(e) => setTasa(Number(e.target.value))}
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-tight">
            N° Cuotas
          </label>
          <input
            type="number"
            name="total_cuotas"
            required
            min="1"
            value={cuotas}
            onChange={(e) => setCuotas(Number(e.target.value))}
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* RESULTADOS EN TIEMPO REAL */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BanknoteIcon className="h-16 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-6 relative z-10">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">Interés Ganado</p>
            <p className="text-xl font-black text-white">{interesSoles.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">Cuota semanal</p>
            <p className="text-2xl font-black text-emerald-400">{cuotaSemanal.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-indigo-200 text-[10px] font-bold uppercase tracking-widest">
           <span>Total a devolver</span>
           <span className="text-white text-sm">{totalDevolver.toFixed(2)}</span>
        </div>
      </div>

    </div>
  )
}

function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
  )
}
