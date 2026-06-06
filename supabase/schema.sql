-- ============================================================
-- DM Content Operations — Schema completo
-- ============================================================

-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- ============================================================
-- EQUIPO Y TERCEROS
-- ============================================================
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text,
  type text check (type in ('Interno', 'Tercero')) default 'Interno',
  whatsapp text,
  email text,
  base_rate numeric(10,2),
  payment_method text,
  payment_details text,
  status text check (status in ('Activo', 'Inactivo')) default 'Activo',
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- CLIENTES
-- ============================================================
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand text,
  contact_name text,
  whatsapp text,
  email text,
  instagram text,
  city text,
  country text,
  status text check (status in (
    'Prospecto','Activo','Pendiente de pago','Pausado por pago',
    'Pausado por cliente','En cancelación','Finalizado','No renovó'
  )) default 'Prospecto',
  start_date date,
  renewal_date date,
  cancellation_deadline date,
  approval_contact text,
  accesses_delivered boolean default false,
  folder_link text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PLANES CONTRATADOS
-- ============================================================
create table contracted_plans (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  plan_name text check (plan_name in (
    'Plan Inicial','Plan Avanzado','Plan Profesional','Campaña Especial'
  )) not null,
  monthly_price numeric(10,2) not null,
  currency text default 'USD',
  start_date date,
  current_cycle int default 1,
  status text check (status in (
    'Activo','Pausado','Cancelado','Finalizado'
  )) default 'Activo',
  includes_community boolean default false,
  includes_dms boolean default false,
  reels_count int default 0,
  carousels_count int default 0,
  stories_count int default 0,
  sessions_count int default 0,
  recording_hours numeric(4,1) default 0,
  locations_count int default 0,
  revision_rounds int default 2,
  special_conditions text,
  created_at timestamptz default now()
);

-- ============================================================
-- PAGOS DEL CLIENTE
-- ============================================================
create table client_payments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  plan_id uuid references contracted_plans(id),
  service_month text not null, -- "2024-06"
  total_amount numeric(10,2) not null,
  -- Pago inicial 50%
  initial_payment numeric(10,2),
  initial_deadline date,
  initial_status text check (initial_status in (
    'Pendiente','Pagado','Atrasado','En validación','No recibido'
  )) default 'Pendiente',
  -- Segundo pago 50%
  second_payment numeric(10,2),
  second_deadline date,
  second_status text check (second_status in (
    'Pendiente','Pagado','Atrasado','En validación','No recibido'
  )) default 'Pendiente',
  -- General
  payment_method text,
  receipt_url text,
  payment_date date,
  delay_days int default 0,
  operational_status text check (operational_status in (
    'Activo','Pausado por pago','Pausado por cliente'
  )) default 'Activo',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CALENDARIO MENSUAL
