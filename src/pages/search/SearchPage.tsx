import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  MapPin, BedDouble, Bath, Sofa, Eye, Euro, Cigarette, PawPrint,
  Search, SlidersHorizontal, X, Users,
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
  created_at: string
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

// ── card habitación ────────────────────────────────────────────────────────────
function ListingCard({ l, onClick }: { l: ListingResult; onClick: () => void }) {
  const img = l.images?.[0]
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow pt-0 gap-0 pb-0 ring-0 border"
      onClick={onClick}
    >
      <div className="relative h-44 bg-muted">
        {img
          ? <img src={img} alt={l.title} className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center"><BedDouble className="h-8 w-8 text-muted-foreground/20" /></div>
        }
        {l.bills_included && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Gastos incl.
          </span>
        )}
        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full">
          <Eye className="h-2.5 w-2.5" />{l.views_count}
        </span>
      </div>

      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold leading-none">
            {Number(l.monthly_rent).toLocaleString('es-ES')}€
            <span className="text-xs font-normal text-muted-foreground ml-0.5">/mes</span>
          </span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(l.created_at)}</span>
        </div>
        <p className="text-xs font-medium line-clamp-1 leading-tight">{l.title}</p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{[l.neighborhood, l.city.trim()].filter(Boolean).join(', ')}</span>
        </p>
        <div className="flex flex-wrap gap-1 pt-1 border-t">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
            <BedDouble className="h-2.5 w-2.5" />{l.total_rooms} hab.
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
            <Bath className="h-2.5 w-2.5" />{l.bathrooms} baño{l.bathrooms !== 1 ? 's' : ''}
          </Badge>
          {l.furnished && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
              <Sofa className="h-2.5 w-2.5" />Amueblado
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{l.owner_name}</p>
      </CardContent>
    </Card>
  )
}

