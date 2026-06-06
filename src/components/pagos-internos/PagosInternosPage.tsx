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

const PAYMENT_TYPES = [
  'Fee estratégico','Producción','Edición','Comisión comercial',
  'Tercero','Extra','Reembolso','Viático','Locación','Talento','Otro',
]
const INTERNAL_STATUSES = [
  'Pendiente','Aprobado','Pagado',
  'Retenido por falta de pago del cliente','En revisión','Cancelado',
]

interface Option { id: string; name: string }

export function PagosInternosPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [clients, setClients] = useState<Option[]>([])
  const [members, setMembers] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '', month: new Date().toISOString().slice(0, 7),
    project_or_plan: '', payee_id: '', role_executed: '',
    assigned_amount: '', payment_type: 'Producción',
    status: 'Pendiente', payment_deadline: '', notes: '',
  })

  useEffect(() => { loadData() }, [filterMonth])

  async function loadData() {
    setLoading(true)
    let q = supabase.from('internal_payments').select('*, clients(name), team_members:payee_id(name,role)').eq('month', filterMonth)
    const { data } = await q.order('created_at', { ascending: false })
    setPayments(data ?? [])
    const [{ data: cls }, { data: mbs }] = await Promise.all([
      supabase.from('clients').select('id,name'),
      supabase.from('team_members').select('id,name').eq('status', 'Activo'),
    ])
    setClients(cls ?? [])
    setMembers(mbs ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('internal_payments').insert([{
      ...form,
      assigned_amount: Number(form.assigned_amount),
      client_id: form.client_id || null,
      payee_id: form.payee_id || null,
      payment_deadline: form.payment_deadline || null,
      notes: form.notes || null,
      project_or_plan: form.project_or_plan || null,
      role_executed: form.role_executed || null,
    }])
    if (!error) { setOpen(false); loadData() }
    setSaving(false)
  }

  const filtered = payments.filter(p => filterStatus === 'all' || p.status === filterStatus)
  const totalPending = payments.filter(p => p.status === 'Pendiente').reduce((s, p) => s + (p.assigned_amount ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Pagos internos"
        subtitle={`Pendiente: $${totalPending.toLocaleString()}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={14} /> Nuevo pago</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
              <DialogHeader><DialogTitle>Registrar pago interno</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Persona a pagar *" className="col-span-2">
                  <Select value={form.payee_id} onValueChange={(v) => setForm(f => ({ ...f, payee_id: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Cliente (opcional)">
                  <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Mes"><Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></Field>
                <Field label="Tipo de pago">
                  <Select value={form.payment_type} onValueChange={(v) => setForm(f => ({ ...f, payment_type: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Monto *"><Input type="number" value={form.assigned_amount} onChange={e => setForm(f => ({ ...f, assigned_amount: e.target.value }))} /></Field>
                <Field label="Rol ejecutado"><Input value={form.role_executed} onChange={e => setForm(f => ({ ...f, role_executed: e.target.value }))} /></Field>
                <Field label="Estado">
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INTERNAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Fecha límite pago"><Input type="date" value={form.payment_deadline} onChange={e => setForm(f => ({ ...f, payment_deadline: e.target.value }))} /></Field>
                <Field label="Notas" className="col-span-2"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.payee_id || !form.assigned_amount || saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-3 mb-5">
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "")}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {INTERNAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                {['Persona','Cliente','Tipo','Rol','Monto','F. límite','Estado'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin pagos internos</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className={`border-t border-border hover:bg-secondary/30 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-3 font-medium">{p.team_members?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.clients?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{p.payment_type}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.role_executed ?? '—'}</td>
                  <td className="px-3 py-3 font-semibold text-foreground">${p.assigned_amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.payment_deadline ?? '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
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
