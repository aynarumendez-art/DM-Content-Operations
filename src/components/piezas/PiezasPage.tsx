'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContentPiece } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ExternalLink } from 'lucide-react'

const PRODUCTION_STATUSES = [
  'Idea','Guion pendiente','Guion listo','Por grabar','Grabado',
  'En edición','Edición lista','En revisión interna','Enviado al cliente',
  'Esperando comentarios','En corrección','Aprobado','Programado',
  'Publicado','Pausado por pago','Pausado por cliente','Cancelado',
]

const PIECE_TYPES = ['Reel', 'Carrusel', 'Historia', 'Portada', 'Copy', 'Otro']
const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Otro']

const KANBAN_COLS = [
  { key: 'pending', label: 'Pendiente', statuses: ['Idea','Guion pendiente','Guion listo','Por grabar'] },
  { key: 'production', label: 'En producción', statuses: ['Grabado','En edición','Edición lista','En revisión interna'] },
  { key: 'review', label: 'En revisión', statuses: ['Enviado al cliente','Esperando comentarios','En corrección'] },
  { key: 'done', label: 'Listo', statuses: ['Aprobado','Programado','Publicado'] },
]

interface ClientOption { id: string; name: string; brand: string | null }

export function PiezasPage() {
  const [pieces, setPieces] = useState<ContentPiece[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'tabla' | 'kanban'>('tabla')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [filterClient, setFilterClient] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '', month: new Date().toISOString().slice(0, 7),
    piece_type: 'Reel', title: '', content_pillar: '', objective: '',
    format: '', channel: 'Instagram',
    recording_date: '', internal_delivery_date: '', client_send_date: '',
    approval_deadline: '', publication_date: '',
    production_status: 'Idea',
    copy_text: '', cta: '',
    script_link: '', edit_link: '', final_link: '',
  })

  useEffect(() => { loadData() }, [filterMonth, filterClient])

  async function loadData() {
    setLoading(true)
    let query = supabase.from('content_pieces').select('*, clients(name,brand)').eq('month', filterMonth)
    if (filterClient !== 'all') query = query.eq('client_id', filterClient)
    const { data } = await query.order('publication_date', { ascending: true, nullsFirst: false })
    setPieces((data as ContentPiece[]) ?? [])
    const { data: cls } = await supabase.from('clients').select('id,name,brand').eq('status', 'Activo')
    setClients(cls ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    )
    const { error } = await supabase.from('content_pieces').insert([payload])
    if (!error) { setOpen(false); loadData() }
    setSaving(false)
  }

  const filtered = pieces.filter(p => filterStatus === 'all' || p.production_status === filterStatus)

  return (
    <div>
      <PageHeader
        title="Piezas de contenido"
        subtitle={`${pieces.length} piezas · ${pieces.filter(p => p.published).length} publicadas`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant={view === 'tabla' ? 'default' : 'ghost'} onClick={() => setView('tabla')}>Tabla</Button>
            <Button size="sm" variant={view === 'kanban' ? 'default' : 'ghost'} onClick={() => setView('kanban')}>Kanban</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 ml-2"><Plus size={14} /> Nueva pieza</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
                <DialogHeader><DialogTitle>Nueva pieza de contenido</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Field label="Cliente *" className="col-span-2">
                    <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v ?? "" }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                      <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Mes"><Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></Field>
                  <Field label="Tipo de pieza">
                    <Select value={form.piece_type} onValueChange={(v) => setForm(f => ({ ...f, piece_type: v ?? "" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PIECE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Título *" className="col-span-2"><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
                  <Field label="Pilar de contenido"><Input value={form.content_pillar} onChange={e => setForm(f => ({ ...f, content_pillar: e.target.value }))} /></Field>
                  <Field label="Canal">
                    <Select value={form.channel} onValueChange={(v) => setForm(f => ({ ...f, channel: v ?? "" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Estado producción" className="col-span-2">
                    <Select value={form.production_status} onValueChange={(v) => setForm(f => ({ ...f, production_status: v ?? "" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRODUCTION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Fecha grabación"><Input type="date" value={form.recording_date} onChange={e => setForm(f => ({ ...f, recording_date: e.target.value }))} /></Field>
                  <Field label="Entrega interna"><Input type="date" value={form.internal_delivery_date} onChange={e => setForm(f => ({ ...f, internal_delivery_date: e.target.value }))} /></Field>
                  <Field label="Envío al cliente"><Input type="date" value={form.client_send_date} onChange={e => setForm(f => ({ ...f, client_send_date: e.target.value }))} /></Field>
                  <Field label="Límite aprobación"><Input type="date" value={form.approval_deadline} onChange={e => setForm(f => ({ ...f, approval_deadline: e.target.value }))} /></Field>
                  <Field label="Fecha publicación"><Input type="date" value={form.publication_date} onChange={e => setForm(f => ({ ...f, publication_date: e.target.value }))} /></Field>
                  <Field label="CTA"><Input value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} /></Field>
                  <Field label="Copy" className="col-span-2"><Textarea value={form.copy_text} onChange={e => setForm(f => ({ ...f, copy_text: e.target.value }))} rows={3} /></Field>
                  <Field label="Link guion"><Input value={form.script_link} onChange={e => setForm(f => ({ ...f, script_link: e.target.value }))} /></Field>
                  <Field label="Link edición"><Input value={form.edit_link} onChange={e => setForm(f => ({ ...f, edit_link: e.target.value }))} /></Field>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={save} disabled={!form.client_id || !form.title || saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex gap-3 mb-5">
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40" />
        <Select value={filterClient} onValueChange={(v) => setFilterClient(v ?? "")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos los clientes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {PRODUCTION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-card border border-border animate-pulse" />)}</div>
      ) : view === 'tabla' ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['Cliente','Tipo','Título','Estado','Publicación','Canal','Links'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin piezas</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className={`border-t border-border hover:bg-secondary/30 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-3 font-medium">{(p as any).clients?.name ?? '—'}</td>
                  <td className="px-3 py-3"><span className="text-xs bg-secondary px-2 py-0.5 rounded">{p.piece_type}</span></td>
                  <td className="px-3 py-3 max-w-[180px] truncate text-foreground">{p.title}</td>
                  <td className="px-3 py-3"><StatusBadge status={p.production_status} /></td>
                  <td className="px-3 py-3 text-muted-foreground">{p.publication_date ?? '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.channel ?? '—'}</td>
                  <td className="px-3 py-3 flex gap-1">
                    {p.script_link && <a href={p.script_link} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">Guion</a>}
                    {p.edit_link && <a href={p.edit_link} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">Edición</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {KANBAN_COLS.map(col => {
            const colPieces = filtered.filter(p => col.statuses.includes(p.production_status))
            return (
              <div key={col.key} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</h3>
                  <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{colPieces.length}</span>
                </div>
                <div className="space-y-2">
                  {colPieces.map(p => (
                    <div key={p.id} className="bg-secondary/40 border border-border rounded-md p-3 hover:border-primary/30 transition-colors">
                      <p className="text-xs text-muted-foreground mb-1">{(p as any).clients?.name ?? '—'}</p>
                      <p className="text-sm font-medium text-foreground line-clamp-2">{p.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={p.production_status} />
                        {p.publication_date && <span className="text-[10px] text-muted-foreground">{p.publication_date}</span>}
                      </div>
                    </div>
                  ))}
                  {colPieces.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Vacío</p>}
                </div>
              </div>
            )
          })}
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
