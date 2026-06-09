'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus, ExternalLink, ChevronRight, Circle, CheckCircle2, XCircle,
  Clock, Loader2, Minus, MoreHorizontal, Pencil, Trash2, X, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SeaNewCycleDialog } from './SeaNewCycleDialog'

const AGENTS = [
  { number: 1, short: 'Ingestor' },
  { number: 2, short: 'Audiencia' },
  { number: 3, short: 'Canal' },
  { number: 4, short: 'Ángulos' },
  { number: 5, short: 'Contenido' },
  { number: 6, short: 'Calendario' },
  { number: 7, short: 'Brief' },
  { number: 8, short: 'Guiones' },
  { number: 9, short: 'QA' },
  { number: 10, short: 'Entrega' },
]

const CYCLE_STATUSES = ['En progreso', 'Completado', 'Pausado', 'Cancelado']

interface AgentRun {
  agent_number: number
  status: string
}

interface Cycle {
  cycle_id: string
  client_name: string
  cycle_month: string
  cycle_status: string
  drive_folder_url?: string
  notes?: string
  created_at: string
  total_agents: number
  approved_agents: number
  pending_approval: number
  rejected_agents: number
  running_agents: number
  agent_runs?: AgentRun[]
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  'Pendiente': { color: 'text-muted-foreground', bg: 'bg-muted/30 border-border', icon: <Circle className="w-3 h-3" /> },
  'En ejecución': { color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-800', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  'Esperando aprobación': { color: 'text-yellow-400', bg: 'bg-yellow-950/40 border-yellow-700', icon: <Clock className="w-3 h-3" /> },
  'Aprobado': { color: 'text-green-400', bg: 'bg-green-950/40 border-green-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  'Rechazado': { color: 'text-red-400', bg: 'bg-red-950/40 border-red-800', icon: <XCircle className="w-3 h-3" /> },
  'Omitido': { color: 'text-muted-foreground', bg: 'bg-muted/10 border-border', icon: <Minus className="w-3 h-3" /> },
}

function PipelineBar({ runs }: { runs: AgentRun[] }) {
  const runsMap = Object.fromEntries(runs.map(r => [r.agent_number, r]))
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {AGENTS.map((a, i) => {
        const status = runsMap[a.number]?.status ?? 'Pendiente'
        const cfg = statusConfig[status] ?? statusConfig['Pendiente']
        return (
          <div key={a.number} className="flex items-center gap-1">
            <div className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg border text-[10px] font-medium w-[60px] shrink-0 ${cfg.bg}`}>
              <span className={`flex items-center gap-0.5 ${cfg.color}`}>{cfg.icon}<span className="text-muted-foreground">A{a.number}</span></span>
              <span className="text-center leading-tight text-foreground/70">{a.short}</span>
            </div>
            {i < AGENTS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

function EditCycleInline({
  cycle,
  onSave,
  onCancel,
}: {
  cycle: Cycle
  onSave: () => void
  onCancel: () => void
}) {
  const monthVal = cycle.cycle_month?.slice(0, 7) ?? ''
  const [status, setStatus] = useState(cycle.cycle_status)
  const [month, setMonth] = useState(monthVal)
  const [driveUrl, setDriveUrl] = useState(cycle.drive_folder_url ?? '')
  const [notes, setNotes] = useState(cycle.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('sea_cycles').update({
      status,
      cycle_month: month + '-01',
      drive_folder_url: driveUrl || null,
      notes: notes || null,
    }).eq('id', cycle.cycle_id)
    setSaving(false)
    onSave()
  }

  return (
    <div className="bg-card border border-primary/40 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-foreground">{cycle.client_name}</h3>
        <div className="flex gap-2">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-7 text-xs" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Guardar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>
            <X className="w-3 h-3" /> Cancelar
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Estado</label>
          <select
            className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {CYCLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mes</label>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">URL carpeta Drive</label>
        <Input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/..." className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Notas</label>
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas del ciclo..." className="h-8 text-sm" />
      </div>
    </div>
  )
}

function CycleCard({
  cycle,
  onNavigate,
  onRefresh,
}: {
  cycle: Cycle
  onNavigate: () => void
  onRefresh: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const monthLabel = new Date(cycle.cycle_month + 'T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const progressPct = Math.round((cycle.approved_agents / 10) * 100)

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('sea_cycles').delete().eq('id', cycle.cycle_id)
    setDeleting(false)
    setConfirmDelete(false)
    onRefresh()
  }

  if (editing) {
    return (
      <EditCycleInline
        cycle={cycle}
        onSave={() => { setEditing(false); onRefresh() }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  if (confirmDelete) {
    return (
      <div className="bg-card border border-red-800 rounded-xl p-5">
        <p className="text-sm text-foreground mb-1">¿Eliminar el ciclo <strong>{cycle.client_name} · {monthLabel}</strong>?</p>
        <p className="text-xs text-muted-foreground mb-4">Se eliminarán también los registros de los 10 agentes. Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Sí, eliminar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="cursor-pointer flex-1" onClick={onNavigate}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-base">{cycle.client_name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
              cycle.cycle_status === 'Completado' ? 'text-green-400 bg-green-950/40 border-green-800' :
              cycle.cycle_status === 'Pausado' ? 'text-yellow-400 bg-yellow-950/40 border-yellow-700' :
              cycle.cycle_status === 'Cancelado' ? 'text-red-400 bg-red-950/40 border-red-800' :
              'text-blue-400 bg-blue-950/40 border-blue-800'
            }`}>
              {cycle.cycle_status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
          {cycle.notes && <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{cycle.notes}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {cycle.drive_folder_url && (
            <a
              href={cycle.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
              title="Abrir carpeta Drive"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
                    onClick={() => { setMenuOpen(false); setEditing(true) }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar ciclo
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 transition-colors"
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar ciclo
                  </button>
                </div>
              </>
            )}
          </div>
          <ChevronRight
            className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer"
            onClick={onNavigate}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 cursor-pointer" onClick={onNavigate}>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{cycle.approved_agents} / 10 agentes aprobados</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Pipeline bar */}
      <div className="cursor-pointer" onClick={onNavigate}>
        <PipelineBar runs={cycle.agent_runs ?? []} />
      </div>

      {/* Alert stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        {cycle.pending_approval > 0 && <span className="text-yellow-400 font-medium">⏳ {cycle.pending_approval} esperando aprobación</span>}
        {cycle.rejected_agents > 0 && <span className="text-red-400 font-medium">✕ {cycle.rejected_agents} rechazados</span>}
        {cycle.running_agents > 0 && <span className="text-blue-400 font-medium">⟳ {cycle.running_agents} en ejecución</span>}
        {cycle.pending_approval === 0 && cycle.rejected_agents === 0 && cycle.running_agents === 0 && (
          <span>Sin actividad pendiente</span>
        )}
      </div>
    </div>
  )
}

export function SeaPage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  async function loadCycles() {
    setLoading(true)
    const { data: cycleData } = await supabase
      .from('sea_pipeline_view')
      .select('*')
      .order('cycle_month', { ascending: false })

    if (!cycleData) { setLoading(false); return }

    const cycleIds = cycleData.map((c: Cycle) => c.cycle_id)
    const { data: runsData } = await supabase
      .from('sea_agent_runs')
      .select('cycle_id, agent_number, status')
      .in('cycle_id', cycleIds)

    const runsByCycle: Record<string, AgentRun[]> = {}
    for (const run of (runsData ?? [])) {
      if (!runsByCycle[run.cycle_id]) runsByCycle[run.cycle_id] = []
      runsByCycle[run.cycle_id].push(run)
    }

    setCycles(cycleData.map((c: Cycle) => ({ ...c, agent_runs: runsByCycle[c.cycle_id] ?? [] })))
    setLoading(false)
  }

  useEffect(() => { loadCycles() }, [])

  const activeCycles = cycles.filter(c => c.cycle_status === 'En progreso')
  const otherCycles = cycles.filter(c => c.cycle_status !== 'En progreso')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">SEA · Pipeline</h1>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium">
              Sistema Editorial Audiovisual
            </span>
          </div>
          <p className="text-muted-foreground text-sm">10 agentes secuenciales · un ciclo por cliente por mes</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo ciclo
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(statusConfig).map(([status, cfg]) => (
          <div key={status} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            <span>{status}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-lg font-medium mb-2">Sin ciclos activos</p>
          <p className="text-sm">Crea un nuevo ciclo para iniciar el pipeline SEA.</p>
          <p className="text-xs mt-2 text-muted-foreground/60">El cliente debe estar registrado y activo en la base de clientes.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeCycles.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                En progreso ({activeCycles.length})
              </h2>
              <div className="grid gap-4">
                {activeCycles.map(c => (
                  <CycleCard
                    key={c.cycle_id}
                    cycle={c}
                    onNavigate={() => window.location.href = `/sea/${c.cycle_id}`}
                    onRefresh={loadCycles}
                  />
                ))}
              </div>
            </section>
          )}
          {otherCycles.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Historial
              </h2>
              <div className="grid gap-4">
                {otherCycles.map(c => (
                  <CycleCard
                    key={c.cycle_id}
                    cycle={c}
                    onNavigate={() => window.location.href = `/sea/${c.cycle_id}`}
                    onRefresh={loadCycles}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <SeaNewCycleDialog
        open={showNew}
        onOpenChange={setShowNew}
        onCreated={loadCycles}
      />
    </div>
  )
}
