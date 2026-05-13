import { useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import logo from '@/assets/kiviologo.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function translateLoginError(msg: string): string {
  if (msg.includes('not confirmed')) {
    return 'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email o contraseña incorrectos'
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Error de conexión. Comprueba tu internet e inténtalo de nuevo.'
  }
  return 'Email o contraseña incorrectos'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(translateLoginError(error.message))
      setLoading(false)
      return
    }
    // La redirección la gestiona PublicRoute al detectar la sesión en AuthContext
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = forgotEmail.trim()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Introduce un email válido')
      return
    }
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    setForgotLoading(false)
    if (error) {
      toast.error('No se pudo enviar el email. Comprueba la dirección e inténtalo de nuevo.')
    } else {
      setForgotSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-1">
            <img src={logo} alt="Kivio" className="h-10 w-10 rounded-md object-contain" />
            <h1 className="text-4xl font-bold text-primary">kivio</h1>
          </div>
          <p className="text-muted-foreground text-sm">Tu nuevo compañero de piso te espera</p>
        </div>

        {showForgot ? (
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
              <CardDescription>
                Te enviaremos un enlace para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            {forgotSent ? (
              <CardContent className="space-y-4 pb-6">
                <div className="text-sm text-primary bg-primary/10 px-3 py-3 rounded-md text-center">
                  Email enviado a <strong>{forgotEmail}</strong>. Revisa tu bandeja de entrada.
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setShowForgot(false); setForgotSent(false) }}>
                  Volver al inicio de sesión
                </Button>
              </CardContent>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <CardContent className="space-y-4 pb-6">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email de tu cuenta</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Volver
                  </button>
                </CardFooter>
              </form>
            )}
          </Card>
        ) : (
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
              <CardDescription>Accede a tu cuenta de Kivio</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pb-6">
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Regístrate gratis
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}
