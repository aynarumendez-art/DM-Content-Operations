export type ClientStatus =
  | 'Prospecto' | 'Activo' | 'Pendiente de pago' | 'Pausado por pago'
  | 'Pausado por cliente' | 'En cancelación' | 'Finalizado' | 'No renovó'

export type ProductionStatus =
  | 'Idea' | 'Guion pendiente' | 'Guion listo' | 'Por grabar' | 'Grabado'
  | 'En edición' | 'Edición lista' | 'En revisión interna' | 'Enviado al cliente'
  | 'Esperando comentarios' | 'En corrección' | 'Aprobado' | 'Programado'
  | 'Publicado' | 'Pausado por pago' | 'Pausado por cliente' | 'Cancelado'

export type PaymentStatus =
  | 'Pendiente' | 'Pagado' | 'Pagado parcial' | 'Atrasado'
  | 'En validación' | 'No recibido' | 'Pausado por pago'

export type CalendarStatus =
  | 'Por crear' | 'En estrategia' | 'Enviado al cliente' | 'Esperando aprobación'
  | 'En corrección' | 'Aprobado' | 'En producción' | 'En publicación' | 'Cerrado' | 'Pausado'

export type ExtraStatus =
  | 'Solicitado' | 'Cotizado' | 'Aprobado' | 'Pagado'
  | 'En producción' | 'Entregado' | 'Cancelado'

export type InternalPaymentStatus =
  | 'Pendiente' | 'Aprobado' | 'Pagado'
  | 'Retenido por falta de pago del cliente' | 'En revisión' | 'Cancelado'

export interface Client {
  id: string
  name: string
  brand: string | null
  contact_name: string | null
  whatsapp: string | null
  email: string | null
  instagram: string | null
  city: string | null
  country: string | null
  status: ClientStatus
  start_date: string | null
  renewal_date: string | null
  cancellation_deadline: string | null
  approval_contact: string | null
  accesses_delivered: boolean
  folder_link: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ContractedPlan {
  id: string
  client_id: string
  plan_name: 'Plan Inicial' | 'Plan Avanzado' | 'Plan Profesional' | 'Campaña Especial'
  monthly_price: number
  currency: string
  start_date: string | null
  current_cycle: number
  status: 'Activo' | 'Pausado' | 'Cancelado' | 'Finalizado'
  includes_community: boolean
  includes_dms: boolean
  reels_count: number
  carousels_count: number
  stories_count: number
  sessions_count: number
  recording_hours: number
  locations_count: number
  revision_rounds: number
  special_conditions: string | null
  created_at: string
}

export interface ClientPayment {
  id: string
  client_id: string
  plan_id: string | null
  service_month: string
  total_amount: number
  initial_payment: number | null
  initial_deadline: string | null
  initial_status: string
  second_payment: number | null
  second_deadline: string | null
  second_status: string
  payment_method: string | null
  receipt_url: string | null
  payment_date: string | null
  delay_days: number
  operational_status: string
  notes: string | null
  created_at: string
  updated_at: string
  clients?: { name: string; brand: string | null }
}

export interface ContentPiece {
  id: string
  client_id: string
  calendar_id: string | null
  month: string
  piece_type: string
  title: string
  content_pillar: string | null
  objective: string | null
  format: string | null
  channel: string | null
  recording_date: string | null
  internal_delivery_date: string | null
  client_send_date: string | null
  approval_deadline: string | null
  publication_date: string | null
  production_status: ProductionStatus
  copy_text: string | null
  cta: string | null
  revision_1: string | null
  revision_2: string | null
  final_approval: boolean
  published: boolean
  publication_link: string | null
  script_link: string | null
  edit_link: string | null
  final_link: string | null
  created_at: string
  updated_at: string
  clients?: { name: string; brand: string | null }
}

export interface TeamMember {
  id: string
  name: string
  role: string | null
  type: 'Interno' | 'Tercero'
  whatsapp: string | null
  email: string | null
  base_rate: number | null
  payment_method: string | null
  payment_details: string | null
  status: 'Activo' | 'Inactivo'
  notes: string | null
  created_at: string
}

export interface RecordingSession {
  id: string
  client_id: string
  month: string | null
  recording_date: string
  start_time: string | null
  end_time: string | null
  duration_hours: number | null
  location: string | null
  location_type: string | null
  pieces_to_record: string[] | null
  required_materials: string | null
  status: string
  extra_costs: number
  notes: string | null
  created_at: string
  clients?: { name: string; brand: string | null }
}

export interface Extra {
  id: string
  client_id: string
  request_description: string
  extra_type: string | null
  description: string | null
  quoted_price: number | null
  quote_status: ExtraStatus
  approval_date: string | null
  payment_date: string | null
  execution_date: string | null
  delivery_date: string | null
  deliverable_link: string | null
  created_at: string
  updated_at: string
  clients?: { name: string; brand: string | null }
}

export interface InternalPayment {
  id: string
  client_id: string | null
  month: string | null
  project_or_plan: string | null
  payee_id: string | null
  role_executed: string | null
  assigned_amount: number
  payment_type: string
  status: InternalPaymentStatus
  payment_deadline: string | null
  payment_date: string | null
  receipt_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  clients?: { name: string; brand: string | null }
  team_members?: { name: string; role: string | null }
}

export type SeaAgentStatus = 'Pendiente' | 'En ejecución' | 'Esperando aprobación' | 'Aprobado' | 'Rechazado' | 'Omitido'
export type SeaCycleStatus = 'En progreso' | 'Completado' | 'Pausado' | 'Cancelado'

export interface SeaCycle {
  id: string
  client_id: string | null
  client_name: string
  cycle_month: string
  status: SeaCycleStatus
  drive_folder_id: string | null
  drive_folder_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SeaAgentRun {
  id: string
  cycle_id: string
  agent_number: number
  agent_name: string
  status: SeaAgentStatus
  output_drive_url: string | null
  output_summary: string | null
  executed_at: string | null
  approved_at: string | null
  approved_by: string | null
  rejection_notes: string | null
  created_at: string
  updated_at: string
}

export interface DashboardMetrics {
  active_clients: number
  paused_clients: number
  pending_payments: number
  pieces_in_production: number
  overdue_pieces: number
  pending_approvals: number
  publications_this_week: number
  monthly_revenue: number
  pending_internal_payments: number
  extras_pending_quote: number
}
