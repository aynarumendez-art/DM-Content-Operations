'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClientPayment } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

const PAYMENT_STATUSES = ['Pendiente', 'Pagado', 'Atrasado', 'En validación', 'No recibido']
const METHODS = ['Transferencia', 'Efectivo', 'PayPal', 'Stripe', 'Otro']

function currentMonth() { return new Date().toISOString().slice(0, 7) }

interface ClientOption { id: string; name: string; brand: string | null }

export function PagosPage() {
  const [payments, setPayments] = useState<ClientPayment[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(currentMonth())
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '', service_month: currentMonth(),
    total_amount: '', initial_payment: '', initial_deadline: '',
    initial_status: 'Pendiente', second_payment: '',
    second_deadline: '', second_status: 'Pendiente',
    payment_method: '', notes: '',
  })

  useEffect(() => {
    loadPayments()
    supabase.from('clients').select('id,name,brand').eq('status', 'Activo').then(({ data }) => setClients(data ?? []))
  }, [filterMonth])

  async function loadPayments() {
    setLoading(true)
    const { data } = await supabase
      .from('client_payments')
      .select('*, clients(name,brand)')
      .eq('service_month', filterMonth)
      .order('created_at', { ascending: false })
    setPayments((data as ClientPayment[]) ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('client_payments').insert([{
      ...form,
      total_amount: Number(form.total_amount),
      initial_payment: Number(form.initial_payment) || null,
      second_payment: Number(form.second_payment) || null,
      initial_deadline: form.initial_deadline || null,
      second_deadline: form.second_deadline || null,
    }])
    if (!error) { setOpen(false); loadPayments() }
    setSaving(false)
  }

  const totalRevenue = payments.reduce((s, p) => s + (p.total_amount ?? 0), 0)
  const paidInitial = payments.filter(p => p.initial_status === 'Pagado').length
  const paidSecond = payments.filter(p => p.second_status === 'Pagado').length

  return (
    <div>
      <PageHeader
        title="Pagos de clientes"
        subtitle={`Ingresos del mes: $${totalRevenue.toLocaleString()}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={14} /> Registrar pago</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
              <DialogHeader><DialogTitle>Registrar pago de cliente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Cliente *" className="col-span-2">
                  <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.brand ? ` — ${c.brand}` : ''}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Mes de servicio"><Input type="month" value={form.service_month} onChange={e => setForm(f => ({ ...f, service_month: e.target.value }))} /></Field>
                <Field label="Monto total"><Input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} /></Field>
                <Field label="Pago inicial (50%)"><Input type="number" value={form.initial_payment} onChange={e => setForm(f => ({ ...f, initial_payment: e.target.value }))} /></Field>
                <Field label="Fecha límite inicial"><Input type="date" value={form.initial_deadline} onChange={e => setForm(f => ({ ...f, initial_deadline: e.target.value }))} /></Field>
                <Field label="Estado pago inicial">
                  <Select value={form.initial_status} onValueChange={(v) => setForm(f => ({ ...f, initial_status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Segundo pago (50%)"><Input type="number" value={form.second_payment} onChange={e => setForm(f => ({ ...f, second_payment: e.target.value }))} /></Field>
                <Field label="Fecha límite segundo pago"><Input type="date" value={form.second_deadline} onChange={e => setForm(f => ({ ...f, second_deadline: e.target.value }))} /></Field>
                <Field label="Estado segundo pago">
                  <Select value={form.second_status} onValueChange={(v) => setForm(f => ({ ...f, second_status: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Método de pago">
                  <Select value={form.payment_method} onValueChange={(v) => setForm(f => ({ ...f, payment_method: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Notas" className="col-span-2">
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.client_id || !form.total_amount || saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-4 mb-5">
        <div className="flex gap-3 text-sm">
          <Pill label="Pagos iniciales" value={`${paidInitial}/${payments.length}`} />
          <Pill label="Segundos pagos" value={`${paidSecond}/${payments.length}`} />
          <Pill label="Total recaudado" value={`$${totalRevenue.toLocaleString()}`} accent />
        </div>
        <div className="ml-auto">
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-card border border-border animate-pulse" />)}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['Cliente', 'Mes', 'Total', 'Pago inicial', 'F. límite', 'Estado', 'Segundo pago', 'F. límite', 'Estado', 'Método'].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Sin pagos registrados</td></tr>
              ) : payments.map((p, i) => (
                <tr key={p.id} className={`border-t border-border hover:bg-secondary/30 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-3 font-medium">{(p as any).clients?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.service_month}</td>
                  <td className="px-3 py-3 font-semibold text-foreground">${p.total_amount.toLocaleString()}</td>
                  <td className="px-3 py-3">${(p.initial_payment ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.initial_deadline ?? '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={p.initial_status} /></td>
                  <td className="px-3 py-3">${(p.second_payment ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.second_deadline ?? '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={p.second_status} /></td>
                  <td className="px-3 py-3 text-muted-foreground">{p.payment_method ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Pill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`px-3 py-1.5 rounded-md border text-sm ${accent ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`}>
      <span className="text-muted-foreground text-xs">{label}: </span><strong>{value}</strong>
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
