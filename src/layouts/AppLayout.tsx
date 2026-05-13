import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/buscar': 'Buscar',
  '/publicar': 'Publicar',
  '/chat': 'Mensajes',
  '/perfil': 'Mi perfil',
}

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  if (pathname.startsWith('/buscar/habitacion/')) return 'Habitación'
  if (pathname.startsWith('/buscar/companero/')) return 'Compañero'
  if (pathname.startsWith('/chat/')) return 'Mensajes'
  return ''
}

export function AppLayout() {
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-w-0">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <SidebarTrigger />
            {title && (
              <>
                <Separator orientation="vertical" className="h-4 opacity-50" />
                <span className="font-semibold text-sm text-foreground/80">{title}</span>
              </>
            )}
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
