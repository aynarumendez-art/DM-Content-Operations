export const dynamic = "force-dynamic"

import { AppShell } from '@/components/layout/AppShell'
import { SeaPage } from '@/components/sea/SeaPage'

export default function Page() {
  return (
    <AppShell>
      <SeaPage />
    </AppShell>
  )
}
