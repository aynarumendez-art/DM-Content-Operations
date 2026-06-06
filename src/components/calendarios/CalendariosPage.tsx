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
import { Plus, ExternalLink } from 'lucide-react'

const CALENDAR_STATUSES = [
  'Por crear','En estrategia','Enviado al cliente','Esperando aprobación',
  'En corrección','Aprobado','En producción','En publicación','Cerrado','Pausado',
]

interface ClientOption { id: string; name: string }

export function CalendariosPage() {
  const [calendars, setCalendars] = useState<any[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '', month: new Date().toISOString().slice(0, 7),
    delivery_date: '', client_approval_deadline: '',
    status: 'Por crear', calendar_link: '', observations: '',
  })

  useEffect(() => { loadData() }, [filterMonth])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('monthly_calendars')
      .select('*, clients(name,brand)')
      .eq('month', filterMonth)
      .order('created_at', { ascending: false })
    setCalendars(data ?? [])
    const { data: cls } = await supabase.from('clients').select('id,name').eq('status', 'Activo')
    setClients(cls ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('monthly_calendars').insert([{
      ...form,
      delivery_date: form.delivery_date || null,
      client_approval_deadline: form.client_approval_deadline || null,
      calendar_link: form.calendar_link || null,
      observations: form.observations || null,
    }])
    if (!error) { setOpen(false); loadData() }
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Calendarios mensuales"
        subtitle={`${calendars.filter(c => c.status === 'Aprobado').length} aprobados · ${calendars.length} total`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={14} /> Nuevo calendario</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-card border-border">
              <DialogHeader><DialogTitle>Nuevo calendario mensual</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Cliente *" className="col-span-2">
                  <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Mes"><Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></Field>
                <Field label="Estado">
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CALENDAR_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Fecha entrega plan"><Input type="date" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} /></Field>
                <Field label="Límite aprobación cliente"><Input type="date" value={form.client_approval_deadline} onChange={e => setForm(f => ({ ...f, client_approval_deadline: e.target.value }))} /></Field>
                <Field label="Link calendario" className="col-span-2"><Input value={form.calendar_link} onChange={e => setForm(f => ({ ...f, calendar_link: e.target.value }))} /></Field>
                <Field label="Observaciones" className="col-span-2"><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} /></Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.client_id || saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
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
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['Cliente','Mes','Entrega','Límite aprobación','Estado','Link'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendars.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin calendarios</td></tr>
              ) : calendars.map((c, i) => (
                <tr key={c.id} className={`border-t border-border hover:bg-secondary/30 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-3 font-medium">{c.clients?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{c.month}</td>
                  <td className="px-3 py-3 text-muted-foreground">{c.delivery_date ?? '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{c.client_approval_deadline ?? '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3">
                    {c.calendar_link
                      ? <a href={c.calendar_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs"><ExternalLink size={12} /> Ver</a>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
