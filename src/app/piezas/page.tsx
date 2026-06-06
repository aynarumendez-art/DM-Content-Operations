export const dynamic = "force-dynamic"

import { AppShell } from '@/components/layout/AppShell'
import { PiezasPage } from '@/components/piezas/PiezasPage'

export default function Page() {
  return <AppShell><PiezasPage /></AppShell>
}
