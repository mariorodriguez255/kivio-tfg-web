import { useState, useEffect, useCallback, useRef } from 'react'
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pencil, LogOut, MapPin, Briefcase, Sun, Moon, AlarmClock, Cigarette,
  PartyPopper, Sparkles, Volume2, ChefHat, PawPrint, Globe, Tag,
  Mail, BadgeCheck, User, Loader2,
  BedDouble, Users, Euro, Pause, Play, Trash2, Eye, Plus, Camera,
} from 'lucide-react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { GENDER, OCCUPATION, SCHEDULE, WAKEUP, BEDTIME, SMOKER, PARTY, CLEAN, NOISE, COOKING } from '@/lib/translations'

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

// ── Tipos para mis anuncios ───────────────────────────────────────────────────
interface MyListing {
  id: string
  title: string
  city: string
  neighborhood: string | null
  monthly_rent: number
  available_spots: number
  status: string
  views_count: number
  created_at: string
}

interface MyRoommateListing {
  id: string
  title: string
  city: string
  neighborhood: string | null
  max_budget: number
  status: string
  views_count: number
  created_at: string
}

// ── Componente Mis anuncios ───────────────────────────────────────────────────
function MisAnuncios({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [listings, setListings] = useState<MyListing[]>([])
  const [roommates, setRoommates] = useState<MyRoommateListing[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: l }, { data: r }] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, city, neighborhood, monthly_rent, available_spots, status, views_count, created_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('roommate_listings')
        .select('id, title, city, neighborhood, max_budget, status, views_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])
    if (l) setListings(l as MyListing[])
    if (r) setRoommates(r as MyRoommateListing[])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function toggleListingStatus(id: string, current: string) {
    const next = current === 'active' ? 'paused' : 'active'
    setBusy(id)
    const { error } = await supabase.from('listings').update({ status: next }).eq('id', id)
    if (!error) {
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: next } : l))
      toast.success(next === 'active' ? 'Anuncio activado' : 'Anuncio pausado')
    } else {
      toast.error('Error al actualizar el anuncio')
    }
    setBusy(null)
  }

  async function deleteListing(id: string) {
    setBusy(id)
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== id))
      toast.success('Anuncio eliminado')
    } else {
      toast.error('Error al eliminar el anuncio')
    }
    setBusy(null)
  }

  async function toggleRoommateStatus(id: string, current: string) {
    const next = current === 'active' ? 'paused' : 'active'
    setBusy(id)
    const { error } = await supabase.from('roommate_listings').update({ status: next }).eq('id', id)
    if (!error) {
      setRoommates(prev => prev.map(r => r.id === id ? { ...r, status: next } : r))
      toast.success(next === 'active' ? 'Anuncio activado' : 'Anuncio pausado')
    } else {
      toast.error('Error al actualizar el anuncio')
    }
    setBusy(null)
  }

  async function deleteRoommate(id: string) {
    setBusy(id)
    const { error } = await supabase.from('roommate_listings').delete().eq('id', id)
    if (!error) {
      setRoommates(prev => prev.filter(r => r.id !== id))
      toast.success('Anuncio eliminado')
    } else {
      toast.error('Error al eliminar el anuncio')
    }
    setBusy(null)
  }

  const total = listings.length + roommates.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Mis anuncios {!loading && total > 0 && `(${total})`}
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate('/publicar')}>
            <Plus className="h-3.5 w-3.5" />Publicar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : total === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">No tienes anuncios publicados</p>
            <Button size="sm" onClick={() => navigate('/publicar')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Publicar primer anuncio
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="habitaciones">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="habitaciones" className="flex-1 gap-1.5 text-xs">
                <BedDouble className="h-3.5 w-3.5" />
                Habitaciones {listings.length > 0 && `(${listings.length})`}
              </TabsTrigger>
              <TabsTrigger value="companeros" className="flex-1 gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                Compañero {roommates.length > 0 && `(${roommates.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="habitaciones" className="mt-0 space-y-2">
              {listings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin anuncios de habitación
                </p>
              ) : (
                listings.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BedDouble className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        className="text-sm font-medium truncate hover:underline text-left w-full"
                        onClick={() => navigate(`/buscar/habitacion/${l.id}`)}
                      >
                        {l.title}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />{[l.neighborhood, l.city].filter(Boolean).join(', ')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Euro className="h-2.5 w-2.5" />{Number(l.monthly_rent).toLocaleString('es-ES')}€/mes
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />{l.views_count}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={l.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs py-0.5 shrink-0"
                    >
                      {l.status === 'active' ? 'Activo' : l.status === 'paused' ? 'Pausado' : l.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      disabled={busy === l.id}
                      onClick={() => toggleListingStatus(l.id, l.status)}
                      title={l.status === 'active' ? 'Pausar' : 'Activar'}
                    >
                      {l.status === 'active'
                        ? <Pause className="h-3.5 w-3.5" />
                        : <Play className="h-3.5 w-3.5" />
                      }
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      disabled={busy === l.id}
                      onClick={() => navigate(`/publicar?tipo=habitacion&editId=${l.id}`)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        disabled={busy === l.id}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El anuncio será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteListing(l.id)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="companeros" className="mt-0 space-y-2">
              {roommates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin anuncios de compañero
                </p>
              ) : (
                roommates.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        className="text-sm font-medium truncate hover:underline text-left w-full"
                        onClick={() => navigate(`/buscar/companero/${r.id}`)}
                      >
                        {r.title}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />{[r.neighborhood, r.city].filter(Boolean).join(', ')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Euro className="h-2.5 w-2.5" />{Number(r.max_budget).toLocaleString('es-ES')}€ máx
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />{r.views_count}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={r.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs py-0.5 shrink-0"
                    >
                      {r.status === 'active' ? 'Activo' : r.status === 'paused' ? 'Pausado' : r.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      disabled={busy === r.id}
                      onClick={() => toggleRoommateStatus(r.id, r.status)}
                      title={r.status === 'active' ? 'Pausar' : 'Activar'}
                    >
                      {r.status === 'active'
                        ? <Pause className="h-3.5 w-3.5" />
                        : <Play className="h-3.5 w-3.5" />
                      }
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      disabled={busy === r.id}
                      onClick={() => navigate(`/publicar?tipo=companero&editId=${r.id}`)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        disabled={busy === r.id}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El anuncio será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteRoommate(r.id)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
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
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5 MB'); return }

    setUploadingAvatar(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) {
      toast.error('Error al subir la imagen')
      setUploadingAvatar(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const urlWithBust = `${publicUrl}?t=${Date.now()}`

    const { error: updateErr } = await supabase
      .from('profiles').update({ avatar_url: urlWithBust }).eq('id', profile.id)

    if (!updateErr) {
      await refreshProfile()
      toast.success('Foto de perfil actualizada')
    } else {
      toast.error('Error al actualizar el perfil')
    }

    setUploadingAvatar(false)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }
  const [form, setForm] = useState<FormState>({
    full_name: '', age: '', city: '', neighborhood: '', gender: '', bio: '',
    occupation: '', schedule_preference: '', wakeup_time: '', bedtime: '',
    smoker: '', party_lifestyle: '', clean_lifestyle: '', noise_tolerance: '',
    cooking_frequency: '', pets_friendly: false, interests: '', languages: '',
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
    })
    setSheetOpen(true)
  }

  async function saveProfile() {
    if (!profile) return
    if (form.full_name && !form.full_name.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }
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
            <div
              className="relative shrink-0 cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
              title="Cambiar foto de perfil"
            >
              <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />
                }
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {completeness === 100 && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

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
            <Progress value={completeness} className="h-2" />
            {completeness < 100 && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {completenessFields.filter(Boolean).length}/{completenessFields.length} campos completados
                </p>
                <button
                  onClick={openEdit}
                  className="text-xs text-primary hover:underline font-medium shrink-0"
                >
                  Completar perfil →
                </button>
              </div>
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

      {/* ── Mis anuncios ────────────────────────────────────────────────────── */}
      <MisAnuncios userId={profile.id} />

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
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                <TabsTrigger value="intereses">Intereses</TabsTrigger>
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
