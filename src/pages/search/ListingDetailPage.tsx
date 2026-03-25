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
  MapPin, BedDouble, Bath, Sofa, Eye, Cigarette, PawPrint,
  ArrowLeft, ChevronLeft, ChevronRight, Wifi, Car,
  UtensilsCrossed, Armchair, TreePine, AArrowUp, Home, MessageCircle,
} from 'lucide-react'

interface ListingDetail {
  id: string
  title: string
  description: string
  city: string
  neighborhood: string | null
  address: string | null
  monthly_rent: number
  deposit: number | null
  bills_included: boolean
  estimated_bills: number | null
  available_spots: number
  total_rooms: number
  bathrooms: number
  furnished: boolean
  has_kitchen: boolean
  has_living_room: boolean
  has_parking: boolean
  has_elevator: boolean
  has_balcony: boolean
  has_wifi: boolean
  smoker_allowed: boolean
  pets_allowed: boolean
  party_lifestyle_ok: boolean
  gender_preference: string | null
  age_min: number | null
  age_max: number | null
  house_rules: string | null
  owner_id: string | null
  images: string[] | null
  views_count: number
  created_at: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
    age: number | null
    occupation: string | null
  } | null
}

function getInitials(name: string | null) {
  if (!name) return 'KV'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const OCC: Record<string, string> = {
  estudiante: 'Estudiante', trabajador: 'Trabajador',
  freelance: 'Freelance', autonomo: 'Autónomo', otro: 'Otro',
}

function ImageGallery({ images }: { images: string[] | null }) {
  const [idx, setIdx] = useState(0)
  const imgs = images?.filter(Boolean) ?? []

  if (imgs.length === 0) {
    return (
      <div className="w-full h-72 bg-muted rounded-xl flex items-center justify-center">
        <BedDouble className="h-12 w-12 text-muted-foreground/20" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-72 bg-muted rounded-xl overflow-hidden">
      <img src={imgs[idx]} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {imgs.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % imgs.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
          <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {idx + 1}/{imgs.length}
          </span>
        </>
      )}
    </div>
  )
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [detail, setDetail] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [contacting, setContacting] = useState(false)

  async function handleContact() {
    if (!user || !detail?.owner_id || detail.owner_id === user.id) return
    setContacting(true)
    const { data } = await supabase.rpc('chat_get_or_create_conversation', {
      p_user1_id: user.id,
      p_user2_id: detail.owner_id,
      p_listing_id: detail.id,
    })
    if (data?.[0]?.conversation_id) {
      navigate(`/chat/${data[0].conversation_id}`)
    }
    setContacting(false)
  }

  useEffect(() => {
    if (!id) return
    supabase
      .from('listings')
      .select('*, profiles(full_name, avatar_url, age, occupation)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true) }
        else { setDetail(data as unknown as ListingDetail) }
        setLoading(false)
      })

    supabase.rpc('increment_listing_views', { listing_id: id }).then(() => {})
  }, [id])

  if (notFound && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BedDouble className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">Habitación no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/buscar')}>Volver a buscar</Button>
      </div>
    )
  }

  const amenities = detail ? [
    { icon: Wifi, label: 'WiFi', ok: detail.has_wifi },
    { icon: Car, label: 'Parking', ok: detail.has_parking },
    { icon: UtensilsCrossed, label: 'Cocina', ok: detail.has_kitchen },
    { icon: Armchair, label: 'Salón', ok: detail.has_living_room },
    { icon: AArrowUp, label: 'Ascensor', ok: detail.has_elevator },
    { icon: TreePine, label: 'Balcón', ok: detail.has_balcony },
    { icon: Sofa, label: 'Amueblado', ok: detail.furnished },
  ].filter(a => a.ok) : []

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/buscar')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold text-base leading-tight line-clamp-1">
          {loading ? <Skeleton className="h-5 w-48 inline-block" /> : (detail?.title ?? '')}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : detail && (
        <>
          <ImageGallery images={detail.images} />

          {/* Precio */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-3xl font-bold leading-none">
                {Number(detail.monthly_rent).toLocaleString('es-ES')}€
                <span className="text-base font-normal text-muted-foreground ml-1">/mes</span>
              </p>
              {detail.bills_included
                ? <p className="text-sm text-green-600 font-medium mt-1">Gastos incluidos</p>
                : detail.estimated_bills
                  ? <p className="text-sm text-muted-foreground mt-1">~{Number(detail.estimated_bills).toLocaleString('es-ES')}€ est. gastos</p>
                  : null
              }
            </div>
            {detail.deposit != null && (
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Fianza</p>
                <p className="text-lg font-semibold">{Number(detail.deposit).toLocaleString('es-ES')}€</p>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {[detail.neighborhood, detail.city.trim(), detail.address].filter(Boolean).join(', ')}
          </p>

          <Separator />

          {/* Características */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/50 rounded-xl p-3">
              <BedDouble className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-sm font-bold">{detail.total_rooms}</p>
              <p className="text-xs text-muted-foreground">Habitaciones</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <Bath className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-sm font-bold">{detail.bathrooms}</p>
              <p className="text-xs text-muted-foreground">Baños</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <Home className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-sm font-bold">{detail.available_spots}</p>
              <p className="text-xs text-muted-foreground">Plazas libres</p>
            </div>
          </div>

          {/* Amenidades */}
          {amenities.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2.5">Servicios</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map(({ icon: Icon, label }) => (
                  <Badge key={label} variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preferencias */}
          <div>
            <h2 className="text-sm font-semibold mb-2.5">Preferencias del propietario</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                <Cigarette className="h-3.5 w-3.5" />
                {detail.smoker_allowed ? 'Fumadores OK' : 'No fumadores'}
              </Badge>
              {detail.pets_allowed && (
                <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                  <PawPrint className="h-3.5 w-3.5" />Mascotas OK
                </Badge>
              )}
              {detail.gender_preference && detail.gender_preference !== 'cualquiera' && (
                <Badge variant="outline" className="text-xs py-1 px-2.5 capitalize">
                  {detail.gender_preference}
                </Badge>
              )}
              {detail.age_min != null && detail.age_max != null && (
                <Badge variant="outline" className="text-xs py-1 px-2.5">
                  {detail.age_min}–{detail.age_max} años
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Descripción */}
          {detail.description && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Descripción</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{detail.description}</p>
            </div>
          )}

          {/* Normas */}
          {detail.house_rules && (
            <div>
              <h2 className="text-sm font-semibold mb-2">Normas de la casa</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{detail.house_rules}</p>
            </div>
          )}

          <Separator />

          {/* Propietario */}
          {detail.profiles && (
            <div>
              <h2 className="text-sm font-semibold mb-3">Publicado por</h2>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={detail.profiles.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(detail.profiles.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{detail.profiles.full_name ?? 'Propietario'}</p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      detail.profiles.age ? `${detail.profiles.age} años` : null,
                      detail.profiles.occupation ? OCC[detail.profiles.occupation] ?? detail.profiles.occupation : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metadatos */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{detail.views_count} visitas</span>
            <span>·</span>
            <span>Publicado {new Date(detail.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleContact}
            disabled={contacting || !detail?.owner_id || detail.owner_id === user?.id}
          >
            <MessageCircle className="h-4 w-4" />
            {contacting ? 'Abriendo chat...' : detail?.owner_id === user?.id ? 'Tu anuncio' : 'Contactar con el propietario'}
          </Button>
        </>
      )}
    </div>
  )
}
