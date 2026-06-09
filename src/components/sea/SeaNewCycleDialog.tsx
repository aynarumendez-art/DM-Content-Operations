'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'

const AGENTS = [
  { number: 1, name: 'Ingestor de Marca' },
  { number: 2, name: 'Arquitecto de Audiencia' },
  { number: 3, name: 'Auditor de Canal' },
  { number: 4, name: 'Arquitecto de Ángulos' },
  { number: 5, name: 'Arquitecto de Contenido' },
  { number: 6, name: 'Arquitecto de Calendario' },
  { number: 7, name: 'Brief de Producción' },
  { number: 8, name: 'Arquitecto de Guiones' },
  { number: 9, name: 'Control de Calidad' },
  { number: 10, name: 'Entrega al Cliente' },
]

interface ClientWithPlan {
  id: string
  name: string
  brand: string | null
  status: string
  plan_name: string | null
  plan_price: number | null
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

export function SeaNewCycleDialog({ open, onOpenChange, onCreated }: Props) {
  const [clients, setClients] = useState<ClientWithPlan[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientWithPlan | null>(null)
  const [cycleMonth, setCycleMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [driveFolderUrl, setDriveFolderUrl] = useState('')
  const [driveFolderId, setDriveFolderId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    supabase
      .from('clients')
      .select(`
        id, name, brand, status,
        contracted_plans ( plan_name, monthly_price )
      `)
      .in('status', ['Activo', 'Pendiente de pago'])
      .order('name')
      .then(({ data }) => {
        const mapped = (data ?? []).map((c: Record<string, unknown>) => {
          const plans = (c.contracted_plans as { plan_name: string; monthly_price: number }[] | null) ?? []
          const plan = plans[0] ?? null
          return {
            id: c.id as string,
            name: c.name as string,
            brand: c.brand as string | null,
            status: c.status as string,
            plan_name: plan?.plan_name ?? null,
            plan_price: plan?.monthly_price ?? null,
          }
        })
        setClients(mapped)
      })
  }, [open])

  function reset() {
    setSelectedClient(null)
    setDriveFolderUrl('')
    setDriveFolderId('')
    setNotes('')
    setError('')
  }

  async function handleCreate() {
    if (!selectedClient) { setError('Selecciona un cliente activo'); return }
    if (!cycleMonth) { setError('Selecciona el mes del ciclo'); return }
    setSaving(true)
    setError('')

    try {
      const { data: cycle, error: cycleErr } = await supabase
        .from('sea_cycles')
        .insert({
          client_id: selectedClient.id,
          client_name: selectedClient.name,
          cycle_month: cycleMonth + '-01',
          drive_folder_id: driveFolderId || null,
          drive_folder_url: driveFolderUrl || null,
          notes: notes || null,
        })
        .select('id')
        .single()

      if (cycleErr || !cycle) throw cycleErr ?? new Error('No se pudo crear el ciclo')

      await supabase.from('sea_agent_runs').insert(
        AGENTS.map(a => ({
          cycle_id: cycle.id,
          agent_number: a.number,
          agent_name: a.name,
          status: 'Pendiente',
        }))
      )

      reset()
      onCreated()
      onOpenChange(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear ciclo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo ciclo SEA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Client selector — required, active clients only */}
          <div className="space-y-1.5">
            <Label>
              Cliente <span className="text-red-400">*</span>
            </Label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedClient?.id ?? ''}
              onChange={e => {
                const found = clients.find(c => c.id === e.target.value) ?? null
                setSelectedClient(found)
              }}
            >
              <option value="">— Seleccionar cliente activo —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.brand ? ` · ${c.brand}` : ''}
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Solo aparecen clientes con estado Activo o Pendiente de pago.
              </p>
            )}
          </div>

          {/* Plan info — auto-filled, read-only */}
          {selectedClient && (
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plan contratado</p>
              {selectedClient.plan_name ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{selectedClient.plan_name}</span>
                  {selectedClient.plan_price && (
                    <span className="text-sm font-semibold text-primary">
                      ${selectedClient.plan_price.toLocaleString()} USD/mes
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Este cliente no tiene un plan registrado aún.
                </div>
              )}
              <p className="text-xs text-muted-foreground">Estado: {selectedClient.status}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Mes del ciclo <span className="text-red-400">*</span></Label>
            <Input
              type="month"
              value={cycleMonth}
              onChange={e => setCycleMonth(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>URL carpeta Drive <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              value={driveFolderUrl}
              onChange={e => setDriveFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>ID carpeta Drive <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              value={driveFolderId}
              onChange={e => setDriveFolderId(e.target.value)}
              placeholder="1KFZ-STSpVuUqBcU3eashq..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Primer ciclo, contexto especial..."
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={saving || !selectedClient} className="bg-primary hover:bg-primary/90 text-white">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Crear ciclo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
