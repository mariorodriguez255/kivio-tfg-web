import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const HomePage = lazy(() => import('@/pages/home/HomePage'))
const SearchPage = lazy(() => import('@/pages/search/SearchPage'))
const ListingDetailPage = lazy(() => import('@/pages/search/ListingDetailPage'))
const RoommateDetailPage = lazy(() => import('@/pages/search/RoommateDetailPage'))
const PublishPage = lazy(() => import('@/pages/publish/PublishPage'))
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/buscar/habitacion/:id" element={<ListingDetailPage />} />
          <Route path="/buscar/companero/:id" element={<RoommateDetailPage />} />
          <Route path="/publicar" element={<PublishPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
