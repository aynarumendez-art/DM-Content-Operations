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

const ROLES = ['Estratega','Editor','Camarógrafo','Community Manager','Diseñador','Copywriter','Director de cuentas','Socio','Otro']
const METHODS = ['Transferencia','PayPal','Efectivo','Stripe','Otro']

export function EquipoPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [form, setForm] = useState({
    name: '', role: '', type: 'Interno', whatsapp: '', email: '',
    base_rate: '', payment_method: '', payment_details: '',
    status: 'Activo', notes: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('team_members').select('*').order('name')
    setMembers(data ?? [])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('team_members').insert([{
      ...form,
      base_rate: Number(form.base_rate) || null,
      payment_details: form.payment_details || null,
      notes: form.notes || null,
    }])
    if (!error) { setOpen(false); setForm({ name:'',role:'',type:'Interno',whatsapp:'',email:'',base_rate:'',payment_method:'',payment_details:'',status:'Activo',notes:'' }); loadData() }
    setSaving(false)
  }

  const filtered = members.filter(m => filterType === 'all' || m.type === filterType)

  return (
    <div>
      <PageHeader
        title="Equipo y terceros"
        subtitle={`${members.filter(m => m.type === 'Interno').length} internos · ${members.filter(m => m.type === 'Tercero').length} terceros`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={14} /> Agregar miembro</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-card border-border">
              <DialogHeader><DialogTitle>Agregar al equipo</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Nombre *" className="col-span-2"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="Rol">
                  <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Tipo">
                  <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Interno">Interno</SelectItem>
                      <SelectItem value="Tercero">Tercero</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="WhatsApp"><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
                <Field label="Tarifa base ($)"><Input type="number" value={form.base_rate} onChange={e => setForm(f => ({ ...f, base_rate: e.target.value }))} /></Field>
                <Field label="Método de pago">
                  <Select value={form.payment_method} onValueChange={(v) => setForm(f => ({ ...f, payment_method: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Datos de pago" className="col-span-2"><Input value={form.payment_details} onChange={e => setForm(f => ({ ...f, payment_details: e.target.value }))} placeholder="CLABE, cuenta, etc." /></Field>
                <Field label="Notas" className="col-span-2"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.name || saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-3 mb-5">
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Interno">Internos</SelectItem>
            <SelectItem value="Tercero">Terceros</SelectItem>
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
                {['Nombre','Rol','Tipo','WhatsApp','Email','Tarifa','Estado'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin miembros</td></tr>
              ) : filtered.map((m, i) => (
                <tr key={m.id} className={`border-t border-border hover:bg-secondary/30 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-3 font-medium">{m.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{m.role ?? '—'}</td>
                  <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded border ${m.type === 'Interno' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-orange-500/15 text-orange-400 border-orange-500/20'}`}>{m.type}</span></td>
                  <td className="px-3 py-3 text-muted-foreground">{m.whatsapp ?? '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{m.email ?? '—'}</td>
                  <td className="px-3 py-3">{m.base_rate ? `$${m.base_rate.toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={m.status} /></td>
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
