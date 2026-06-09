export const dynamic = "force-dynamic"

import { AppShell } from '@/components/layout/AppShell'
import { SeaCycleDetail } from '@/components/sea/SeaCycleDetail'

export default function Page({ params }: { params: { cycleId: string } }) {
  return (
    <AppShell>
      <SeaCycleDetail cycleId={params.cycleId} />
    </AppShell>
  )
}
