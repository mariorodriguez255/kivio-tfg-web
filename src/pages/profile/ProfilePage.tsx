import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Pencil, LogOut, MapPin, Briefcase, Sun, Moon, AlarmClock, Cigarette,
  PartyPopper, Sparkles, Volume2, ChefHat, PawPrint, Globe, Tag,
  AtSign, Link, Mail, BadgeCheck, User, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'

// ── Mapas de etiquetas ────────────────────────────────────────────────────────
const GENDER: Record<string, string> = { hombre: 'Hombre', mujer: 'Mujer', otro: 'Otro' }
const OCCUPATION: Record<string, string> = {
  estudiante: 'Estudiante', trabajador: 'Trabajador', freelance: 'Freelance',
  autonomo: 'Autónomo', otro: 'Otro',
}
const SCHEDULE: Record<string, string> = { dia: 'Diurno', noche: 'Nocturno' }
const WAKEUP: Record<string, string> = {
  antes_8am: 'Antes de las 8am',
  '8am_10am': 'Entre las 8-10am',
  despues_10am: 'Después de las 10am',
}
const BEDTIME: Record<string, string> = {
  antes_11pm: 'Antes de las 11pm',
  '11pm_1am': 'Entre las 11pm-1am',
  despues_1am: 'Después de la 1am',
}
const SMOKER: Record<string, string> = { si: 'Sí fumo', no: 'No fumo', ocasionalmente: 'Ocasionalmente' }
const PARTY: Record<string, string> = { muy_social: 'Muy social', ocasionalmente: 'Ocasionalmente', tranquilo: 'Tranquilo' }
const CLEAN: Record<string, string> = { muy_ordenado: 'Muy ordenado', normal: 'Normal', relajado: 'Relajado' }
const NOISE: Record<string, string> = { silencio: 'Silencio total', normal: 'Normal', ruido_ok: 'Tolerante al ruido' }
const COOKING: Record<string, string> = {
  diario: 'A diario',
  varias_veces_semana: 'Varias veces/semana',
  rara_vez: 'Rara vez',
  nunca: 'Nunca',
}

// ── Subcomponentes ────────────────────────────────────────────────────────────
function LifeItem({
  icon: Icon, label, value,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        {value
          ? <p className="text-sm font-medium">{value}</p>
          : <p className="text-sm text-muted-foreground italic">No especificado</p>}
      </div>
    </div>
  )
}

function FormSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={v => onChange(v === '_none' ? '' : (v ?? ''))}>
        <SelectTrigger>
          <SelectValue placeholder="Sin especificar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">Sin especificar</SelectItem>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ── Tipo del formulario ───────────────────────────────────────────────────────