// ── card compañero ─────────────────────────────────────────────────────────────
function RoommateCard({ r, onClick }: { r: RoommateItem; onClick: () => void }) {
  const p = r.profiles
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow ring-0 border"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={p?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {getInitials(p?.full_name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-xs truncate">{p?.full_name ?? 'Usuario'}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {[p?.age ? `${p.age}a` : null, p?.occupation ? OCC[p.occupation] ?? p.occupation : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{r.title}</p>

        <div className="flex items-center gap-0.5 font-bold text-sm">
          <Euro className="h-3.5 w-3.5 text-primary" />
          {Number(r.max_budget).toLocaleString('es-ES')}€
          <span className="text-[10px] font-normal text-muted-foreground ml-0.5">máx/mes</span>
        </div>

        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {[r.neighborhood, r.city.trim()].filter(Boolean).join(', ')}
        </p>

        <div className="flex flex-wrap gap-1 pt-1.5 border-t">
          {!r.smoker_ok && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
              <Cigarette className="h-2.5 w-2.5" />No fuma
            </Badge>
          )}
          {r.pets_ok && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
              <PawPrint className="h-2.5 w-2.5" />Mascotas
            </Badge>
          )}
          {r.expenses_included && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
              Gastos incl.
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── skeletons ─────────────────────────────────────────────────────────────────
function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden pt-0 gap-0 pb-0">
          <Skeleton className="h-44 w-full rounded-none" />
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

// ── página principal ───────────────────────────────────────────────────────────
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const tab = searchParams.get('tab') === 'compañeros' ? 'compañeros' : 'habitaciones'

  // Filtros habitaciones
  const [cityInput, setCityInput] = useState('')
  const [maxRent, setMaxRent] = useState('')
  const [furnished, setFurnished] = useState(false)
  const [billsIncluded, setBillsIncluded] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filtros compañeros
  const [rCityInput, setRCityInput] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [petsOnly, setPetsOnly] = useState(false)
  const [noSmokerOnly, setNoSmokerOnly] = useState(false)

  // Resultados
  const [listings, setListings] = useState<ListingResult[]>([])
  const [roommates, setRoommates] = useState<RoommateItem[]>([])
  const [loading, setLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.rpc('get_public_listings', {
      p_city: cityInput.trim() || null,
      p_limit: 30,
    })
    let results: ListingResult[] = data ?? []
    if (maxRent) results = results.filter(l => l.monthly_rent <= Number(maxRent))
    if (furnished) results = results.filter(l => l.furnished)
    if (billsIncluded) results = results.filter(l => l.bills_included)
    setListings(results)
    setLoading(false)
  }, [cityInput, maxRent, furnished, billsIncluded])

  const fetchRoommates = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('roommate_listings')
      .select('id, title, city, neighborhood, max_budget, expenses_included, smoker_ok, pets_ok, created_at, profiles(full_name, avatar_url, age, occupation)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(30)

    if (rCityInput.trim()) query = query.ilike('city', `%${rCityInput.trim()}%`)
    if (maxBudget) query = query.lte('max_budget', Number(maxBudget))
    if (petsOnly) query = query.eq('pets_ok', true)
    if (noSmokerOnly) query = query.eq('smoker_ok', false)

    const { data } = await query
    if (data) setRoommates(data as unknown as RoommateItem[])
    setLoading(false)
  }, [rCityInput, maxBudget, petsOnly, noSmokerOnly])

  useEffect(() => {
    if (tab !== 'habitaciones') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchListings, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [tab, fetchListings])

  useEffect(() => {
    if (tab !== 'compañeros') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchRoommates, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [tab, fetchRoommates])

  function switchTab(value: string) {
    setSearchParams(value === 'compañeros' ? { tab: 'compañeros' } : {})
    setShowFilters(false)
    setListings([])
    setRoommates([])
  }

  function clearFilters() {
    if (tab === 'habitaciones') {
      setCityInput(''); setMaxRent(''); setFurnished(false); setBillsIncluded(false)
    } else {
      setRCityInput(''); setMaxBudget(''); setPetsOnly(false); setNoSmokerOnly(false)
    }
  }

  const activeFiltersCount = tab === 'habitaciones'
    ? [cityInput, maxRent, furnished, billsIncluded].filter(Boolean).length
    : [rCityInput, maxBudget, petsOnly, noSmokerOnly].filter(Boolean).length

  return (
    <div className="space-y-5">

      {/* Cabecera */}
      <div>
        <h1 className="text-xl font-bold">Buscar</h1>
        <p className="text-sm text-muted-foreground">Encuentra tu habitación o compañero ideal</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={switchTab}>
        <TabsList className="w-full">
          <TabsTrigger value="habitaciones" className="flex-1 gap-1.5">
            <BedDouble className="h-3.5 w-3.5" />Habitaciones
          </TabsTrigger>
          <TabsTrigger value="compañeros" className="flex-1 gap-1.5">
            <Users className="h-3.5 w-3.5" />Compañeros
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Búsqueda + filtros */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ciudad..."
              value={tab === 'habitaciones' ? cityInput : rCityInput}
              onChange={e => tab === 'habitaciones' ? setCityInput(e.target.value) : setRCityInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(v => !v)}
            className="relative shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="border rounded-xl p-4 space-y-4 bg-card">
            {tab === 'habitaciones' ? (
              <>
                <div className="space-y-1.5 max-w-[200px]">
                  <Label className="text-xs">Precio máx. (€/mes)</Label>
                  <Input
                    type="number"
                    placeholder="Ej. 600"
                    value={maxRent}
                    onChange={e => setMaxRent(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="furnished" checked={furnished} onCheckedChange={v => setFurnished(!!v)} />
                    <Label htmlFor="furnished" className="text-sm cursor-pointer">Amueblado</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="bills" checked={billsIncluded} onCheckedChange={v => setBillsIncluded(!!v)} />
                    <Label htmlFor="bills" className="text-sm cursor-pointer">Gastos incluidos</Label>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5 max-w-[200px]">
                  <Label className="text-xs">Presupuesto máx. (€/mes)</Label>
                  <Input
                    type="number"
                    placeholder="Ej. 500"
                    value={maxBudget}
                    onChange={e => setMaxBudget(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="pets" checked={petsOnly} onCheckedChange={v => setPetsOnly(!!v)} />
                    <Label htmlFor="pets" className="text-sm cursor-pointer">Acepta mascotas</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="nosmoker" checked={noSmokerOnly} onCheckedChange={v => setNoSmokerOnly(!!v)} />
                    <Label htmlFor="nosmoker" className="text-sm cursor-pointer">No fumadores</Label>
                  </div>
                </div>
              </>
            )}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 h-7 px-2" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Conteo */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          {tab === 'habitaciones'
            ? `${listings.length} habitación${listings.length !== 1 ? 'es' : ''} encontrada${listings.length !== 1 ? 's' : ''}`
            : `${roommates.length} anuncio${roommates.length !== 1 ? 's' : ''} encontrado${roommates.length !== 1 ? 's' : ''}`
          }
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <GridSkeleton count={6} />
        ) : tab === 'habitaciones' ? (
          listings.length === 0 ? (
            <div className="col-span-full border border-dashed rounded-xl py-16 text-center">
              <BedDouble className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No se encontraron habitaciones</p>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            listings.map(l => (
              <ListingCard key={l.id} l={l} onClick={() => navigate(`/buscar/habitacion/${l.id}`)} />
            ))
          )
        ) : (
          roommates.length === 0 ? (
            <div className="col-span-full border border-dashed rounded-xl py-16 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No se encontraron compañeros</p>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            roommates.map(r => (
              <RoommateCard key={r.id} r={r} onClick={() => navigate(`/buscar/companero/${r.id}`)} />
            ))
          )
        )}
      </div>
    </div>
  )
}