-- ============================================================
create table monthly_calendars (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  plan_id uuid references contracted_plans(id),
  month text not null, -- "2024-06"
  delivery_date date,
  client_approval_deadline date,
  status text check (status in (
    'Por crear','En estrategia','Enviado al cliente','Esperando aprobación',
    'En corrección','Aprobado','En producción','En publicación','Cerrado','Pausado'
  )) default 'Por crear',
  calendar_link text,
  strategy_owner uuid references team_members(id),
  production_owner uuid references team_members(id),
  publication_owner uuid references team_members(id),
  observations text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PIEZAS DE CONTENIDO
-- ============================================================
create table content_pieces (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  calendar_id uuid references monthly_calendars(id),
  month text not null,
  piece_type text check (piece_type in (
    'Reel','Carrusel','Historia','Portada','Copy','Otro'
  )) not null,
  title text not null,
  content_pillar text,
  objective text,
  format text,
  channel text,
  -- Fechas clave
  recording_date date,
  internal_delivery_date date,
  client_send_date date,
  approval_deadline date,
  publication_date date,
  -- Estado
  production_status text check (production_status in (
    'Idea','Guion pendiente','Guion listo','Por grabar','Grabado',
    'En edición','Edición lista','En revisión interna','Enviado al cliente',
    'Esperando comentarios','En corrección','Aprobado','Programado',
    'Publicado','Pausado por pago','Pausado por cliente','Cancelado'
  )) default 'Idea',
  -- Responsables
  strategy_owner uuid references team_members(id),
  recording_owner uuid references team_members(id),
  editing_owner uuid references team_members(id),
  copy_owner uuid references team_members(id),
  publication_owner uuid references team_members(id),
  -- Links
  script_link text,
  edit_link text,
  final_link text,
  copy_text text,
  cta text,
  -- Revisiones
  revision_1 text,
  revision_2 text,
  final_approval boolean default false,
  published boolean default false,
  publication_link text,
  -- Auto-aprobación
  auto_approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- JORNADAS DE GRABACIÓN
-- ============================================================
create table recording_sessions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  month text,
  recording_date date not null,
  start_time time,
  end_time time,
  duration_hours numeric(4,1),
  location text,
  location_type text check (location_type in ('Estudio','Exterior','Cliente','Otro')),
  production_owner uuid references team_members(id),
  pieces_to_record text[], -- array de títulos
  required_materials text,
  status text check (status in (
    'Programada','Confirmada','Realizada','Cancelada','Reagendada'
  )) default 'Programada',
  extra_costs numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- EXTRAS / ADD-ONS
-- ============================================================
create table extras (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  request_description text not null,
  extra_type text,
  description text,
  quoted_price numeric(10,2),
  quote_status text check (quote_status in (
    'Solicitado','Cotizado','Aprobado','Pagado',
    'En producción','Entregado','Cancelado'
  )) default 'Solicitado',
  approval_date date,
  payment_date date,
  execution_date date,
  delivery_date date,
  owner uuid references team_members(id),
  deliverable_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAGOS INTERNOS
-- ============================================================
create table internal_payments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id),
  month text,
  project_or_plan text,
  payee_id uuid references team_members(id),
  role_executed text,
  assigned_amount numeric(10,2) not null,
  payment_type text check (payment_type in (
    'Fee estratégico','Producción','Edición','Comisión comercial',
    'Tercero','Extra','Reembolso','Viático','Locación','Talento','Otro'
  )) not null,
  status text check (status in (
    'Pendiente','Aprobado','Pagado',
    'Retenido por falta de pago del cliente','En revisión','Cancelado'
  )) default 'Pendiente',
  payment_deadline date,
  payment_date date,
  receipt_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index idx_clients_status on clients(status);
create index idx_client_payments_month on client_payments(service_month);
create index idx_client_payments_client on client_payments(client_id);
create index idx_content_pieces_client on content_pieces(client_id);
create index idx_content_pieces_status on content_pieces(production_status);
create index idx_content_pieces_pub_date on content_pieces(publication_date);
create index idx_internal_payments_status on internal_payments(status);
create index idx_extras_status on extras(quote_status);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Auto-updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger client_payments_updated_at before update on client_payments
  for each row execute function update_updated_at();

create trigger monthly_calendars_updated_at before update on monthly_calendars
  for each row execute function update_updated_at();

create trigger content_pieces_updated_at before update on content_pieces
  for each row execute function update_updated_at();

create trigger extras_updated_at before update on extras
  for each row execute function update_updated_at();

create trigger internal_payments_updated_at before update on internal_payments
  for each row execute function update_updated_at();

-- ============================================================
-- VISTA: Dashboard metrics
-- ============================================================
create or replace view dashboard_metrics as
select
  (select count(*) from clients where status = 'Activo') as active_clients,
  (select count(*) from clients where status = 'Pausado por pago') as paused_clients,
  (select count(*) from client_payments
    where (initial_status = 'Pendiente' or second_status = 'Pendiente')
    and service_month = to_char(now(), 'YYYY-MM')) as pending_payments,
  (select count(*) from content_pieces
    where production_status not in ('Publicado','Cancelado','Pausado por pago','Pausado por cliente')
    and production_status != 'Idea') as pieces_in_production,
  (select count(*) from content_pieces
    where internal_delivery_date < current_date
    and production_status not in ('Publicado','Aprobado','Programado','Cancelado')) as overdue_pieces,
  (select count(*) from content_pieces
    where production_status = 'Enviado al cliente') as pending_approvals,
  (select count(*) from content_pieces
    where publication_date between current_date and current_date + interval '7 days'
    and production_status in ('Programado','Aprobado')) as publications_this_week,
  (select coalesce(sum(total_amount),0) from client_payments
    where service_month = to_char(now(), 'YYYY-MM')) as monthly_revenue,
  (select count(*) from internal_payments where status = 'Pendiente') as pending_internal_payments,
  (select count(*) from extras where quote_status = 'Solicitado') as extras_pending_quote;
