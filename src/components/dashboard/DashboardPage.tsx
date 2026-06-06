'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DashboardMetrics } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  Users, AlertCircle, PauseCircle, Film, Clock,
  CheckCircle2, CalendarCheck, DollarSign, Wallet, PackagePlus,
} from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  accent?: boolean
  alert?: boolean
  format?: 'number' | 'currency'
}

function MetricCard({ label, value, icon: Icon, accent, alert, format }: MetricCardProps) {
  const display = format === 'currency'
    ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    : value

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-4 ${
      alert ? 'border-red-500/30 bg-red-500/5' :
      accent ? 'border-primary/30 bg-primary/5' :
      'border-border bg-card'
    }`}>
      <div className={`p-2 rounded-md ${
        alert ? 'bg-red-500/15 text-red-400' :
        accent ? 'bg-primary/15 text-primary' :
        'bg-secondary text-muted-foreground'
      }`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-0.5 text-foreground">{display}</p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('dashboard_metrics').select('*').single()
      setMetrics(data as DashboardMetrics)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard label="Clientes activos" value={metrics?.active_clients ?? 0} icon={Users} accent />
            <MetricCard label="Pagos pendientes" value={metrics?.pending_payments ?? 0} icon={AlertCircle} alert={!!metrics?.pending_payments} />
            <MetricCard label="Pausados por pago" value={metrics?.paused_clients ?? 0} icon={PauseCircle} alert={!!metrics?.paused_clients} />
            <MetricCard label="Piezas en producción" value={metrics?.pieces_in_production ?? 0} icon={Film} />
            <MetricCard label="Piezas atrasadas" value={metrics?.overdue_pieces ?? 0} icon={Clock} alert={!!metrics?.overdue_pieces} />
            <MetricCard label="Aprobaciones pendientes" value={metrics?.pending_approvals ?? 0} icon={CheckCircle2} alert={!!metrics?.pending_approvals} />
            <MetricCard label="Publicaciones esta semana" value={metrics?.publications_this_week ?? 0} icon={CalendarCheck} accent />
            <MetricCard label="Ingresos del mes" value={metrics?.monthly_revenue ?? 0} icon={DollarSign} accent format="currency" />
            <MetricCard label="Pagos internos pendientes" value={metrics?.pending_internal_payments ?? 0} icon={Wallet} alert={!!metrics?.pending_internal_payments} />
            <MetricCard label="Extras sin cotizar" value={metrics?.extras_pending_quote ?? 0} icon={PackagePlus} alert={!!metrics?.extras_pending_quote} />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertsPanel />
          </div>
        </>
      )}
    </div>
  )
}

function AlertsPanel() {
  const [alerts, setAlerts] = useState<string[]>([])

  useEffect(() => {
    async function loadAlerts() {
      const list: string[] = []
      const today = new Date()
      const day = today.getDate()
      const month = today.toISOString().slice(0, 7)

      // Pago inicial vencido (día > 3)
      if (day > 3) {
        const { data } = await supabase
          .from('client_payments')
          .select('clients(name)')
          .eq('service_month', month)
          .eq('initial_status', 'Pendiente')
        if (data && data.length > 0) {
          data.forEach((p: any) => {
            list.push(`⚠️ Pago inicial pendiente — ${p.clients?.name}`)
          })
        }
      }

      // Segundo pago vencido (día > 17)
      if (day > 17) {
        const { data } = await supabase
          .from('client_payments')
          .select('clients(name)')
          .eq('service_month', month)
          .eq('second_status', 'Pendiente')
        if (data && data.length > 0) {
          data.forEach((p: any) => {
            list.push(`🔴 Segundo pago vencido — ${p.clients?.name}`)
          })
        }
      }

      // Aprobaciones vencidas
      const { data: expiredApprovals } = await supabase
        .from('content_pieces')
        .select('title, clients(name)')
        .eq('production_status', 'Enviado al cliente')
        .lt('approval_deadline', today.toISOString().slice(0, 10))
      if (expiredApprovals && expiredApprovals.length > 0) {
        expiredApprovals.forEach((p: any) => {
          list.push(`⏱ Aprobación vencida — ${p.clients?.name}: "${p.title}"`)
        })
      }

      // Grabaciones próximas (3 días)
      const in3 = new Date(today)
      in3.setDate(in3.getDate() + 3)
      const { data: upcomingSessions } = await supabase
        .from('recording_sessions')
        .select('recording_date, location, clients(name)')
        .gte('recording_date', today.toISOString().slice(0, 10))
        .lte('recording_date', in3.toISOString().slice(0, 10))
        .eq('status', 'Confirmada')
      if (upcomingSessions && upcomingSessions.length > 0) {
        upcomingSessions.forEach((s: any) => {
          list.push(`📷 Grabación próxima — ${s.clients?.name} el ${s.recording_date}`)
        })
      }

      setAlerts(list)
    }
    loadAlerts()
  }, [])

  return (
    <div className="rounded-lg border border-border bg-card p-4 col-span-full">
      <h2 className="text-sm font-semibold text-foreground mb-3">Alertas operativas</h2>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin alertas activas. Todo en orden.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li key={i} className="text-sm text-foreground/80 border-l-2 border-primary pl-3 py-0.5">
              {a}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
