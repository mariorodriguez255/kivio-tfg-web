import { Outlet } from 'react-router'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-w-0">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
