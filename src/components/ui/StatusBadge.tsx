import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  // Client
  'Prospecto': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Activo': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Pendiente de pago': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Pausado por pago': 'bg-red-500/15 text-red-400 border-red-500/20',
  'Pausado por cliente': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'En cancelación': 'bg-red-600/15 text-red-300 border-red-600/20',
  'Finalizado': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  'No renovó': 'bg-zinc-600/15 text-zinc-500 border-zinc-600/20',
  // Payments
  'Pendiente': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Pagado': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Pagado parcial': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'Atrasado': 'bg-red-500/15 text-red-400 border-red-500/20',
  'En validación': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'No recibido': 'bg-red-600/15 text-red-300 border-red-600/20',
  // Production
  'Idea': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  'Guion pendiente': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Guion listo': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'Por grabar': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Grabado': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'En edición': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Edición lista': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'En revisión interna': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Enviado al cliente': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Esperando comentarios': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'En corrección': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Aprobado': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Programado': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'Publicado': 'bg-green-600/15 text-green-300 border-green-600/20',
  'Cancelado': 'bg-zinc-600/15 text-zinc-500 border-zinc-600/20',
  // Extras
  'Solicitado': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Cotizado': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'En producción': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Entregado': 'bg-green-500/15 text-green-400 border-green-500/20',
  // Internal (Aprobado defined above, reusing teal)
  'Retenido por falta de pago del cliente': 'bg-red-500/15 text-red-400 border-red-500/20',
  'En revisión': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  // Calendar
  'Por crear': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  'En estrategia': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'En publicación': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'Cerrado': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  'Pausado': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const color = statusColors[status] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap',
      color, className
    )}>
      {status}
    </span>
  )
}
