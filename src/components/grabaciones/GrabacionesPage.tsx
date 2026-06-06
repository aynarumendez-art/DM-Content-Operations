'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Camera } from 'lucide-react'

const SESSION_STATUSES = ['Programada','Confirmada','Realizada','Cancelada','Reagendada']
const LOCATION_TYPES = ['Estudio','Exterior','Cliente','Otro']

interface ClientOption { id: string; name: string }

export function GrabacionesPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [form, setForm] = useState({
    client_id: '', month: new Date().toISOString().slice(0, 7),
    recording_date: '', start_time: '', end_time: '',
    location: '', location_type: 'Estudio',
    required_materials: '', status: 'Programada',
    extra_costs: '', notes: '',
  })

  useEffect(() => { loadData() }, [filterMonth])

  async function loadData() {
    setLoading(true)
    const start = filterMonth + '-01'
    const end = filterMonth + '-31'
    const { data } = await supabase
      .from('recording_sessions')
      .select('*, clients(name,brand)')
      .gte('recording_date', start)
      .lte('recording_date', end)
      .order('recording_date', { ascending: true })
    setSessions(data ?? [])
    const { data: cls } = await supabase.from('clients').select('id,name').eq('status', 'Activo')
    setClients(cls ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('recording_sessions').insert([{
      ...form,
      extra_costs: Number(form.extra_costs) || 0,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      required_materials: form.required_materials || null,
      notes: form.notes || null,
    }])
    if (!error) { setOpen(false); loadData() }
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Jornadas de grabación"
        subtitle={`${sessions.filter(s => s.status === 'Confirmada').length} confirmadas este mes`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={14} /> Nueva jornada</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-card border-border">
              <DialogHeader><DialogTitle>Nueva jornada de grabación</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Cliente *" className="col-span-2">
                  <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Fecha *"><Input type="date" value={form.recording_date} onChange={e => setForm(f => ({ ...f, recording_date: e.target.value }))} /></Field>
                <Field label="Mes"><Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></Field>
                <Field label="Hora inicio"><Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></Field>
                <Field label="Hora fin"><Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></Field>
                <Field label="Locación"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></Field>
                <Field label="Tipo locación">
                  <Select value={form.location_type} onValueChange={(v) => setForm(f => ({ ...f, location_type: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Estado">
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SESSION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Costos extra ($)"><Input type="number" value={form.extra_costs} onChange={e => setForm(f => ({ ...f, extra_costs: e.target.value }))} /></Field>
                <Field label="Material requerido" className="col-span-2"><Textarea value={form.required_materials} onChange={e => setForm(f => ({ ...f, required_materials: e.target.value }))} rows={2} /></Field>
                <Field label="Notas" className="col-span-2"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.client_id || !form.recording_date || saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-3 mb-5">
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40" />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-card border border-border animate-pulse" />)}</div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Camera size={32} className="mb-3 opacity-30" />
          <p className="text-sm">Sin jornadas este mes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map(s => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">{s.clients?.name ?? '—'}</p>
                  <p className="font-semibold text-foreground mt-0.5">{s.recording_date}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mt-3">
                {s.start_time && <p>⏰ {s.start_time}{s.end_time ? ` — ${s.end_time}` : ''}</p>}
                {s.location && <p>📍 {s.location} ({s.location_type})</p>}
                {s.extra_costs > 0 && <p>💰 Costos extra: ${s.extra_costs}</p>}
                {s.notes && <p className="text-muted-foreground/70 mt-2 line-clamp-2">{s.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
