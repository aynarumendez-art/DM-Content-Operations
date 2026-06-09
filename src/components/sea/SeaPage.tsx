'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, ExternalLink, ChevronRight, Circle, CheckCircle2, XCircle, Clock, Loader2, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeaNewCycleDialog } from './SeaNewCycleDialog'

const AGENTS = [
  { number: 1, name: 'Ingestor de Marca', short: 'Ingestor' },
  { number: 2, name: 'Arquitecto de Audiencia', short: 'Audiencia' },
  { number: 3, name: 'Auditor de Canal', short: 'Canal' },
  { number: 4, name: 'Arquitecto de Ángulos', short: 'Ángulos' },
  { number: 5, name: 'Arquitecto de Contenido', short: 'Contenido' },
  { number: 6, name: 'Arquitecto de Calendario', short: 'Calendario' },
  { number: 7, name: 'Brief de Producción', short: 'Brief' },
  { number: 8, name: 'Arquitecto de Guiones', short: 'Guiones' },
  { number: 9, name: 'Control de Calidad', short: 'QA' },
  { number: 10, name: 'Entrega al Cliente', short: 'Entrega' },
]

interface AgentRun {
  agent_number: number
  agent_name: string
  status: string
  output_drive_url?: string
  approved_at?: string
  rejection_notes?: string
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
  'Pendiente': {
    color: 'text-muted-foreground',
    bg: 'bg-muted/30 border-border',
    icon: <Circle className="w-3 h-3" />,
  },
  'En ejecución': {
    color: 'text-blue-400',
    bg: 'bg-blue-950/40 border-blue-800',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  'Esperando aprobación': {
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/40 border-yellow-700',
    icon: <Clock className="w-3 h-3" />,
  },
  'Aprobado': {
    color: 'text-green-400',
    bg: 'bg-green-950/40 border-green-800',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  'Rechazado': {
    color: 'text-red-400',
    bg: 'bg-red-950/40 border-red-800',
    icon: <XCircle className="w-3 h-3" />,
  },
  'Omitido': {
    color: 'text-muted-foreground',
    bg: 'bg-muted/10 border-border',
    icon: <Minus className="w-3 h-3" />,
  },
}

function AgentPill({ run, agentDef }: { run?: AgentRun; agentDef: typeof AGENTS[0] }) {
  const status = run?.status ?? 'Pendiente'
  const cfg = statusConfig[status] ?? statusConfig['Pendiente']
  return (
    <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium w-[72px] shrink-0 ${cfg.bg}`}>
      <span className={`flex items-center gap-1 ${cfg.color}`}>
        {cfg.icon}
        <span className="text-[10px] text-muted-foreground">A{agentDef.number}</span>
      </span>
      <span className="text-center leading-tight text-[10px] text-foreground/80">{agentDef.short}</span>
    </div>
  )
}

function PipelineBar({ runs }: { runs: AgentRun[] }) {
  const runsMap = Object.fromEntries(runs.map(r => [r.agent_number, r]))
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {AGENTS.map((a, i) => (
        <div key={a.number} className="flex items-center gap-1">
          <AgentPill run={runsMap[a.number]} agentDef={a} />
          {i < AGENTS.length - 1 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

function CycleCard({ cycle, onClick }: { cycle: Cycle; onClick: () => void }) {
  const monthLabel = new Date(cycle.cycle_month + 'T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const progressPct = cycle.total_agents > 0
    ? Math.round((cycle.approved_agents / 10) * 100)
    : 0

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 cursor-pointer transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
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
        </div>
        <div className="flex items-center gap-2">
          {cycle.drive_folder_url && (
            <a
              href={cycle.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Abrir carpeta en Drive"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{cycle.approved_agents} / 10 agentes aprobados</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Mini pipeline */}
      <PipelineBar runs={cycle.agent_runs ?? []} />

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        {cycle.pending_approval > 0 && (
          <span className="text-yellow-400 font-medium">⏳ {cycle.pending_approval} esperando aprobación</span>
        )}
        {cycle.rejected_agents > 0 && (
          <span className="text-red-400 font-medium">✕ {cycle.rejected_agents} rechazados</span>
        )}
        {cycle.running_agents > 0 && (
          <span className="text-blue-400 font-medium">⟳ {cycle.running_agents} en ejecución</span>
        )}
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

    // Load agent runs for each cycle
    const cycleIds = cycleData.map((c: Cycle) => c.cycle_id)
    const { data: runsData } = await supabase
      .from('sea_agent_runs')
      .select('cycle_id, agent_number, agent_name, status, output_drive_url, approved_at, rejection_notes')
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
          <p className="text-muted-foreground text-sm">
            10 agentes secuenciales · un ciclo por cliente por mes
          </p>
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
                    onClick={() => window.location.href = `/sea/${c.cycle_id}`}
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
                    onClick={() => window.location.href = `/sea/${c.cycle_id}`}
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
