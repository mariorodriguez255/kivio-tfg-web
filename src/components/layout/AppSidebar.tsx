import { useLocation, useNavigate } from 'react-router'
import { Home, Search, PlusSquare, MessageCircle, User, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import logo from '@/assets/kiviologo.png'

const navItems = [
  { title: 'Inicio',    url: '/',         icon: Home,          exact: true  },
  { title: 'Buscar',   url: '/buscar',    icon: Search,        exact: false },
  { title: 'Publicar', url: '/publicar',  icon: PlusSquare,    exact: false },
  { title: 'Chat',     url: '/chat',      icon: MessageCircle, exact: false },
  { title: 'Perfil',   url: '/perfil',    icon: User,          exact: false },
]

export function AppSidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function isActive(url: string, exact: boolean) {
    if (exact) return location.pathname === url
    return location.pathname.startsWith(url)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'KV'

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <img src={logo} alt="Kivio" className="h-8 w-8 rounded-lg object-contain shrink-0" />
              <span className="text-xl font-bold text-primary tracking-tight">kivio</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navegación */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive(item.url, item.exact)}
                    onClick={() => navigate(item.url)}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer — usuario */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate leading-tight">
                  {profile?.full_name ?? 'Usuario'}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {profile?.city ?? ''}
                </p>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cerrar sesión"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
