import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  MapPin, Euro, Cigarette, PawPrint, ArrowLeft,
  MessageCircle, Users, CalendarDays, Clock,
  Music, UtensilsCrossed, Sparkles, Volume2,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { GENDER, OCCUPATION as OCC, CLEAN, NOISE } from '@/lib/translations'

interface RoommateDetail {
  id: string
  status: string
  user_id: string
  title: string
  description: string | null
  city: string
  neighborhood: string | null
  max_budget: number
  expenses_included: boolean
  smoker_ok: boolean
  pets_ok: boolean
  party_lifestyle_ok: boolean
  cooking_shared: boolean
  clean_lifestyle_ok: string | null
  noise_tolerance_ok: string | null
  move_in_date: string | null
  min_stay_months: number | null
  preferred_gender: string | null
  preferred_age_min: number | null
  preferred_age_max: number | null
  additional_info: string | null
  views_count: number
  created_at: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
    age: number | null
    occupation: string | null
    gender: string | null
    bio: string | null
    city: string | null
    interests: string[]
  } | null
}

export default function RoommateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [detail, setDetail] = useState<RoommateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [contacting, setContacting] = useState(false)

  async function handleContact() {
    if (!user || !detail?.user_id || detail.user_id === user.id) return
    setContacting(true)
    const { data } = await supabase.rpc('chat_get_or_create_conversation', {
      p_user1_id: user.id,
      p_user2_id: detail.user_id,
    })
    if (data?.[0]?.conversation_id) {
      navigate(`/chat/${data[0].conversation_id}`)
    } else {
      toast.error('No se pudo abrir el chat. Inténtalo de nuevo.')
    }
    setContacting(false)
  }

  useEffect(() => {
    if (!id) return
    supabase
      .from('roommate_listings')
      .select('*, profiles(full_name, avatar_url, age, occupation, gender, bio, city, interests)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true) }
        else if (data.status !== 'active') { setNotFound(true) }
        else { setDetail(data as RoommateDetail) }
        setLoading(false)
      })

    supabase.rpc('increment_roommate_views', { listing_id: id }).then(() => {})
  }, [id])

  if (notFound && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-slide-up">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-accent/30 flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="font-semibold">Anuncio no encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">Puede que haya sido eliminado o pausado</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/buscar?tab=compañeros')}>Volver a buscar</Button>
      </div>
    )
  }

  const p = detail?.profiles

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/buscar?tab=compañeros')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold text-base leading-tight line-clamp-1">
          {loading ? <Skeleton className="h-5 w-40 inline-block" /> : (detail?.title ?? 'Busca compañero de piso')}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : detail && (
        <>
          {/* Perfil del usuario */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 shrink-0 ring-2 ring-primary/10 ring-offset-2">
              <AvatarImage src={p?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {getInitials(p?.full_name ?? null)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-xl font-bold">{p?.full_name ?? 'Usuario'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[
                  p?.age ? `${p.age} años` : null,
                  p?.gender ? GENDER[p.gender] ?? p.gender : null,
                  p?.occupation ? OCC[p.occupation] ?? p.occupation : null,
                ].filter(Boolean).join(' · ')}
              </p>
              {p?.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />{p.city}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {p?.bio && (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic text-sm text-muted-foreground leading-relaxed">
              "{p.bio}"
            </blockquote>
          )}

          {/* Intereses */}
          {p?.interests && p.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.interests.map(i => (
                <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Presupuesto y zona */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Presupuesto máx.</p>
              <p className="text-2xl font-bold flex items-center gap-0.5">
                <Euro className="h-5 w-5 text-primary" />
                {Number(detail.max_budget).toLocaleString('es-ES')}
              </p>
              <p className="text-xs text-muted-foreground">por mes</p>
              {detail.expenses_included && (
                <p className="text-xs text-green-600 font-medium mt-1">Con gastos incluidos</p>
              )}
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Zona buscada</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {[detail.neighborhood, detail.city.trim()].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          {/* Lo que busca */}
          <div>
            <h2 className="text-sm font-semibold mb-2">Lo que busca</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{detail.title}</p>
            {detail.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-2 whitespace-pre-line">{detail.description}</p>
            )}
          </div>

          {/* Preferencias de convivencia */}
          <div>
            <h2 className="text-sm font-semibold mb-2.5">Preferencias de convivencia</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                <Cigarette className="h-3.5 w-3.5" />
                {detail.smoker_ok ? 'Fumadores OK' : 'No fumadores'}
              </Badge>
              {detail.pets_ok && (
                <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                  <PawPrint className="h-3.5 w-3.5" />Mascotas OK
                </Badge>
              )}
              {detail.party_lifestyle_ok && (
                <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                  <Music className="h-3.5 w-3.5" />Fiestas OK
                </Badge>
              )}
              {detail.cooking_shared && (
                <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                  <UtensilsCrossed className="h-3.5 w-3.5" />Cocina compartida
                </Badge>
              )}
              {detail.clean_lifestyle_ok && (
                <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                  <Sparkles className="h-3.5 w-3.5" />{CLEAN[detail.clean_lifestyle_ok] ?? detail.clean_lifestyle_ok}
                </Badge>
              )}
              {detail.noise_tolerance_ok && (
                <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                  <Volume2 className="h-3.5 w-3.5" />{NOISE[detail.noise_tolerance_ok] ?? detail.noise_tolerance_ok}
                </Badge>
              )}
              {detail.preferred_gender && detail.preferred_gender !== 'cualquiera' && (
                <Badge variant="outline" className="text-xs py-1 px-2.5">
                  Prefiere {GENDER[detail.preferred_gender] ?? detail.preferred_gender}
                </Badge>
              )}
              {detail.preferred_age_min != null && detail.preferred_age_max != null && (
                <Badge variant="outline" className="text-xs py-1 px-2.5">
                  {detail.preferred_age_min}–{detail.preferred_age_max} años
                </Badge>
              )}
            </div>
          </div>

          {/* Disponibilidad */}
          {(detail.move_in_date || detail.min_stay_months) && (
            <div>
              <h2 className="text-sm font-semibold mb-2.5">Disponibilidad</h2>
              <div className="flex flex-wrap gap-3">
                {detail.move_in_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                    Desde {new Date(detail.move_in_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
                {detail.min_stay_months && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    Mínimo {detail.min_stay_months} {detail.min_stay_months === 1 ? 'mes' : 'meses'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info adicional */}
          {detail.additional_info && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Información adicional</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{detail.additional_info}</p>
            </div>
          )}

          <Separator />

          {/* Metadatos */}
          <p className="text-xs text-muted-foreground text-center">
            Publicado el {new Date(detail.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none flex items-center gap-0.5">
                  <Euro className="h-5 w-5 text-primary" />
                  {Number(detail.max_budget).toLocaleString('es-ES')}
                  <span className="text-sm font-normal text-muted-foreground ml-1">máx/mes</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />{[detail.neighborhood, detail.city.trim()].filter(Boolean).join(', ')}
                </p>
              </div>
              <Button
                className="gap-2 shrink-0"
                onClick={handleContact}
                disabled={contacting || !detail?.user_id || detail.user_id === user?.id}
              >
                <MessageCircle className="h-4 w-4" />
                {contacting ? 'Abriendo...' : detail?.user_id === user?.id ? 'Tu anuncio' : 'Contactar'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
