export interface Participante {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  dni: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type JuntaEstado = 'configuracion' | 'activa' | 'cerrada' | 'cancelada';

export interface Junta {
  id: number;
  nombre: string;
  total_semanas: number;
  monto_por_opcion: number;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  estado: JuntaEstado;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpcionParticipante {
  id: number;
  junta_id: number;
  participante_id: number;
  cantidad_opciones: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Propiedades unidas (JOIN)
  participantes?: Participante;
}

export interface SemanaJunta {
  id: number;
  junta_id: number;
  numero_semana: number;
  fecha_semana: string | null;
  cerrada: boolean;
  created_at: string;
}

export type PagoEstado = 'pendiente' | 'pagado' | 'atrasado' | 'perdonado';

export interface PagoSemanal {
  id: number;
  semana_junta_id: number;
  participante_id: number;
  opciones_cantidad: number;
  monto_esperado: number;
  monto_pagado: number;
  fecha_pago: string | null;
  estado: PagoEstado;
  notas: string | null;
  participantes?: Participante;
}

export type PrestamoEstado = 'activo' | 'pagado_parcial' | 'pagado_total' | 'castigado';

export interface PrestamoDetalle {
  prestamo_id: number;
  junta: string;
  participante: string;
  monto_principal: number;
  tasa_interes: number;
  total_cuotas: number;
  cuotas_pagadas: number;
  cuotas_pendientes: number;
  cuota_fija: number;
  monto_total: number;
  total_pagado: number;
  saldo_pendiente: number;
  estado: PrestamoEstado;
  fecha_prestamo: string;
}


