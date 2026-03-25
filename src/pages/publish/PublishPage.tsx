import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BedDouble, Users, ChevronRight, ChevronLeft, CheckCircle2,
  Wifi, Car, UtensilsCrossed, Armchair, TreePine, AArrowUp, Sofa,
  Euro, Cigarette, PawPrint, Music,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── tipos ─────────────────────────────────────────────────────────────────────
interface ListingForm {
  title: string; description: string; city: string; neighborhood: string; address: string
  total_rooms: string; available_spots: string; bathrooms: string
  furnished: boolean; has_kitchen: boolean; has_living_room: boolean
  has_parking: boolean; has_elevator: boolean; has_balcony: boolean; has_wifi: boolean
  monthly_rent: string; deposit: string; bills_included: boolean; estimated_bills: string
  gender_preference: string
  age_min: string; age_max: string
  smoker_allowed: boolean; pets_allowed: boolean; party_lifestyle_ok: boolean
  house_rules: string
}

interface RoommateForm {
  title: string; description: string; city: string; neighborhood: string
  max_budget: string; expenses_included: boolean
  move_in_date: string; min_stay_months: string
  preferred_gender: string
  preferred_age_min: string; preferred_age_max: string
  smoker_ok: boolean; pets_ok: boolean; party_lifestyle_ok: boolean
  cooking_shared: boolean
  clean_lifestyle_ok: string; noise_tolerance_ok: string
  additional_info: string
}

// ── valores iniciales ─────────────────────────────────────────────────────────
const LISTING_INIT: ListingForm = {
  title: '', description: '', city: '', neighborhood: '', address: '',
  total_rooms: '', available_spots: '', bathrooms: '',
  furnished: false, has_kitchen: true, has_living_room: true,
  has_parking: false, has_elevator: false, has_balcony: false, has_wifi: true,
  monthly_rent: '', deposit: '', bills_included: false, estimated_bills: '',
  gender_preference: 'cualquiera',
  age_min: '', age_max: '',
  smoker_allowed: true, pets_allowed: false, party_lifestyle_ok: true,
  house_rules: '',
}

const ROOMMATE_INIT: RoommateForm = {
  title: '', description: '', city: '', neighborhood: '',
  max_budget: '', expenses_included: false,
  move_in_date: '', min_stay_months: '',
  preferred_gender: 'cualquiera',
  preferred_age_min: '', preferred_age_max: '',
  smoker_ok: true, pets_ok: true, party_lifestyle_ok: true,
  cooking_shared: false,
  clean_lifestyle_ok: '', noise_tolerance_ok: '',
  additional_info: '',
}

