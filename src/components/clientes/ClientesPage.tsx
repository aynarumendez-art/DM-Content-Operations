'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, ExternalLink } from 'lucide-react'

const CLIENT_STATUSES = [
  'Prospecto', 'Activo', 'Pendiente de pago', 'Pausado por pago',
  'Pausado por cliente', 'En cancelación', 'Finalizado', 'No renovó',
]

const PLAN_NAMES = ['Plan Inicial', 'Plan Avanzado', 'Plan Profesional', 'Campaña Especial']

const emptyClient = {
  name: '', brand: '', contact_name: '', whatsapp: '', email: '',
  instagram: '', city: '', country: 'México', status: 'Prospecto',
  start_date: '', renewal_date: '', cancellation_deadline: '',
  approval_contact: '', folder_link: '', notes: '',
  accesses_delivered: false,
}

export function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<typeof emptyClient>(emptyClient)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients((data as Client[]) ?? [])
    setLoading(false)
  }

  async function saveClient() {
    setSaving(true)
    const payload = {
      ...form,
      start_date: form.start_date || null,
      renewal_date: form.renewal_date || null,
      cancellation_deadline: form.cancellation_deadline || null,
    }
    const { error } = await supabase.from('clients').insert([payload])
    if (!error) { setOpen(false); setForm(emptyClient); loadClients() }
    setSaving(false)
  }

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.brand ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.filter(c => c.status === 'Activo').length} activos · ${clients.length} total`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={14} /> Nuevo cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle>Nuevo cliente</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Nombre *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="Marca / Negocio"><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></Field>
                <Field label="Contacto principal"><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></Field>
                <Field label="WhatsApp"><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
                <Field label="Instagram"><Input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} /></Field>
                <Field label="Ciudad"><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></Field>
                <Field label="País"><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></Field>
                <Field label="Estado">
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CLIENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Fecha inicio"><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></Field>
                <Field label="Fecha renovación"><Input type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} /></Field>
                <Field label="Fecha límite cancelación"><Input type="date" value={form.cancellation_deadline} onChange={e => setForm(f => ({ ...f, cancellation_deadline: e.target.value }))} /></Field>
                <Field label="Responsable de aprobación"><Input value={form.approval_contact} onChange={e => setForm(f => ({ ...f, approval_contact: e.target.value }))} /></Field>
                <Field label="Link carpeta del cliente"><Input value={form.folder_link} onChange={e => setForm(f => ({ ...f, folder_link: e.target.value }))} /></Field>
                <Field label="Notas internas" className="col-span-2">
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={saveClient} disabled={!form.name || saving}>
                  {saving ? 'Guardando...' : 'Guardar cliente'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o marca..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {CLIENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-card border border-border animate-pulse" />
        ))}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['Cliente', 'Marca', 'Contacto', 'WhatsApp', 'Estado', 'Inicio', 'Carpeta'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Sin clientes</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} className={`border-t border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.brand ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contact_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.whatsapp ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{c.start_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.folder_link
                      ? <a href={c.folder_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><ExternalLink size={12} /> Ver</a>
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