type FormState = {
  full_name: string
  age: string
  city: string
  neighborhood: string
  gender: string
  bio: string
  occupation: string
  schedule_preference: string
  wakeup_time: string
  bedtime: string
  smoker: string
  party_lifestyle: string
  clean_lifestyle: string
  noise_tolerance: string
  cooking_frequency: string
  pets_friendly: boolean
  interests: string
  languages: string
  instagram_handle: string
  linkedin_url: string
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    full_name: '', age: '', city: '', neighborhood: '', gender: '', bio: '',
    occupation: '', schedule_preference: '', wakeup_time: '', bedtime: '',
    smoker: '', party_lifestyle: '', clean_lifestyle: '', noise_tolerance: '',
    cooking_frequency: '', pets_friendly: false, interests: '', languages: '',
    instagram_handle: '', linkedin_url: '',
  })

  function openEdit() {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      age: profile.age?.toString() ?? '',
      city: profile.city ?? '',
      neighborhood: profile.neighborhood ?? '',
      gender: profile.gender ?? '',
      bio: profile.bio ?? '',
      occupation: profile.occupation ?? '',
      schedule_preference: profile.schedule_preference ?? '',
      wakeup_time: profile.wakeup_time ?? '',
      bedtime: profile.bedtime ?? '',
      smoker: profile.smoker ?? '',
      party_lifestyle: profile.party_lifestyle ?? '',
      clean_lifestyle: profile.clean_lifestyle ?? '',
      noise_tolerance: profile.noise_tolerance ?? '',
      cooking_frequency: profile.cooking_frequency ?? '',
      pets_friendly: profile.pets_friendly ?? false,
      interests: (profile.interests ?? []).join(', '),
      languages: (profile.languages ?? []).join(', '),
      instagram_handle: profile.instagram_handle ?? '',
      linkedin_url: profile.linkedin_url ?? '',
    })
    setSheetOpen(true)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name || null,
        age: form.age ? parseInt(form.age, 10) : null,
        city: form.city || null,
        neighborhood: form.neighborhood || null,
        gender: form.gender || null,
        bio: form.bio || null,
        occupation: form.occupation || null,
        schedule_preference: form.schedule_preference || null,
        wakeup_time: form.wakeup_time || null,
        bedtime: form.bedtime || null,
        smoker: form.smoker || null,
        party_lifestyle: form.party_lifestyle || null,
        clean_lifestyle: form.clean_lifestyle || null,
        noise_tolerance: form.noise_tolerance || null,
        cooking_frequency: form.cooking_frequency || null,
        pets_friendly: form.pets_friendly,
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
        instagram_handle: form.instagram_handle || null,
        linkedin_url: form.linkedin_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (!error) {
      await refreshProfile()
      setSheetOpen(false)
      toast.success('Perfil actualizado correctamente')
    } else {
      toast.error('Error al guardar. Inténtalo de nuevo.')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (!profile) return (
    <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  // Porcentaje de perfil completado
  const completenessFields = [
    !!profile.full_name, !!profile.age, !!profile.city, !!profile.bio,
    !!profile.gender, !!profile.occupation, !!profile.schedule_preference,
    !!profile.wakeup_time, !!profile.bedtime, !!profile.smoker,
    !!profile.party_lifestyle, !!profile.clean_lifestyle,
    (profile.interests?.length ?? 0) > 0,
    (profile.languages?.length ?? 0) > 0,
  ]
  const completeness = Math.round(
    (completenessFields.filter(Boolean).length / completenessFields.length) * 100
  )

  const hasLifestyle = !!(
    profile.schedule_preference || profile.wakeup_time || profile.bedtime ||
    profile.smoker || profile.party_lifestyle || profile.clean_lifestyle ||
    profile.noise_tolerance || profile.cooking_frequency
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold truncate">
                      {profile.full_name ?? 'Sin nombre'}
                    </h1>
                    {profile.verified_social && (
                      <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                  {(profile.city || profile.neighborhood) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {[profile.neighborhood, profile.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {profile.age && (
                    <p className="text-sm text-muted-foreground mt-0.5">{profile.age} años</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={openEdit} className="shrink-0">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              </div>

              {profile.bio && (
                <p className="text-sm mt-2 text-muted-foreground leading-relaxed line-clamp-3">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Barra de progreso del perfil */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">Perfil completado</p>
              <p className="text-xs font-semibold text-primary">{completeness}%</p>
            </div>
            <Progress value={completeness} className="h-1.5" />
            {completeness < 100 && (
              <p className="text-xs text-muted-foreground mt-1">
                Completa tu perfil para mejorar tus posibilidades de encontrar piso
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Información personal ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.gender && (
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{GENDER[profile.gender] ?? profile.gender}</span>
            </div>
          )}
          {profile.occupation && (
            <div className="flex items-center gap-2.5">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{OCCUPATION[profile.occupation] ?? profile.occupation}</span>
            </div>
          )}
          {profile.city && (
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {[profile.neighborhood, profile.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{profile.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Estilo de vida ──────────────────────────────────────────────────── */}
      {hasLifestyle && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Estilo de vida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LifeItem icon={Sun} label="Horario"
                value={profile.schedule_preference ? SCHEDULE[profile.schedule_preference] : null} />
              <LifeItem icon={AlarmClock} label="Se despierta"
                value={profile.wakeup_time ? WAKEUP[profile.wakeup_time] : null} />
              <LifeItem icon={Moon} label="Se acuesta"
                value={profile.bedtime ? BEDTIME[profile.bedtime] : null} />
              <LifeItem icon={Cigarette} label="Fumador"
                value={profile.smoker ? SMOKER[profile.smoker] : null} />
              <LifeItem icon={PartyPopper} label="Vida social"
                value={profile.party_lifestyle ? PARTY[profile.party_lifestyle] : null} />
              <LifeItem icon={Sparkles} label="Limpieza"
                value={profile.clean_lifestyle ? CLEAN[profile.clean_lifestyle] : null} />
              <LifeItem icon={Volume2} label="Ruido"
                value={profile.noise_tolerance ? NOISE[profile.noise_tolerance] : null} />
              <LifeItem icon={ChefHat} label="Cocina"
                value={profile.cooking_frequency ? COOKING[profile.cooking_frequency] : null} />
              <LifeItem icon={PawPrint} label="Mascotas"
                value={profile.pets_friendly ? 'Tengo o me gustan' : 'Sin mascotas'} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Intereses e idiomas ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Intereses e idiomas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Intereses
            </p>
            {(profile.interests?.length ?? 0) > 0
              ? <div className="flex flex-wrap gap-1.5">
                  {profile.interests!.map(i => <Badge key={i} variant="secondary">{i}</Badge>)}
                </div>
              : <button onClick={openEdit} className="text-xs text-primary hover:underline">
                  + Añade tus intereses
                </button>
            }
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Idiomas
            </p>
            {(profile.languages?.length ?? 0) > 0
              ? <div className="flex flex-wrap gap-1.5">
                  {profile.languages!.map(l => <Badge key={l} variant="outline">{l}</Badge>)}
                </div>
              : <button onClick={openEdit} className="text-xs text-primary hover:underline">
                  + Añade tus idiomas
                </button>
            }
          </div>
        </CardContent>
      </Card>

      {/* ── Redes sociales ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Redes sociales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.instagram_handle
            ? <div className="flex items-center gap-2.5">
                <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">@{profile.instagram_handle}</span>
              </div>
            : <div className="flex items-center gap-2.5">
                <AtSign className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <button onClick={openEdit} className="text-xs text-primary hover:underline">
                  + Conecta tu Instagram
                </button>
              </div>
          }
          {profile.linkedin_url
            ? <div className="flex items-center gap-2.5">
                <Link className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{profile.linkedin_url}</span>
              </div>
            : <div className="flex items-center gap-2.5">
                <Link className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <button onClick={openEdit} className="text-xs text-primary hover:underline">
                  + Conecta tu LinkedIn
                </button>
              </div>
          }
        </CardContent>
      </Card>

      {/* ── Cuenta ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{profile.email}</span>
          </div>
          <Separator />
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-0"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>

      {/* ── Sheet de edición ────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Editar perfil</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Tabs defaultValue="basico">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                <TabsTrigger value="intereses">Intereses</TabsTrigger>
                <TabsTrigger value="redes">Redes</TabsTrigger>
              </TabsList>

              {/* ── Tab: Básico ──────────────────────────────────────────── */}
              <TabsContent value="basico" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label>Nombre completo</Label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Edad</Label>
                    <Input
                      type="number" min="16" max="99"
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                      placeholder="22"
                    />
                  </div>
                  <FormSelect
                    label="Género"
                    value={form.gender}
                    onChange={v => setForm({ ...form, gender: v })}
                    options={[
                      { value: 'hombre', label: 'Hombre' },
                      { value: 'mujer', label: 'Mujer' },
                      { value: 'otro', label: 'Otro' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Ciudad</Label>
                    <Input
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="Madrid"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Barrio</Label>
                    <Input
                      value={form.neighborhood}
                      onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                      placeholder="Malasaña"
                    />
                  </div>
                </div>

                <FormSelect
                  label="Ocupación"
                  value={form.occupation}
                  onChange={v => setForm({ ...form, occupation: v })}
                  options={[
                    { value: 'estudiante', label: 'Estudiante' },
                    { value: 'trabajador', label: 'Trabajador' },
                    { value: 'freelance', label: 'Freelance' },
                    { value: 'autonomo', label: 'Autónomo' },
                    { value: 'otro', label: 'Otro' },
                  ]}
                />

                <div className="space-y-1.5">
                  <Label>Sobre mí</Label>
                  <Textarea
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="Cuéntanos algo sobre ti..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.bio.length}/500
                  </p>
                </div>
              </TabsContent>

              {/* ── Tab: Lifestyle ───────────────────────────────────────── */}
              <TabsContent value="lifestyle" className="space-y-4 mt-0">
                <FormSelect
                  label="Horario"
                  value={form.schedule_preference}
                  onChange={v => setForm({ ...form, schedule_preference: v })}
                  options={[
                    { value: 'dia', label: 'Diurno' },
                    { value: 'noche', label: 'Nocturno' },
                  ]}
                />
                <FormSelect
                  label="Hora de despertarse"
                  value={form.wakeup_time}
                  onChange={v => setForm({ ...form, wakeup_time: v })}
                  options={[
                    { value: 'antes_8am', label: 'Antes de las 8am' },
                    { value: '8am_10am', label: 'Entre 8am y 10am' },
                    { value: 'despues_10am', label: 'Después de las 10am' },
                  ]}
                />
                <FormSelect
                  label="Hora de acostarse"
                  value={form.bedtime}
                  onChange={v => setForm({ ...form, bedtime: v })}
                  options={[
                    { value: 'antes_11pm', label: 'Antes de las 11pm' },
                    { value: '11pm_1am', label: 'Entre 11pm y 1am' },
                    { value: 'despues_1am', label: 'Después de la 1am' },
                  ]}
                />
                <FormSelect
                  label="Fumador"
                  value={form.smoker}
                  onChange={v => setForm({ ...form, smoker: v })}
                  options={[
                    { value: 'no', label: 'No fumo' },
                    { value: 'ocasionalmente', label: 'Ocasionalmente' },
                    { value: 'si', label: 'Sí fumo' },
                  ]}
                />
                <FormSelect
                  label="Vida social"
                  value={form.party_lifestyle}
                  onChange={v => setForm({ ...form, party_lifestyle: v })}
                  options={[
                    { value: 'muy_social', label: 'Muy social' },
                    { value: 'ocasionalmente', label: 'Ocasionalmente' },
                    { value: 'tranquilo', label: 'Tranquilo' },
                  ]}
                />
                <FormSelect
                  label="Limpieza"
                  value={form.clean_lifestyle}
                  onChange={v => setForm({ ...form, clean_lifestyle: v })}
                  options={[
                    { value: 'muy_ordenado', label: 'Muy ordenado' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'relajado', label: 'Relajado' },
                  ]}
                />
                <FormSelect
                  label="Tolerancia al ruido"
                  value={form.noise_tolerance}
                  onChange={v => setForm({ ...form, noise_tolerance: v })}
                  options={[
                    { value: 'silencio', label: 'Necesito silencio' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'ruido_ok', label: 'Tolerante al ruido' },
                  ]}
                />
                <FormSelect
                  label="Cocina"
                  value={form.cooking_frequency}
                  onChange={v => setForm({ ...form, cooking_frequency: v })}
                  options={[
                    { value: 'diario', label: 'Cocino a diario' },
                    { value: 'varias_veces_semana', label: 'Varias veces/semana' },
                    { value: 'rara_vez', label: 'Rara vez' },
                    { value: 'nunca', label: 'Nunca' },
                  ]}
                />
                <div className="flex items-center gap-3 py-1">
                  <Checkbox
                    id="pets"
                    checked={form.pets_friendly}
                    onCheckedChange={v => setForm({ ...form, pets_friendly: v === true })}
                  />
                  <Label htmlFor="pets" className="cursor-pointer font-normal">
                    Tengo o me gustan las mascotas
                  </Label>
                </div>
              </TabsContent>

              {/* ── Tab: Intereses ───────────────────────────────────────── */}
              <TabsContent value="intereses" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label>Intereses</Label>
                  <Textarea
                    value={form.interests}
                    onChange={e => setForm({ ...form, interests: e.target.value })}
                    placeholder="Música, viajes, deporte, cine..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Separados por comas</p>
                </div>
                {form.interests.trim() && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.interests.split(',').map(s => s.trim()).filter(Boolean).map(i => (
                        <Badge key={i} variant="secondary">{i}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-1.5">
                  <Label>Idiomas</Label>
                  <Input
                    value={form.languages}
                    onChange={e => setForm({ ...form, languages: e.target.value })}
                    placeholder="Español, Inglés, Francés..."
                  />
                  <p className="text-xs text-muted-foreground">Separados por comas</p>
                </div>
                {form.languages.trim() && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.languages.split(',').map(s => s.trim()).filter(Boolean).map(l => (
                        <Badge key={l} variant="outline">{l}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Tab: Redes ───────────────────────────────────────────── */}
              <TabsContent value="redes" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <AtSign className="h-4 w-4" /> Instagram
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground border border-r-0 rounded-l-md bg-muted">
                      @
                    </span>
                    <Input
                      value={form.instagram_handle}
                      onChange={e => setForm({ ...form, instagram_handle: e.target.value })}
                      placeholder="tu_usuario"
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Link className="h-4 w-4" /> LinkedIn
                  </Label>
                  <Input
                    value={form.linkedin_url}
                    onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                    placeholder="linkedin.com/in/tu-perfil"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSheetOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
