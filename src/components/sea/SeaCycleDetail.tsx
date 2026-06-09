'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, ExternalLink, Circle, CheckCircle2, XCircle, Clock,
  Loader2, Minus, ChevronRight, Edit2, X, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const AGENTS = [
  { number: 1, name: 'Ingestor de Marca', description: 'Lee todos los inputs del cliente y crea el Brand Content Memory.' },
  { number: 2, name: 'Arquitecto de Audiencia', description: 'Define perfiles de audiencia, segmentación y personas objetivo.' },
  { number: 3, name: 'Auditor de Canal', description: 'Diagnostica canales actuales y diseña arquitectura multicanal.' },
  { number: 4, name: 'Arquitecto de Ángulos', description: 'Crea la matriz de ángulos creativos y territorios de contenido.' },
  { number: 5, name: 'Arquitecto de Contenido', description: 'Define pilares, formatos y mix de contenido mensual.' },
  { number: 6, name: 'Arquitecto de Calendario', description: 'Construye el calendario editorial mensual con piezas y fechas.' },
  { number: 7, name: 'Brief de Producción', description: 'Genera los briefs de producción para cada pieza del calendario.' },
  { number: 8, name: 'Arquitecto de Guiones', description: 'Redacta guiones, hooks y copys de cada pieza.' },
  { number: 9, name: 'Control de Calidad', description: 'Revisa coherencia, marca, alcance y entregables finales.' },
  { number: 10, name: 'Entrega al Cliente', description: 'Prepara el paquete de entrega y briefing de producción operativo.' },
]

