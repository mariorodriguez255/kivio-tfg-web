import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import App from './App'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-lg font-semibold">Algo salió mal</p>
          <p className="text-sm text-muted-foreground">Recarga la página para continuar.</p>
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <App />
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
