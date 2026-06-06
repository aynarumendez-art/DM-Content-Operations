'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  CalendarDays,
  Film,
  Camera,
  PackagePlus,
  UserCog,
  Wallet,
} from 'lucide-react'

const nav = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Clientes', href: '/clientes', icon: Users },
  { label: 'Planes', href: '/planes', icon: FileText },
  { label: 'Pagos clientes', href: '/pagos', icon: CreditCard },
  { label: 'Calendarios', href: '/calendarios', icon: CalendarDays },
  { label: 'Piezas', href: '/piezas', icon: Film },
  { label: 'Grabaciones', href: '/grabaciones', icon: Camera },
  { label: 'Extras', href: '/extras', icon: PackagePlus },
  { label: 'Equipo', href: '/equipo', icon: UserCog },
  { label: 'Pagos internos', href: '/pagos-internos', icon: Wallet },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border flex flex-col z-30">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">DM Content</span>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">Operations</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground/40">v1.0 · {new Date().getFullYear()}</p>
      </div>
    </aside>
  )
}
