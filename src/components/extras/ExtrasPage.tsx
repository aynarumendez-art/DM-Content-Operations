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
import { Plus } from 'lucide-react'

const EXTRA_STATUSES = ['Solicitado','Cotizado','Aprobado','Pagado','En producción','Entregado','Cancelado']
const EXTRA_TYPES = ['Reel adicional','Campaña','Fotografía','Copy adicional','Story pack','Diseño','Otro']

interface ClientOption { id: string; name: string }

export function ExtrasPage() {
  const [extras, setExtras] = useState<any[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '', request_description: '', extra_type: '',
    description: '', quoted_price: '', quote_status: 'Solicitado',
    deliverable_link: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('extras')
      .select('*, clients(name,brand)')
      .order('created_at', { ascending: false })
    setExtras(data ?? [])
    const { data: cls } = await supabase.from('clients').select('id,name')
    setClients(cls ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('extras').insert([{
      ...form,
      quoted_price: Number(form.quoted_price) || null,
      description: form.description || null,
      deliverable_link: form.deliverable_link || null,
    }])
    if (!error) { setOpen(false); loadData() }
    setSaving(false)
  }

  const filtered = extras.filter(e => filterStatus === 'all' || e.quote_status === filterStatus)
  const pendingQuote = extras.filter(e => e.quote_status === 'Solicitado').length

  return (
    <div>
      <PageHeader
        title="Extras / Add-ons"
        subtitle={pendingQuote > 0 ? `${pendingQuote} pendientes de cotizar` : 'Sin pendientes de cotizar'}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={14} /> Nuevo extra</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-card border-border">
              <DialogHeader><DialogTitle>Registrar extra / add-on</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Cliente *" className="col-span-2">
                  <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Descripción solicitud *" className="col-span-2">
                  <Textarea value={form.request_description} onChange={e => setForm(f => ({ ...f, request_description: e.target.value }))} rows={2} />
                </Field>
                <Field label="Tipo">
                  <Select value={form.extra_type} onValueChange={(v) => setForm(f => ({ ...f, extra_type: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{EXTRA_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Precio cotizado ($)"><Input type="number" value={form.quoted_price} onChange={e => setForm(f => ({ ...f, quoted_price: e.target.value }))} /></Field>
                <Field label="Estado">
                  <Select value={form.quote_status} onValueChange={(v) => setForm(f => ({ ...f, quote_status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXTRA_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Link entregable"><Input value={form.deliverable_link} onChange={e => setForm(f => ({ ...f, deliverable_link: e.target.value }))} /></Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.client_id || !form.request_description || saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-3 mb-5">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {EXTRA_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-card border border-border animate-pulse" />)}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['Cliente','Solicitud','Tipo','Precio','Estado'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin extras</td></tr>
              ) : filtered.map((e, i) => (
                <tr key={e.id} className={`border-t border-border hover:bg-secondary/30 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-3 font-medium">{e.clients?.name ?? '—'}</td>
                  <td className="px-3 py-3 max-w-[240px] text-foreground">{e.request_description}</td>
                  <td className="px-3 py-3 text-muted-foreground">{e.extra_type ?? '—'}</td>
                  <td className="px-3 py-3 font-semibold">{e.quoted_price ? `$${e.quoted_price.toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={e.quote_status} /></td>
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
