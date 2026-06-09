'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

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

interface Client {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

export function SeaNewCycleDialog({ open, onOpenChange, onCreated }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
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
    supabase.from('clients').select('id, name').order('name').then(({ data }) => {
      setClients(data ?? [])
    })
  }, [])

  async function handleCreate() {
    if (!clientName.trim()) { setError('El nombre del cliente es obligatorio'); return }
    if (!cycleMonth) { setError('Selecciona el mes del ciclo'); return }
    setSaving(true)
    setError('')

    try {
      const monthDate = cycleMonth + '-01'

      // Create cycle
      const { data: cycle, error: cycleErr } = await supabase
        .from('sea_cycles')
        .insert({
          client_id: clientId || null,
          client_name: clientName.trim(),
          cycle_month: monthDate,
          drive_folder_id: driveFolderId || null,
          drive_folder_url: driveFolderUrl || null,
          notes: notes || null,
        })
        .select('id')
        .single()

      if (cycleErr || !cycle) throw cycleErr ?? new Error('No se pudo crear el ciclo')

      // Create 10 agent run stubs
      const runs = AGENTS.map(a => ({
        cycle_id: cycle.id,
        agent_number: a.number,
        agent_name: a.name,
        status: 'Pendiente',
      }))
      await supabase.from('sea_agent_runs').insert(runs)

      onCreated()
      onOpenChange(false)
      // reset
      setClientId(''); setClientName(''); setDriveFolderUrl(''); setDriveFolderId(''); setNotes('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear ciclo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo ciclo SEA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Client selector */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={clientId}
              onChange={e => {
                const id = e.target.value
                setClientId(id)
                if (id) {
                  const found = clients.find(c => c.id === id)
                  if (found) setClientName(found.name)
                } else {
                  setClientName('')
                }
              }}
            >
              <option value="">— Seleccionar cliente existente —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre del cliente <span className="text-muted-foreground text-xs">(o ingresa manual)</span></Label>
            <Input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ej: BMI"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mes del ciclo</Label>
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
              placeholder="Primer ciclo, plan Avanzado..."
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</> : 'Crear ciclo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
