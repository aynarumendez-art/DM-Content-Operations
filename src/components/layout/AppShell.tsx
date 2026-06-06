import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen">
        <div className="p-6 max-w-screen-xl">{children}</div>
      </main>
    </div>
  )
}
