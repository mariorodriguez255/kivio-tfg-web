import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MapPin, BedDouble, Bath, Sofa, ChevronRight, ChevronLeft,
  Search, PlusSquare, Eye, Users, Cigarette,
  PawPrint, Euro, Sparkles, UserCircle2,
} from 'lucide-react'
import { getInitials, timeAgo } from '@/lib/utils'

// ── tipos ─────────────────────────────────────────────────────────────────────
interface ListingResult {
  id: string
  title: string
  city: string
  neighborhood: string | null
  monthly_rent: number
  available_spots: number
  images: string[] | null
  views_count: number
  created_at: string
  owner_name: string
  bills_included: boolean
  total_rooms: number
  bathrooms: number
  furnished: boolean
}

interface RoommateItem {
  id: string
  title: string
  city: string
  neighborhood: string | null
  max_budget: number
  expenses_included: boolean
  smoker_ok: boolean
  pets_ok: boolean
  profiles: {
    full_name: string | null
    avatar_url: string | null
    age: number | null
    occupation: string | null
  } | null
}

const OCC: Record<string, string> = {
  estudiante: 'Estudiante', trabajador: 'Trabajador',
  freelance: 'Freelance', autonomo: 'Autónomo', otro: 'Otro',
}

// ── scroll row con flechas ────────────────────────────────────────────────────
function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function update() {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener('scroll', update, { passive: true })
    return () => { ro.disconnect(); el.removeEventListener('scroll', update) }
  }, [])

  // recalcular cuando llegan los datos
  useEffect(() => { update() })

  function scroll(dir: 'left' | 'right') {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.75 : -el.clientWidth * 0.75, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {canLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-8 w-8 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth py-2 -my-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        onScroll={update}
      >
        {children}
        <div className="w-2 shrink-0" />
      </div>

      {canRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-8 w-8 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ── card habitación ───────────────────────────────────────────────────────────
function ListingCard({ l }: { l: ListingResult }) {
  const img = l.images?.[0]
  const [imgError, setImgError] = useState(false)

  return (
    <Link to={`/buscar/habitacion/${l.id}`} className="w-60 shrink-0 snap-start block group">
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1 h-full pt-0 gap-0 pb-0 ring-0 border"
    >
      {/* Imagen */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {img && !imgError
          ? <img src={img} alt={l.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setImgError(true)} />
          : <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted via-accent/20 to-primary/10">
              <BedDouble className="h-9 w-9 text-primary/20" />
            </div>
        }
        {l.bills_included && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            Gastos incl.
          </span>
        )}
        <span className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[11px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full">
          <Eye className="h-2.5 w-2.5" />{l.views_count}
        </span>
      </div>

      {/* Contenido */}
      <CardContent className="p-3 space-y-1.5">
        {/* Precio */}
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold leading-none">
            {Number(l.monthly_rent).toLocaleString('es-ES')}€
            <span className="text-xs font-normal text-muted-foreground ml-0.5">/mes</span>
          </span>
          <span className="text-xs text-muted-foreground/70">{timeAgo(l.created_at)}</span>
        </div>

        {/* Título */}
        <p className="text-xs font-semibold line-clamp-1 leading-tight">{l.title}</p>

        {/* Ubicación */}
        <p className="text-xs text-muted-foreground flex items-center gap-0.5">
          <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
          <span className="truncate">{[l.neighborhood, l.city.trim()].filter(Boolean).join(', ')}</span>
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 pt-1 border-t">
          <Badge variant="secondary" className="text-[11px] px-1.5 py-0.5 gap-0.5">
            <BedDouble className="h-2.5 w-2.5" />{l.total_rooms} hab.
          </Badge>
          <Badge variant="secondary" className="text-[11px] px-1.5 py-0.5 gap-0.5">
            <Bath className="h-2.5 w-2.5" />{l.bathrooms} baño{l.bathrooms !== 1 ? 's' : ''}
          </Badge>
          {l.furnished && (
            <Badge variant="secondary" className="text-[11px] px-1.5 py-0.5 gap-0.5">
              <Sofa className="h-2.5 w-2.5" />Amueblado
            </Badge>
          )}
        </div>

        {/* Propietario */}
        <p className="text-xs text-muted-foreground/70 truncate">{l.owner_name}</p>
      </CardContent>
    </Card>
    </Link>
  )
}

// ── card compañero ────────────────────────────────────────────────────────────
function RoommateCard({ r }: { r: RoommateItem }) {
  const p = r.profiles

  return (
    <Link to={`/buscar/companero/${r.id}`} className="w-60 shrink-0 snap-start block group">
    <Card
      className="hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1 h-full ring-0 border"
    >
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/10">
            <AvatarImage src={p?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {getInitials(p?.full_name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{p?.full_name ?? 'Usuario'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[p?.age ? `${p.age} años` : null, p?.occupation ? OCC[p.occupation] ?? p.occupation : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.title}</p>

        <div className="flex items-center gap-0.5 font-bold text-sm">
          <Euro className="h-3.5 w-3.5 text-primary" />
          {Number(r.max_budget).toLocaleString('es-ES')}€
          <span className="text-xs font-normal text-muted-foreground ml-0.5">máx/mes</span>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
          {r.city.trim()}
        </p>

        <div className="flex flex-wrap gap-1 pt-1.5 border-t">
          {!r.smoker_ok && (
            <Badge variant="secondary" className="text-[11px] px-1.5 py-0.5 gap-0.5">
              <Cigarette className="h-2.5 w-2.5" />No fuma
            </Badge>
          )}
          {r.pets_ok && (
            <Badge variant="secondary" className="text-[11px] px-1.5 py-0.5 gap-0.5">
              <PawPrint className="h-2.5 w-2.5" />Mascotas
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}

// ── skeletons ─────────────────────────────────────────────────────────────────
function ListingSkeleton() {
  return (
    <Card className="overflow-hidden w-60 shrink-0">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function RoommateSkeleton() {
  return (
    <Card className="w-60 shrink-0">
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-4 w-16" />
      </CardContent>
    </Card>
  )
}

// ── página ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<ListingResult[]>([])
  const [roommates, setRoommates] = useState<RoommateItem[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [loadingRoommates, setLoadingRoommates] = useState(true)

  useEffect(() => {
    if (!user) return

    supabase
      .rpc('search_compatible_listings', { p_user_id: user.id, p_limit: 6 })
      .then(({ data, error }) => {
        if (!error && data?.length) {
          setListings(data as ListingResult[])
          setLoadingListings(false)
        } else {
          supabase.rpc('get_public_listings', { p_limit: 6 })
            .then(({ data: d }) => {
              if (d) setListings(d as ListingResult[])
              setLoadingListings(false)
            })
        }
      })

    supabase
      .from('roommate_listings')
      .select('id, title, city, neighborhood, max_budget, expenses_included, smoker_ok, pets_ok, profiles(full_name, avatar_url, age, occupation)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setRoommates(data as unknown as RoommateItem[])
        setLoadingRoommates(false)
      })
  }, [user])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  const completenessFields = [
    !!profile?.full_name, !!profile?.age, !!profile?.city, !!profile?.bio,
    !!profile?.gender, !!profile?.occupation,
  ]
  const completeness = Math.round(
    (completenessFields.filter(Boolean).length / completenessFields.length) * 100
  )

  return (
    <div className="space-y-8">

      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(profile?.full_name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {greeting()}{firstName ? `, ${firstName}` : ''} 👋
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              {profile?.city
                ? `Cerca de ${profile.city.trim()}`
                : 'Toda España'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate('/buscar')}>
            <Search className="h-3.5 w-3.5 mr-1.5" />Buscar
          </Button>
          <Button size="sm" onClick={() => navigate('/publicar')}>
            <PlusSquare className="h-3.5 w-3.5 mr-1.5" />Publicar
          </Button>
        </div>
      </div>

      {/* ── Banner perfil incompleto ── */}
      {profile && completeness < 80 && (
        <div className="flex items-center gap-3 bg-primary/[0.07] border border-primary/20 rounded-xl p-4 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
            <UserCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Tu perfil está al {completeness}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Complétalo para mejorar tus compatibilidades</p>
          </div>
          <Button size="sm" onClick={() => navigate('/perfil')} className="shrink-0 text-xs">
            Completar
          </Button>
        </div>
      )}

      {/* ── Habitaciones ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Habitaciones disponibles
          </h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/buscar')}>
            Ver todas <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {loadingListings ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="border border-dashed rounded-xl py-12 text-center bg-gradient-to-b from-muted/30 to-transparent">
            <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
              <BedDouble className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-sm font-medium text-foreground/70">Sin habitaciones cerca</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Amplía los criterios de búsqueda</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/buscar')}>Explorar todas</Button>
          </div>
        ) : (
          <ScrollRow>
            {listings.map(l => <ListingCard key={l.id} l={l} />)}
          </ScrollRow>
        )}
      </section>

      {/* ── Compañeros ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Buscando compañero
          </h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/buscar?tab=compañeros')}>
            Ver todos <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {loadingRoommates ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => <RoommateSkeleton key={i} />)}
          </div>
        ) : roommates.length === 0 ? (
          <div className="border border-dashed rounded-xl py-12 text-center bg-gradient-to-b from-muted/30 to-transparent">
            <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
              <Users className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-sm font-medium text-foreground/70">Nadie buscando compañero aún</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">¡Sé el primero en publicar!</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/publicar?tipo=companero')}>Publicar anuncio</Button>
          </div>
        ) : (
          <ScrollRow>
            {roommates.map(r => <RoommateCard key={r.id} r={r} />)}
          </ScrollRow>
        )}
      </section>

      {/* ── Acciones rápidas ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
        <button
          onClick={() => navigate('/publicar?tipo=habitacion')}
          className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/30 hover:shadow-sm transition-all duration-150 text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <BedDouble className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Tengo una habitación libre</p>
            <p className="text-xs text-muted-foreground">Publica gratis en minutos</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
        </button>

        <button
          onClick={() => navigate('/publicar?tipo=companero')}
          className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/30 hover:shadow-sm transition-all duration-150 text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Busco compañero de piso</p>
            <p className="text-xs text-muted-foreground">Conecta con personas afines</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
        </button>
      </section>

    </div>
  )
}