const STATUS_OPTIONS = [
  'Pendiente',
  'En ejecución',
  'Esperando aprobación',
  'Aprobado',
  'Rechazado',
  'Omitido',
]

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Pendiente': { color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-border', icon: <Circle className="w-4 h-4" /> },
  'En ejecución': { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-800', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  'Esperando aprobación': { color: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-700', icon: <Clock className="w-4 h-4" /> },
  'Aprobado': { color: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-800', icon: <CheckCircle2 className="w-4 h-4" /> },
  'Rechazado': { color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-800', icon: <XCircle className="w-4 h-4" /> },
  'Omitido': { color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border', icon: <Minus className="w-4 h-4" /> },
}

interface AgentRun {
  id: string
  cycle_id: string
  agent_number: number
  agent_name: string
  status: string
  output_drive_url?: string
  output_summary?: string
  executed_at?: string
  approved_at?: string
  approved_by?: string
  rejection_notes?: string
}

interface Cycle {
  id: string
  client_name: string
  cycle_month: string
  status: string
  drive_folder_url?: string
  drive_folder_id?: string
  notes?: string
}

function AgentRunCard({
  run,
  agentDef,
  onUpdate,
}: {
  run?: AgentRun
  agentDef: typeof AGENTS[0]
  cycleId: string
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(run?.status ?? 'Pendiente')
  const [outputUrl, setOutputUrl] = useState(run?.output_drive_url ?? '')
  const [summary, setSummary] = useState(run?.output_summary ?? '')
  const [approvedBy, setApprovedBy] = useState(run?.approved_by ?? '')
  const [rejectionNotes, setRejectionNotes] = useState(run?.rejection_notes ?? '')
  const [saving, setSaving] = useState(false)

  const cfg = statusConfig[run?.status ?? 'Pendiente'] ?? statusConfig['Pendiente']
  const editCfg = statusConfig[status] ?? statusConfig['Pendiente']

  async function handleSave() {
    if (!run) return
    setSaving(true)
    const updates: Record<string, unknown> = {
      status,
      output_drive_url: outputUrl || null,
      output_summary: summary || null,
      approved_by: approvedBy || null,
      rejection_notes: rejectionNotes || null,
    }
    if (status === 'Aprobado' && !run.approved_at) {
      updates.approved_at = new Date().toISOString()
    }
    if (status === 'En ejecución' && !run.executed_at) {
      updates.executed_at = new Date().toISOString()
    }
    await supabase.from('sea_agent_runs').update(updates).eq('id', run.id)
    setSaving(false)
    setEditing(false)
    onUpdate()
  }

  return (
    <div className={`rounded-xl border p-4 transition-all ${editing ? 'border-primary/50 bg-primary/5' : `${cfg.bg} ${cfg.border} border`}`}>
      <div className="flex items-start gap-3">
        {/* Number badge */}
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
          {agentDef.number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="font-semibold text-sm text-foreground">{agentDef.name}</h3>
            {!editing && (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                  {cfg.icon}
                  {run?.status ?? 'Pendiente'}
                </span>
                {run && (
                  <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{agentDef.description}</p>

          {/* Output URL (read-only) */}
          {!editing && run?.output_drive_url && (
            <a
              href={run.output_drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Ver output en Drive
            </a>
          )}
          {!editing && run?.output_summary && (
            <p className="text-xs text-muted-foreground mt-1 italic">{run.output_summary}</p>
          )}
          {!editing && run?.rejection_notes && (
            <p className="text-xs text-red-400 mt-1">⚠ {run.rejection_notes}</p>
          )}
          {!editing && run?.approved_at && (
            <p className="text-xs text-green-400/70 mt-1">
              ✓ Aprobado {run.approved_by ? `por ${run.approved_by}` : ''} · {new Date(run.approved_at).toLocaleDateString('es-ES')}
            </p>
          )}

          {/* Edit form */}
          {editing && (
            <div className="space-y-3 mt-3 border-t border-border pt-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
                <select
                  className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className={`mt-1 flex items-center gap-1.5 text-xs ${editCfg.color}`}>
                  {editCfg.icon} {status}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL del output (Drive)</label>
                <Input
                  value={outputUrl}
                  onChange={e => setOutputUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Resumen del output</label>
                <Input
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Breve descripción de lo generado..."
                  className="text-xs h-8"
                />
              </div>

              {status === 'Aprobado' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Aprobado por</label>
                  <Input
                    value={approvedBy}
                    onChange={e => setApprovedBy(e.target.value)}
                    placeholder="Nombre de quien aprueba"
                    className="text-xs h-8"
                  />
                </div>
              )}

              {status === 'Rechazado' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Motivo de rechazo</label>
                  <Input
                    value={rejectionNotes}
                    onChange={e => setRejectionNotes(e.target.value)}
                    placeholder="¿Qué debe corregirse?"
                    className="text-xs h-8"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white h-7 text-xs"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  {saving ? 'Guardando' : 'Guardar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setEditing(false)
                    setStatus(run?.status ?? 'Pendiente')
                    setOutputUrl(run?.output_drive_url ?? '')
                    setSummary(run?.output_summary ?? '')
                  }}
                >
                  <X className="w-3 h-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SeaCycleDetail({ cycleId }: { cycleId: string }) {
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: cycleData }, { data: runsData }] = await Promise.all([
      supabase.from('sea_cycles').select('*').eq('id', cycleId).single(),
      supabase.from('sea_agent_runs').select('*').eq('cycle_id', cycleId).order('agent_number'),
    ])
    setCycle(cycleData)
    setRuns(runsData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [cycleId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (!cycle) return (
    <div className="p-6 text-muted-foreground">Ciclo no encontrado.</div>
  )

  const runsMap = Object.fromEntries(runs.map(r => [r.agent_number, r]))
  const approved = runs.filter(r => r.status === 'Aprobado').length
  const monthLabel = new Date(cycle.cycle_month + 'T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.location.href = '/sea'}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al pipeline
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{cycle.client_name}</h1>
              <span className="text-sm text-muted-foreground capitalize">{monthLabel}</span>
            </div>
            {cycle.notes && <p className="text-sm text-muted-foreground">{cycle.notes}</p>}
          </div>
          <div className="flex items-center gap-2">
            {cycle.drive_folder_url && (
              <a
                href={cycle.drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg px-3 py-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Carpeta Drive
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{approved} / 10 agentes aprobados</span>
          <span className="text-sm font-semibold text-foreground">{Math.round(approved / 10 * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(approved / 10) * 100}%` }}
          />
        </div>
        {/* Mini pipeline bar */}
        <div className="flex items-center gap-1 flex-wrap">
          {AGENTS.map((a, i) => {
            const run = runsMap[a.number]
            const s = run?.status ?? 'Pendiente'
            const cfg = statusConfig[s]
            return (
              <div key={a.number} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded flex items-center justify-center border text-[10px] font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  {a.number}
                </div>
                {i < 9 && <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/30" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Agent cards */}
      <div className="space-y-3">
        {AGENTS.map(a => (
          <AgentRunCard
            key={a.number}
            run={runsMap[a.number]}
            agentDef={a}
            cycleId={cycleId}
            onUpdate={load}
          />
        ))}
      </div>
    </div>
  )
}
