export const dynamic = "force-dynamic"

import { AppShell } from '@/components/layout/AppShell'
import { ClientesPage } from '@/components/clientes/ClientesPage'

export default function Page() {
  return <AppShell><ClientesPage /></AppShell>
}
