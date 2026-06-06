'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContractedPlan } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

const PLAN_DEFAULTS: Record<string, Partial<typeof emptyForm>> = {
  'Plan Inicial':     { monthly_price: '450', reels_count: '4', carousels_count: '2', stories_count: '8', sessions_count: '1', recording_hours: '2', revision_rounds: '2' },
  'Plan Avanzado':    { monthly_price: '650', reels_count: '6', carousels_count: '4', stories_count: '12', sessions_count: '1', recording_hours: '3', revision_rounds: '2' },
  'Plan Profesional': { monthly_price: '900', reels_count: '8', carousels_count: '6', stories_count: '16', sessions_count: '2', recording_hours: '4', revision_rounds: '3' },
  'Campaña Especial': { monthly_price: '1200', reels_count: '0', carousels_count: '0', stories_count: '0', sessions_count: '1', recording_hours: '4', revision_rounds: '2' },
}

const emptyForm = {
  client_id: '', plan_name: 'Plan Inicial', monthly_price: '450',
  currency: 'USD', start_date: '', current_cycle: '1', status: 'Activo',
  includes_community: 'false', includes_dms: 'false',
  reels_count: '4', carousels_count: '2', stories_count: '8',
  sessions_count: '1', recording_hours: '2', locations_count: '1', revision_rounds: '2',
  special_conditions: '',
}

interface ClientOption { id: string; name: string; brand: string | null }

export function PlanesPage() {
  const [plans, setPlans] = useState<(ContractedPlan & { clients?: { name: string } })[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('contracted_plans').select('*, clients(name,brand)').order('created_at', { ascending: false })
    setPlans(data as any ?? [])
    const { data: cls } = await supabase.from('clients').select('id,name,brand')
    setClients(cls ?? [])
    setLoading(false)
  }

  function applyPlanDefaults(planName: string | null) {
  if (!planName) return
    const defaults = PLAN_DEFAULTS[planName] ?? {}
    setForm(f => ({ ...f, plan_name: planName, ...defaults }))
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('contracted_plans').insert([{
      client_id: form.client_id,
      plan_name: form.plan_name,
      monthly_price: Number(form.monthly_price),
      currency: form.currency,
      start_date: form.start_date || null,
      current_cycle: Number(form.current_cycle),
      status: form.status,
      includes_community: form.includes_community === 'true',
      includes_dms: form.includes_dms === 'true',
      reels_count: Number(form.reels_count),
      carousels_count: Number(form.carousels_count),
      stories_count: Number(form.stories_count),
      sessions_count: Number(form.sessions_count),
      recording_hours: Number(form.recording_hours),
      locations_count: Number(form.locations_count),
      revision_rounds: Number(form.revision_rounds),
      special_conditions: form.special_conditions || null,
    }])
    if (!error) { setOpen(false); setForm(emptyForm); loadData() }
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Planes contratados"
        subtitle={`${plans.filter(p => p.status === 'Activo').length} activos`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={14} /> Nuevo plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
              <DialogHeader><DialogTitle>Contratar plan</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Field label="Cliente *" className="col-span-2">
                  <Select value={form.client_id} onValueChange={(v) => setForm(f => ({ ...f, client_id: v ?? "" }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Plan *">
                  <Select value={form.plan_name} onValueChange={applyPlanDefaults}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(PLAN_DEFAULTS).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Precio mensual"><Input type="number" value={form.monthly_price} onChange={e => setForm(f => ({ ...f, monthly_price: e.target.value }))} /></Field>
                <Field label="Moneda">
                  <Select value={form.currency} onValueChange={(v) => setForm(f => ({ ...f, currency: v ?? "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="COP">COP</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fecha inicio"><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></Field>
                <Field label="Reels incluidos"><Input type="number" value={form.reels_count} onChange={e => setForm(f => ({ ...f, reels_count: e.target.value }))} /></Field>
                <Field label="Carruseles"><Input type="number" value={form.carousels_count} onChange={e => setForm(f => ({ ...f, carousels_count: e.target.value }))} /></Field>
                <Field label="Historias"><Input type="number" value={form.stories_count} onChange={e => setForm(f => ({ ...f, stories_count: e.target.value }))} /></Field>
                <Field label="Sesiones"><Input type="number" value={form.sessions_count} onChange={e => setForm(f => ({ ...f, sessions_count: e.target.value }))} /></Field>
                <Field label="Horas grabación"><Input type="number" value={form.recording_hours} onChange={e => setForm(f => ({ ...f, recording_hours: e.target.value }))} /></Field>
                <Field label="Locaciones"><Input type="number" value={form.locations_count} onChange={e => setForm(f => ({ ...f, locations_count: e.target.value }))} /></Field>
                <Field label="Rondas revisión"><Input type="number" value={form.revision_rounds} onChange={e => setForm(f => ({ ...f, revision_rounds: e.target.value }))} /></Field>
                <Field label="Condiciones especiales" className="col-span-2">
                  <Textarea value={form.special_conditions} onChange={e => setForm(f => ({ ...f, special_conditions: e.target.value }))} rows={2} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={!form.client_id || saving}>{saving ? 'Guardando...' : 'Guardar plan'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-card border border-border animate-pulse" />)}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                {['Cliente','Plan','Precio','Moneda','Inicio','Reels','Carruseles','Historias','Sesiones','Estado'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Sin planes registrados</td></tr>
              ) : plans.map((p, i) => (
                <tr key={p.id} className={`border-t border-border hover:bg-secondary/30 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-3 py-3 font-medium">{(p as any).clients?.name ?? '—'}</td>
                  <td className="px-3 py-3"><span className="text-xs font-semibold text-primary">{p.plan_name}</span></td>
                  <td className="px-3 py-3 font-semibold">${p.monthly_price.toLocaleString()}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.currency}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.start_date ?? '—'}</td>
                  <td className="px-3 py-3 text-center">{p.reels_count}</td>
                  <td className="px-3 py-3 text-center">{p.carousels_count}</td>
                  <td className="px-3 py-3 text-center">{p.stories_count}</td>
                  <td className="px-3 py-3 text-center">{p.sessions_count}</td>
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