// ── componente toggle pill ────────────────────────────────────────────────────
function Toggle({
  active, onClick, children, className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors select-none',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background border-border text-foreground hover:bg-accent',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ── paso header ───────────────────────────────────────────────────────────────
function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-0.5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

// ── campo con label ───────────────────────────────────────────────────────────
function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── formulario habitación ─────────────────────────────────────────────────────
function ListingFormSteps({
  onSuccess,
}: {
  onSuccess: (id: string) => void
}) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ListingForm>(LISTING_INIT)
  const [errors, setErrors] = useState<Partial<Record<keyof ListingForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const TOTAL_STEPS = 4

  function set<K extends keyof ListingForm>(key: K, value: ListingForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof ListingForm, string>> = {}
    if (step === 1) {
      if (!form.title.trim()) e.title = 'Campo obligatorio'
      if (!form.description.trim()) e.description = 'Campo obligatorio'
      if (!form.city.trim()) e.city = 'Campo obligatorio'
    }
    if (step === 2) {
      if (!form.total_rooms || Number(form.total_rooms) < 1) e.total_rooms = 'Mínimo 1'
      if (!form.available_spots || Number(form.available_spots) < 1) e.available_spots = 'Mínimo 1'
      if (!form.bathrooms || Number(form.bathrooms) < 1) e.bathrooms = 'Mínimo 1'
      if (form.available_spots && form.total_rooms && Number(form.available_spots) > Number(form.total_rooms))
        e.available_spots = 'No puede superar el total de habitaciones'
    }
    if (step === 3) {
      if (!form.monthly_rent || Number(form.monthly_rent) <= 0) e.monthly_rent = 'Introduce un precio válido'
    }
    if (step === 4) {
      if (form.age_min && form.age_max && Number(form.age_min) > Number(form.age_max))
        e.age_min = 'La edad mínima no puede superar la máxima'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (validate()) setStep(s => s + 1)
  }

  async function submit() {
    if (!validate() || !user) return
    setSubmitting(true)
    setSubmitError('')
    const { data, error } = await supabase.from('listings').insert({
      owner_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim() || null,
      address: form.address.trim() || null,
      total_rooms: Number(form.total_rooms),
      available_spots: Number(form.available_spots),
      bathrooms: Number(form.bathrooms),
      furnished: form.furnished,
      has_kitchen: form.has_kitchen,
      has_living_room: form.has_living_room,
      has_parking: form.has_parking,
      has_elevator: form.has_elevator,
      has_balcony: form.has_balcony,
      has_wifi: form.has_wifi,
      monthly_rent: Number(form.monthly_rent),
      deposit: form.deposit ? Number(form.deposit) : null,
      bills_included: form.bills_included,
      estimated_bills: form.estimated_bills ? Number(form.estimated_bills) : null,
      gender_preference: form.gender_preference || null,
      age_min: form.age_min ? Number(form.age_min) : null,
      age_max: form.age_max ? Number(form.age_max) : null,
      smoker_allowed: form.smoker_allowed,
      pets_allowed: form.pets_allowed,
      party_lifestyle_ok: form.party_lifestyle_ok,
      house_rules: form.house_rules.trim() || null,
      status: 'active',
    }).select('id').single()

    if (error || !data) {
      setSubmitError('Error al publicar. Inténtalo de nuevo.')
      setSubmitting(false)
      return
    }
    onSuccess(data.id)
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Paso {step} de {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
      </div>

      {/* Paso 1: Básico */}
      {step === 1 && (
        <div className="space-y-4">
          <StepHeader title="Lo básico" desc="Cuéntanos sobre la habitación que ofreces" />
          <Field label="Título del anuncio" required error={errors.title}>
            <Input
              placeholder="Ej. Habitación luminosa en piso compartido"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Descripción" required error={errors.description}>
            <Textarea
              placeholder="Describe el piso, la habitación, el ambiente..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{form.description.length}/1000</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad" required error={errors.city}>
              <Input placeholder="Madrid" value={form.city} onChange={e => set('city', e.target.value)} />
            </Field>
            <Field label="Barrio">
              <Input placeholder="Malasaña" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
            </Field>
          </div>
          <Field label="Dirección">
            <Input placeholder="Calle Mayor, 12 (no se muestra exacta)" value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
        </div>
      )}

      {/* Paso 2: El piso */}
      {step === 2 && (
        <div className="space-y-5">
          <StepHeader title="El piso" desc="Detalles y características del inmueble" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Habitaciones totales" required error={errors.total_rooms}>
              <Input type="number" min={1} max={20} placeholder="3" value={form.total_rooms}
                onChange={e => set('total_rooms', e.target.value)} />
            </Field>
            <Field label="Plazas libres" required error={errors.available_spots}>
              <Input type="number" min={1} max={20} placeholder="1" value={form.available_spots}
                onChange={e => set('available_spots', e.target.value)} />
            </Field>
            <Field label="Baños" required error={errors.bathrooms}>
              <Input type="number" min={1} max={10} placeholder="1" value={form.bathrooms}
                onChange={e => set('bathrooms', e.target.value)} />
            </Field>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Características</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'furnished' as const, icon: Sofa, label: 'Amueblado' },
                { key: 'has_wifi' as const, icon: Wifi, label: 'WiFi' },
                { key: 'has_kitchen' as const, icon: UtensilsCrossed, label: 'Cocina' },
                { key: 'has_living_room' as const, icon: Armchair, label: 'Salón' },
                { key: 'has_parking' as const, icon: Car, label: 'Parking' },
                { key: 'has_elevator' as const, icon: AArrowUp, label: 'Ascensor' },
                { key: 'has_balcony' as const, icon: TreePine, label: 'Balcón' },
              ].map(({ key, icon: Icon, label }) => (
                <Toggle key={key} active={form[key] as boolean} onClick={() => set(key, !form[key])}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </Toggle>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Paso 3: Precio */}
      {step === 3 && (
        <div className="space-y-4">
          <StepHeader title="Precio" desc="¿Cuánto cuesta vivir aquí?" />
          <Field label="Alquiler mensual (€)" required error={errors.monthly_rent}>
            <div className="relative">
              <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" min={1} placeholder="600" className="pl-8"
                value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)} />
            </div>
          </Field>
          <Field label="Fianza (€)">
            <div className="relative">
              <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" min={0} placeholder="600 (opcional)" className="pl-8"
                value={form.deposit} onChange={e => set('deposit', e.target.value)} />
            </div>
          </Field>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm">Gastos de comunidad</Label>
            <div className="flex gap-2">
              <Toggle active={form.bills_included} onClick={() => set('bills_included', true)}>
                Incluidos en el precio
              </Toggle>
              <Toggle active={!form.bills_included} onClick={() => set('bills_included', false)}>
                No incluidos
              </Toggle>
            </div>
            {!form.bills_included && (
              <Field label="Coste estimado de gastos (€/mes)">
                <div className="relative">
                  <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" min={0} placeholder="80 (opcional)" className="pl-8"
                    value={form.estimated_bills} onChange={e => set('estimated_bills', e.target.value)} />
                </div>
              </Field>
            )}
          </div>
        </div>
      )}

      {/* Paso 4: Preferencias */}
      {step === 4 && (
        <div className="space-y-5">
          <StepHeader title="Preferencias" desc="¿Qué perfil de inquilino buscas?" />

          <div className="space-y-2">
            <Label className="text-sm">Género preferido</Label>
            <div className="flex gap-2 flex-wrap">
              {[['cualquiera', 'Cualquiera'], ['hombre', 'Hombre'], ['mujer', 'Mujer']].map(([val, label]) => (
                <Toggle key={val} active={form.gender_preference === val} onClick={() => set('gender_preference', val)}>
                  {label}
                </Toggle>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Edad mínima" error={errors.age_min}>
              <Input type="number" min={18} max={99} placeholder="18" value={form.age_min}
                onChange={e => set('age_min', e.target.value)} />
            </Field>
            <Field label="Edad máxima">
              <Input type="number" min={18} max={99} placeholder="35" value={form.age_max}
                onChange={e => set('age_max', e.target.value)} />
            </Field>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Normas de convivencia</Label>
            <div className="flex flex-wrap gap-2">
              <Toggle active={form.smoker_allowed} onClick={() => set('smoker_allowed', !form.smoker_allowed)}>
                <Cigarette className="h-3.5 w-3.5" />{form.smoker_allowed ? 'Fumadores OK' : 'No fumadores'}
              </Toggle>
              <Toggle active={form.pets_allowed} onClick={() => set('pets_allowed', !form.pets_allowed)}>
                <PawPrint className="h-3.5 w-3.5" />{form.pets_allowed ? 'Mascotas OK' : 'Sin mascotas'}
              </Toggle>
              <Toggle active={form.party_lifestyle_ok} onClick={() => set('party_lifestyle_ok', !form.party_lifestyle_ok)}>
                <Music className="h-3.5 w-3.5" />{form.party_lifestyle_ok ? 'Fiestas OK' : 'Sin fiestas'}
              </Toggle>
            </div>
          </div>

          <Field label="Normas de la casa">
            <Textarea
              placeholder="No fumar dentro, respetar el descanso a partir de las 23h..."
              value={form.house_rules}
              onChange={e => set('house_rules', e.target.value)}
              rows={3}
              maxLength={500}
            />
          </Field>

          {submitError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{submitError}</p>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />Atrás
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={next} className="flex-1">
            Siguiente<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="flex-1">
            {submitting ? 'Publicando...' : 'Publicar habitación'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── formulario compañero ──────────────────────────────────────────────────────
function RoommateFormSteps({
  onSuccess,
}: {
  onSuccess: (id: string) => void
}) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<RoommateForm>(ROOMMATE_INIT)
  const [errors, setErrors] = useState<Partial<Record<keyof RoommateForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const TOTAL_STEPS = 3

  function set<K extends keyof RoommateForm>(key: K, value: RoommateForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof RoommateForm, string>> = {}
    if (step === 1) {
      if (!form.title.trim()) e.title = 'Campo obligatorio'
      if (!form.description.trim()) e.description = 'Campo obligatorio'
      if (!form.city.trim()) e.city = 'Campo obligatorio'
    }
    if (step === 2) {
      if (!form.max_budget || Number(form.max_budget) <= 0) e.max_budget = 'Introduce un presupuesto válido'
      if (form.min_stay_months && Number(form.min_stay_months) < 1)
        e.min_stay_months = 'Mínimo 1 mes'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (validate()) setStep(s => s + 1)
  }

  async function submit() {
    if (!validate() || !user) return
    setSubmitting(true)
    setSubmitError('')
    const { data, error } = await supabase.from('roommate_listings').insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim() || null,
      max_budget: Number(form.max_budget),
      expenses_included: form.expenses_included,
      move_in_date: form.move_in_date || null,
      min_stay_months: form.min_stay_months ? Number(form.min_stay_months) : null,
      preferred_gender: form.preferred_gender || null,
      preferred_age_min: form.preferred_age_min ? Number(form.preferred_age_min) : null,
      preferred_age_max: form.preferred_age_max ? Number(form.preferred_age_max) : null,
      smoker_ok: form.smoker_ok,
      pets_ok: form.pets_ok,
      party_lifestyle_ok: form.party_lifestyle_ok,
      cooking_shared: form.cooking_shared,
      clean_lifestyle_ok: form.clean_lifestyle_ok || null,
      noise_tolerance_ok: form.noise_tolerance_ok || null,
      additional_info: form.additional_info.trim() || null,
      status: 'active',
    }).select('id').single()

    if (error || !data) {
      setSubmitError('Error al publicar. Inténtalo de nuevo.')
      setSubmitting(false)
      return
    }
    onSuccess(data.id)
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Paso {step} de {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
      </div>

      {/* Paso 1: Básico */}
      {step === 1 && (
        <div className="space-y-4">
          <StepHeader title="Tu anuncio" desc="Preséntate y explica qué estás buscando" />
          <Field label="Título del anuncio" required error={errors.title}>
            <Input
              placeholder="Ej. Busco habitación tranquila en el centro"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Descripción" required error={errors.description}>
            <Textarea
              placeholder="Cuéntate un poco sobre ti, tus hábitos, qué tipo de piso buscas..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{form.description.length}/1000</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad" required error={errors.city}>
              <Input placeholder="Barcelona" value={form.city} onChange={e => set('city', e.target.value)} />
            </Field>
            <Field label="Barrio preferido">
              <Input placeholder="Gràcia" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
            </Field>
          </div>
        </div>
      )}

      {/* Paso 2: Presupuesto y disponibilidad */}
      {step === 2 && (
        <div className="space-y-4">
          <StepHeader title="Presupuesto" desc="¿Cuánto puedes pagar y cuándo puedes entrar?" />

          <Field label="Presupuesto máximo (€/mes)" required error={errors.max_budget}>
            <div className="relative">
              <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" min={1} placeholder="600" className="pl-8"
                value={form.max_budget} onChange={e => set('max_budget', e.target.value)} />
            </div>
          </Field>

          <div className="space-y-2">
            <Label className="text-sm">Gastos</Label>
            <div className="flex gap-2">
              <Toggle active={form.expenses_included} onClick={() => set('expenses_included', true)}>
                Incluidos en el precio
              </Toggle>
              <Toggle active={!form.expenses_included} onClick={() => set('expenses_included', false)}>
                No incluidos
              </Toggle>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha de entrada">
              <Input type="date" value={form.move_in_date} onChange={e => set('move_in_date', e.target.value)} />
            </Field>
            <Field label="Estancia mínima (meses)" error={errors.min_stay_months}>
              <Input type="number" min={1} max={24} placeholder="6"
                value={form.min_stay_months} onChange={e => set('min_stay_months', e.target.value)} />
            </Field>
          </div>
        </div>
      )}

      {/* Paso 3: Convivencia */}
      {step === 3 && (
        <div className="space-y-5">
          <StepHeader title="Convivencia" desc="¿Qué tipo de compañeros/as buscas?" />

          <div className="space-y-2">
            <Label className="text-sm">Género preferido</Label>
            <div className="flex gap-2 flex-wrap">
              {[['cualquiera', 'Cualquiera'], ['hombre', 'Hombre'], ['mujer', 'Mujer']].map(([val, label]) => (
                <Toggle key={val} active={form.preferred_gender === val} onClick={() => set('preferred_gender', val)}>
                  {label}
                </Toggle>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Edad mínima">
              <Input type="number" min={18} max={99} placeholder="18"
                value={form.preferred_age_min} onChange={e => set('preferred_age_min', e.target.value)} />
            </Field>
            <Field label="Edad máxima">
              <Input type="number" min={18} max={99} placeholder="35"
                value={form.preferred_age_max} onChange={e => set('preferred_age_max', e.target.value)} />
            </Field>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Preferencias de convivencia</Label>
            <div className="flex flex-wrap gap-2">
              <Toggle active={form.smoker_ok} onClick={() => set('smoker_ok', !form.smoker_ok)}>
                <Cigarette className="h-3.5 w-3.5" />{form.smoker_ok ? 'Fumadores OK' : 'No fumadores'}
              </Toggle>
              <Toggle active={form.pets_ok} onClick={() => set('pets_ok', !form.pets_ok)}>
                <PawPrint className="h-3.5 w-3.5" />{form.pets_ok ? 'Mascotas OK' : 'Sin mascotas'}
              </Toggle>
              <Toggle active={form.party_lifestyle_ok} onClick={() => set('party_lifestyle_ok', !form.party_lifestyle_ok)}>
                <Music className="h-3.5 w-3.5" />{form.party_lifestyle_ok ? 'Fiestas OK' : 'Sin fiestas'}
              </Toggle>
              <Toggle active={form.cooking_shared} onClick={() => set('cooking_shared', !form.cooking_shared)}>
                <UtensilsCrossed className="h-3.5 w-3.5" />Cocina compartida
              </Toggle>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nivel de orden">
              <Select value={form.clean_lifestyle_ok || undefined} onValueChange={v => set('clean_lifestyle_ok', v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Indiferente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="muy_ordenado">Muy ordenado</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="relajado">Relajado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nivel de ruido">
              <Select value={form.noise_tolerance_ok || undefined} onValueChange={v => set('noise_tolerance_ok', v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Indiferente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="silencio">Silencio</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="ruido_ok">Ruido OK</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Información adicional">
            <Textarea
              placeholder="Cualquier detalle extra que quieras añadir..."
              value={form.additional_info}
              onChange={e => set('additional_info', e.target.value)}
              rows={3}
              maxLength={500}
            />
          </Field>

          {submitError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{submitError}</p>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />Atrás
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={next} className="flex-1">
            Siguiente<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="flex-1">
            {submitting ? 'Publicando...' : 'Publicar anuncio'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── pantalla de éxito ─────────────────────────────────────────────────────────
function SuccessScreen({
  tipo, id, onNew,
}: {
  tipo: 'habitacion' | 'companero'
  id: string
  onNew: () => void
}) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center text-center py-12 gap-5">
      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold">¡Publicado con éxito!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tu anuncio ya está visible para otros usuarios
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button
          onClick={() => navigate(tipo === 'habitacion' ? `/buscar/habitacion/${id}` : `/buscar/companero/${id}`)}
        >
          Ver mi anuncio
        </Button>
        <Button variant="outline" onClick={onNew}>
          Publicar otro anuncio
        </Button>
        <Button variant="ghost" onClick={() => navigate('/buscar')}>
          Ir a buscar
        </Button>
      </div>
    </div>
  )
}

// ── página principal ───────────────────────────────────────────────────────────
export default function PublishPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tipo = searchParams.get('tipo') === 'companero' ? 'companero' : 'habitacion'
  const [successId, setSuccessId] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  function switchTipo(value: string) {
    setSearchParams(value === 'companero' ? { tipo: 'companero' } : { tipo: 'habitacion' })
    setSuccessId(null)
    setFormKey(k => k + 1)
  }

  function handleSuccess(id: string) {
    setSuccessId(id)
  }

  function handleNew() {
    setSuccessId(null)
    setFormKey(k => k + 1)
  }

  if (successId) {
    return (
      <div className="max-w-lg mx-auto">
        <SuccessScreen tipo={tipo} id={successId} onNew={handleNew} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Cabecera */}
      <div>
        <h1 className="text-xl font-bold">Publicar</h1>
        <p className="text-sm text-muted-foreground">¿Qué quieres publicar?</p>
      </div>

      {/* Tipo de anuncio */}
      <Tabs value={tipo} onValueChange={switchTipo}>
        <TabsList className="w-full">
          <TabsTrigger value="habitacion" className="flex-1 gap-1.5">
            <BedDouble className="h-3.5 w-3.5" />Habitación
          </TabsTrigger>
          <TabsTrigger value="companero" className="flex-1 gap-1.5">
            <Users className="h-3.5 w-3.5" />Busco compañero
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Formulario */}
      <div className="border rounded-xl p-5 bg-card">
        {tipo === 'habitacion' ? (
          <ListingFormSteps key={`listing-${formKey}`} onSuccess={handleSuccess} />
        ) : (
          <RoommateFormSteps key={`roommate-${formKey}`} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  )
}
