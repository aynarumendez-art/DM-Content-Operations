export const dynamic = "force-dynamic"

import { AppShell } from '@/components/layout/AppShell'
import { PlanesPage } from '@/components/planes/PlanesPage'

export default function Page() {
  return <AppShell><PlanesPage /></AppShell>
}
