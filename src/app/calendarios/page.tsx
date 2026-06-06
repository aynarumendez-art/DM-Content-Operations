export const dynamic = "force-dynamic"

import { AppShell } from '@/components/layout/AppShell'
import { CalendariosPage } from '@/components/calendarios/CalendariosPage'

export default function Page() {
  return <AppShell><CalendariosPage /></AppShell>
}
