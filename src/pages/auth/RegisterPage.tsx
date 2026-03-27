import { useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import logo from '@/assets/kiviologo.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, ChevronRight, ChevronLeft, Check, Mail } from 'lucide-react'

// ── tipos ─────────────────────────────────────────────────────────────────────
interface FormData {
  email: string; password: string; confirmPassword: string
  full_name: string; age: string; city: string; gender: string; occupation: string
  schedule_preference: string; wakeup_time: string; bedtime: string
  smoker: string; party_lifestyle: string; clean_lifestyle: string
  noise_tolerance: string; cooking_frequency: string; pets_friendly: boolean
  bio: string; interests: string[]; languages: string[]
  instagram_handle: string; linkedin_url: string
}

const INITIAL: FormData = {
  email: '', password: '', confirmPassword: '',
  full_name: '', age: '', city: '', gender: '', occupation: '',
  schedule_preference: '', wakeup_time: '', bedtime: '',
  smoker: '', party_lifestyle: '', clean_lifestyle: '',
  noise_tolerance: '', cooking_frequency: '', pets_friendly: false,
  bio: '', interests: [], languages: [],
  instagram_handle: '', linkedin_url: '',
}

const INTERESES = ['Música','Deporte','Cocina','Viajes','Cine','Lectura','Gaming','Arte','Fotografía','Yoga','Senderismo','Baile','Teatro','Tecnología','Meditación','Animales']
const IDIOMAS   = ['Español','Inglés','Francés','Alemán','Italiano','Portugués','Chino','Árabe','Japonés','Ruso']
const STEPS     = ['Cuenta','Básicos','Estilo de vida','Sobre mí','Redes sociales']

// ── componentes auxiliares ────────────────────────────────────────────────────
function Opt({ value: _value, selected, onClick, children }: {
  value: string; selected: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
        selected ? 'border-primary bg-primary text-primary-foreground'
                 : 'border-border hover:border-primary/50 hover:bg-accent'
      }`}>
      {children}
    </button>
  )
}

function TagInput({ tags, suggestions, onAdd, onRemove, placeholder }: {
  tags: string[]; suggestions: string[]; onAdd: (t: string) => void
  onRemove: (t: string) => void; placeholder?: string
}) {
  const [input, setInput] = useState('')
  function add(tag: string) {
    const t = tag.trim()
    if (t && !tags.includes(t)) onAdd(t)
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <Badge key={t} variant="secondary" className="gap-1 pr-1">
            {t}
            <button type="button" onClick={() => onRemove(t)}><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input) }}} />
        <Button type="button" variant="outline" onClick={() => add(input)}>Añadir</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.filter(s => !tags.includes(s)).map(s => (
          <button key={s} type="button" onClick={() => onAdd(s)}
            className="text-xs px-2 py-1 rounded-md border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            + {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── pasos ─────────────────────────────────────────────────────────────────────
function Step1({ d, s }: { d: FormData; s: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" placeholder="tu@email.com" value={d.email} onChange={e => s('email', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pw">Contraseña *</Label>
        <Input id="pw" type="password" placeholder="Mínimo 6 caracteres" value={d.password} onChange={e => s('password', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pw2">Confirmar contraseña *</Label>
        <Input id="pw2" type="password" placeholder="Repite la contraseña" value={d.confirmPassword} onChange={e => s('confirmPassword', e.target.value)} required />
      </div>
    </div>
  )
}

function Step2({ d, s }: { d: FormData; s: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre completo *</Label>
        <Input placeholder="Tu nombre y apellidos" value={d.full_name} onChange={e => s('full_name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Edad *</Label>
          <Input type="number" min={18} max={100} placeholder="Ej: 22" value={d.age} onChange={e => s('age', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Ciudad *</Label>
          <Input placeholder="Ej: Madrid" value={d.city} onChange={e => s('city', e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Género *</Label>
        <div className="flex gap-2 flex-wrap">
          {[['hombre','Hombre'],['mujer','Mujer'],['otro','Otro']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.gender===v} onClick={() => s('gender', v)}>{l}</Opt>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Ocupación *</Label>
        <div className="flex gap-2 flex-wrap">
          {[['estudiante','Estudiante'],['trabajador','Trabajador'],['freelance','Freelance'],['autonomo','Autónomo'],['otro','Otro']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.occupation===v} onClick={() => s('occupation', v)}>{l}</Opt>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3({ d, s }: { d: FormData; s: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Horario preferido</Label>
        <div className="flex gap-2">
          {[['dia','☀️ Diurno'],['noche','🌙 Nocturno']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.schedule_preference===v} onClick={() => s('schedule_preference',v)}>{l}</Opt>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Me levanto</Label>
          <Select value={d.wakeup_time} onValueChange={v => s('wakeup_time', v)}>
            <SelectTrigger><SelectValue placeholder="Hora de levantarse" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="antes_8am">Antes de las 8h</SelectItem>
              <SelectItem value="8am_10am">Entre 8h y 10h</SelectItem>
              <SelectItem value="despues_10am">Después de las 10h</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Me acuesto</Label>
          <Select value={d.bedtime} onValueChange={v => s('bedtime', v)}>
            <SelectTrigger><SelectValue placeholder="Hora de acostarse" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="antes_11pm">Antes de las 23h</SelectItem>
              <SelectItem value="11pm_1am">Entre 23h y 1h</SelectItem>
              <SelectItem value="despues_1am">Después de la 1h</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Fumar</Label>
        <div className="flex gap-2 flex-wrap">
          {[['no','No fumo'],['ocasionalmente','Ocasionalmente'],['si','Sí fumo']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.smoker===v} onClick={() => s('smoker',v)}>{l}</Opt>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Vida social</Label>
        <div className="flex gap-2 flex-wrap">
          {[['tranquilo','🏠 Tranquilo'],['ocasionalmente','🎉 Ocasionalmente'],['muy_social','🎊 Muy social']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.party_lifestyle===v} onClick={() => s('party_lifestyle',v)}>{l}</Opt>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Orden en casa</Label>
        <div className="flex gap-2 flex-wrap">
          {[['muy_ordenado','✨ Muy ordenado'],['normal','👍 Normal'],['relajado','😌 Relajado']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.clean_lifestyle===v} onClick={() => s('clean_lifestyle',v)}>{l}</Opt>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tolerancia al ruido</Label>
        <div className="flex gap-2 flex-wrap">
          {[['silencio','🤫 Silencio'],['normal','🔉 Normal'],['ruido_ok','🔊 Sin problema']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.noise_tolerance===v} onClick={() => s('noise_tolerance',v)}>{l}</Opt>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>¿Con qué frecuencia cocinas?</Label>
        <div className="flex gap-2 flex-wrap">
          {[['diario','Diario'],['varias_veces_semana','Varias veces/semana'],['rara_vez','Rara vez'],['nunca','Nunca']].map(([v,l]) => (
            <Opt key={v} value={v} selected={d.cooking_frequency===v} onClick={() => s('cooking_frequency',v)}>{l}</Opt>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="pets" checked={d.pets_friendly} onCheckedChange={v => s('pets_friendly', Boolean(v))} />
        <Label htmlFor="pets" className="cursor-pointer">🐾 Me gustan / tengo mascotas</Label>
      </div>
    </div>
  )
}

function Step4({ d, s }: { d: FormData; s: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Sobre mí</Label>
        <Textarea placeholder="Cuéntanos algo sobre ti, tus hábitos, lo que buscas en un compañero..." className="min-h-[100px]"
          value={d.bio} onChange={e => s('bio', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Intereses y hobbies</Label>
        <TagInput tags={d.interests} suggestions={INTERESES}
          onAdd={t => s('interests', [...d.interests, t])}
          onRemove={t => s('interests', d.interests.filter(x => x !== t))}
          placeholder="Añade un interés..." />
      </div>
      <div className="space-y-2">
        <Label>Idiomas que hablas</Label>
        <TagInput tags={d.languages} suggestions={IDIOMAS}
          onAdd={t => s('languages', [...d.languages, t])}
          onRemove={t => s('languages', d.languages.filter(x => x !== t))}
          placeholder="Añade un idioma..." />
      </div>
    </div>
  )
}

function Step5({ d, s }: { d: FormData; s: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Conectar tus redes sociales aumenta la confianza entre usuarios. Es completamente opcional.
      </p>
      <div className="space-y-2">
        <Label>Instagram</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
          <Input className="pl-7" placeholder="tu_usuario" value={d.instagram_handle} onChange={e => s('instagram_handle', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>LinkedIn URL</Label>
        <Input type="url" placeholder="https://linkedin.com/in/..." value={d.linkedin_url} onChange={e => s('linkedin_url', e.target.value)} />
      </div>
    </div>
  )
}

// ── pantalla de confirmación de email ─────────────────────────────────────────
function EmailConfirmationScreen({ email }: { email: string }) {
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function resend() {
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/20 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3">
            <img src={logo} alt="Kivio" className="h-10 w-10 rounded-xl object-contain" />
            <h1 className="text-4xl font-bold text-primary">kivio</h1>
          </div>
        </div>
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Confirma tu email</h2>
              <p className="text-muted-foreground text-sm">
                Hemos enviado un enlace de confirmación a<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta. Una vez confirmada, podrás iniciar sesión.
            </p>
            {resent && (
              <p className="text-sm text-primary font-medium">✓ Email reenviado correctamente</p>
            )}
            <Button variant="outline" className="w-full" onClick={resend} disabled={loading || resent}>
              {loading ? 'Enviando...' : resent ? 'Email reenviado' : 'Reenviar email de confirmación'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya confirmaste?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── página principal ──────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null)

  function set(key: keyof FormData, value: unknown) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function validate(): string | null {
    if (step === 0) {
      if (!data.email || !data.password || !data.confirmPassword) return 'Completa todos los campos'
      if (data.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
      if (data.password !== data.confirmPassword) return 'Las contraseñas no coinciden'
    }
    if (step === 1) {
      if (!data.full_name || !data.age || !data.city || !data.gender || !data.occupation)
        return 'Completa los campos obligatorios (*)'
      if (Number(data.age) < 18 || Number(data.age) > 100)
        return 'La edad debe estar entre 18 y 100 años'
    }
    return null
  }

  function next() {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setStep(s => s + 1)
  }

  function back() {
    setError(null)
    setStep(s => s - 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message ?? 'Error al crear la cuenta')
      setLoading(false)
      return
    }

    // 2. Guardar perfil completo en pending_profiles via RPC SECURITY DEFINER
    //    (no requiere sesión activa, funciona antes de confirmar email)
    const { data: rpcData, error: pendingError } = await supabase.rpc('safe_insert_pending_profile', {
      p_id: authData.user.id,
      p_email: data.email,
      p_full_name: data.full_name,
      p_age: Number(data.age),
      p_city: data.city,
      p_gender: data.gender || null,
      p_occupation: data.occupation || null,
      p_schedule_preference: data.schedule_preference || null,
      p_study_time: null,
      p_smoker: data.smoker || null,
      p_party_lifestyle: data.party_lifestyle || null,
      p_clean_lifestyle: data.clean_lifestyle || null,
      p_pets_friendly: data.pets_friendly,
      p_bio: data.bio || null,
      p_wakeup_time: data.wakeup_time || null,
      p_bedtime: data.bedtime || null,
      p_noise_tolerance: data.noise_tolerance || null,
      p_cooking_frequency: data.cooking_frequency || null,
      p_interests: data.interests,
      p_languages: data.languages,
      p_instagram_handle: data.instagram_handle || null,
      p_linkedin_url: data.linkedin_url || null,
      p_verified_social: false,
      p_neighborhood: null,
      p_avatar_url: null,
    })

    if (pendingError) {
      setError('Error al guardar el perfil. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    const rpcResult = Array.isArray(rpcData) ? rpcData[0] : rpcData
    if (!rpcResult?.success) {
      // Email ya existe en profiles → cuenta confirmada, debe iniciar sesión
      if (rpcResult?.message?.includes('profiles table')) {
        setError('Este email ya está registrado. ¿Quieres iniciar sesión?')
        setLoading(false)
        return
      }
      // Email ya existe en pending_profiles → registro previo sin confirmar, mostramos confirmación
    }

    // 3. Mostrar pantalla de confirmación de email
    setConfirmedEmail(data.email)
    setLoading(false)
  }

  // Mostrar pantalla de "revisa tu email"
  if (confirmedEmail) return <EmailConfirmationScreen email={confirmedEmail} />

  const progress = ((step + 1) / STEPS.length) * 100
  const stepComponents = [
    <Step1 d={data} s={set} />,
    <Step2 d={data} s={set} />,
    <Step3 d={data} s={set} />,
    <Step4 d={data} s={set} />,
    <Step5 d={data} s={set} />,
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/20 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-1">
            <img src={logo} alt="Kivio" className="h-10 w-10 rounded-xl object-contain" />
            <h1 className="text-4xl font-bold text-primary">kivio</h1>
          </div>
          <p className="text-muted-foreground text-sm">Encuentra tu compañero ideal</p>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xl">{STEPS[step]}</CardTitle>
              <span className="text-sm text-muted-foreground">{step + 1} / {STEPS.length}</span>
            </div>
            <CardDescription>
              {['Crea tu cuenta de Kivio','Cuéntanos quién eres','Tu estilo de vida como compañero','Preséntate a la comunidad','Opcional: conecta tus redes'][step]}
            </CardDescription>
            <Progress value={progress} className="h-1.5 mt-3" />
            <div className="flex gap-1 mt-2">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-primary' : i === step ? 'bg-primary/60' : 'bg-border'
                }`} />
              ))}
            </div>
          </CardHeader>

          <form onSubmit={step === STEPS.length - 1 ? handleSubmit : e => { e.preventDefault(); next() }}>
            <CardContent className="max-h-[58vh] overflow-y-auto pb-2">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
                  {error}
                </div>
              )}
              {stepComponents[step]}
            </CardContent>

            <div className="flex items-center justify-between px-6 py-4 border-t">
              {step === 0 ? (
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Ya tengo cuenta
                </Link>
              ) : (
                <Button type="button" variant="ghost" onClick={back} disabled={loading}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Atrás
                </Button>
              )}

              {step < STEPS.length - 1 ? (
                <Button type="submit">
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando cuenta...' : <><Check className="h-4 w-4 mr-1" />Crear cuenta</>}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
