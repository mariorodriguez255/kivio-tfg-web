import { Routes, Route, Navigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import HomePage from '@/pages/home/HomePage'
import SearchPage from '@/pages/search/SearchPage'
import ListingDetailPage from '@/pages/search/ListingDetailPage'
import RoommateDetailPage from '@/pages/search/RoommateDetailPage'
import PublishPage from '@/pages/publish/PublishPage'
import ChatPage from '@/pages/chat/ChatPage'
import ProfilePage from '@/pages/profile/ProfilePage'

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
  )
}
