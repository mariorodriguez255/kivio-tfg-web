import { useState, useEffect, useRef } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BedDouble, Users, ChevronRight, ChevronLeft, CheckCircle2,
  Wifi, Car, UtensilsCrossed, Armchair, TreePine, AArrowUp, Sofa,
  Euro, Cigarette, PawPrint, Music, ImagePlus, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  editId,
  initialData,
  initialImages,
  onSuccess,
}: {
  editId?: string | null
  initialData?: ListingForm
  initialImages?: string[]
  onSuccess: (id: string) => void
}) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ListingForm>(() => initialData ?? LISTING_INIT)
  const [errors, setErrors] = useState<Partial<Record<keyof ListingForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Image state
  const [existingImages, setExistingImages] = useState<string[]>(() => initialImages ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const imgInputRef = useRef<HTMLInputElement>(null)

  const TOTAL_STEPS = 4

  function set<K extends keyof ListingForm>(key: K, value: ListingForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    let hasMimeError = false
    let hasSizeError = false
    const valid = files.filter(f => {
      if (!ALLOWED.includes(f.type)) { hasMimeError = true; return false }
      if (f.size > 10 * 1024 * 1024) { hasSizeError = true; return false }
      return true
    })
    if (hasMimeError) toast.error('Solo se permiten imágenes JPG, PNG, WebP o GIF')
    if (hasSizeError) toast.error('Algunas imágenes superan 10 MB y se han descartado')
    const total = existingImages.length + newFiles.length + valid.length
    if (total > 10) { toast.error('Máximo 10 imágenes en total'); return }
    setNewFiles(prev => [...prev, ...valid])
    valid.forEach(f => {
      const url = URL.createObjectURL(f)
      setNewPreviews(prev => [...prev, url])
    })
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  function removeExistingImage(idx: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== idx))
  }

  function removeNewImage(idx: number) {
    URL.revokeObjectURL(newPreviews[idx])
    setNewFiles(prev => prev.filter((_, i) => i !== idx))
    setNewPreviews(prev => prev.filter((_, i) => i !== idx))
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

    const listingData = {
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
    }

    let listingId: string

    if (editId) {
      const { error } = await supabase.from('listings').update(listingData).eq('id', editId)
      if (error) {
        setSubmitError('Error al actualizar. Inténtalo de nuevo.')
        setSubmitting(false)
        return
      }
      listingId = editId
    } else {
      const { data, error } = await supabase.from('listings').insert({
        ...listingData,
        owner_id: user.id,
        status: 'active',
      }).select('id').single()
      if (error || !data) {
        setSubmitError('Error al publicar. Inténtalo de nuevo.')
        setSubmitting(false)
        return
      }
      listingId = data.id
    }

    // Upload new images and update the images array
    let finalImages = [...existingImages]
    for (const file of newFiles) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${listingId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('listings')
        .upload(path, file, { contentType: file.type })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(path)
        finalImages.push(publicUrl)
      }
    }
    await supabase.from('listings').update({ images: finalImages }).eq('id', listingId)

    onSuccess(listingId)
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Paso {step} de {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
      </div>

      {/* Paso 1: Básico */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
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

          {/* Fotos */}
          <div className="space-y-2">
            <Label className="text-sm">Fotos</Label>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((src, i) => (
                <div key={`ex-${i}`} className="relative h-24 w-24 rounded-lg overflow-hidden border bg-muted shrink-0">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={`nw-${i}`} className="relative h-24 w-24 rounded-lg overflow-hidden border bg-muted shrink-0">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {existingImages.length + newFiles.length < 10 && (
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Añadir</span>
                </button>
              )}
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
            <p className="text-xs text-muted-foreground">{existingImages.length + newFiles.length}/10 fotos</p>
          </div>
        </div>
      )}

      {/* Paso 2: El piso */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
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
        <div className="space-y-4 animate-fade-in">
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
        <div className="space-y-5 animate-fade-in">
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
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />Atrás
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={next} disabled={submitting} className="flex-1">
            Siguiente<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="flex-1">
            {submitting
              ? (editId ? 'Guardando...' : 'Publicando...')
              : (editId ? 'Guardar cambios' : 'Publicar habitación')
            }
          </Button>
        )}
      </div>
    </div>
  )
}

// ── formulario compañero ──────────────────────────────────────────────────────
function RoommateFormSteps({
  editId,
  initialData,
  onSuccess,
}: {
  editId?: string | null
  initialData?: RoommateForm
  onSuccess: (id: string) => void
}) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<RoommateForm>(() => initialData ?? ROOMMATE_INIT)
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
    if (step === 3) {
      if (form.preferred_age_min && form.preferred_age_max && Number(form.preferred_age_min) > Number(form.preferred_age_max))
        e.preferred_age_min = 'La edad mínima no puede superar la máxima'
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

    const roommateData = {
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
    }

    if (editId) {
      const { error } = await supabase.from('roommate_listings').update(roommateData).eq('id', editId)
      if (error) {
        setSubmitError('Error al actualizar. Inténtalo de nuevo.')
        setSubmitting(false)
        return
      }
      onSuccess(editId)
    } else {
      const { data, error } = await supabase.from('roommate_listings').insert({
        ...roommateData,
        user_id: user.id,
        status: 'active',
      }).select('id').single()
      if (error || !data) {
        setSubmitError('Error al publicar. Inténtalo de nuevo.')
        setSubmitting(false)
        return
      }
      onSuccess(data.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Paso {step} de {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
      </div>

      {/* Paso 1: Básico */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
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
        <div className="space-y-4 animate-fade-in">
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
        <div className="space-y-5 animate-fade-in">
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
            <Field label="Edad mínima" error={errors.preferred_age_min}>
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
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />Atrás
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={next} disabled={submitting} className="flex-1">
            Siguiente<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="flex-1">
            {submitting
              ? (editId ? 'Guardando...' : 'Publicando...')
              : (editId ? 'Guardar cambios' : 'Publicar anuncio')
            }
          </Button>
        )}
      </div>
    </div>
  )
}

// ── pantalla de éxito ─────────────────────────────────────────────────────────
function SuccessScreen({
  tipo, id, onNew, isEdit,
}: {
  tipo: 'habitacion' | 'companero'
  id: string
  onNew: () => void
  isEdit?: boolean
}) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center text-center py-12 gap-5 animate-slide-up">
      <div className="h-16 w-16 rounded-full bg-green-100 shadow-md flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold">
          {isEdit ? '¡Cambios guardados!' : '¡Publicado con éxito!'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit
            ? 'Tu anuncio ha sido actualizado correctamente'
            : 'Tu anuncio ya está visible para otros usuarios'
          }
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button
          onClick={() => navigate(tipo === 'habitacion' ? `/buscar/habitacion/${id}` : `/buscar/companero/${id}`)}
        >
          Ver mi anuncio
        </Button>
        {isEdit ? (
          <Button variant="outline" onClick={() => navigate('/perfil')}>
            Volver a mi perfil
          </Button>
        ) : (
          <Button variant="outline" onClick={onNew}>
            Publicar otro anuncio
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/buscar')}>
          Ir a buscar
        </Button>
      </div>
    </div>
  )
}

// ── página principal ───────────────────────────────────────────────────────────
export default function PublishPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tipo = searchParams.get('tipo') === 'companero' ? 'companero' : 'habitacion'
  const editId = searchParams.get('editId') || null

  const [successId, setSuccessId] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  // Edit mode state
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [editListingData, setEditListingData] = useState<ListingForm | null>(null)
  const [editListingImages, setEditListingImages] = useState<string[]>([])
  const [editRoommateData, setEditRoommateData] = useState<RoommateForm | null>(null)

  useEffect(() => {
    if (!editId) return
    setLoadingEdit(true)
    setEditListingData(null)
    setEditRoommateData(null)

    if (tipo === 'habitacion') {
      supabase.from('listings').select('*').eq('id', editId).single()
        .then(({ data }) => {
          if (!data || data.owner_id !== user?.id) {
            navigate('/')
            return
          }
          setEditListingData({
              title: data.title ?? '',
              description: data.description ?? '',
              city: data.city ?? '',
              neighborhood: data.neighborhood ?? '',
              address: data.address ?? '',
              total_rooms: data.total_rooms?.toString() ?? '',
              available_spots: data.available_spots?.toString() ?? '',
              bathrooms: data.bathrooms?.toString() ?? '',
              furnished: data.furnished ?? false,
              has_kitchen: data.has_kitchen ?? true,
              has_living_room: data.has_living_room ?? true,
              has_parking: data.has_parking ?? false,
              has_elevator: data.has_elevator ?? false,
              has_balcony: data.has_balcony ?? false,
              has_wifi: data.has_wifi ?? true,
              monthly_rent: data.monthly_rent?.toString() ?? '',
              deposit: data.deposit?.toString() ?? '',
              bills_included: data.bills_included ?? false,
              estimated_bills: data.estimated_bills?.toString() ?? '',
              gender_preference: data.gender_preference ?? 'cualquiera',
              age_min: data.age_min?.toString() ?? '',
              age_max: data.age_max?.toString() ?? '',
              smoker_allowed: data.smoker_allowed ?? true,
              pets_allowed: data.pets_allowed ?? false,
              party_lifestyle_ok: data.party_lifestyle_ok ?? true,
              house_rules: data.house_rules ?? '',
            })
          setEditListingImages((data.images as string[] | null) ?? [])
          setLoadingEdit(false)
        })
    } else {
      supabase.from('roommate_listings').select('*').eq('id', editId).single()
        .then(({ data }) => {
          if (!data || data.user_id !== user?.id) {
            navigate('/')
            return
          }
          setEditRoommateData({
              title: data.title ?? '',
              description: data.description ?? '',
              city: data.city ?? '',
              neighborhood: data.neighborhood ?? '',
              max_budget: data.max_budget?.toString() ?? '',
              expenses_included: data.expenses_included ?? false,
              move_in_date: data.move_in_date ?? '',
              min_stay_months: data.min_stay_months?.toString() ?? '',
              preferred_gender: data.preferred_gender ?? 'cualquiera',
              preferred_age_min: data.preferred_age_min?.toString() ?? '',
              preferred_age_max: data.preferred_age_max?.toString() ?? '',
              smoker_ok: data.smoker_ok ?? true,
              pets_ok: data.pets_ok ?? true,
              party_lifestyle_ok: data.party_lifestyle_ok ?? true,
              cooking_shared: data.cooking_shared ?? false,
              clean_lifestyle_ok: data.clean_lifestyle_ok ?? '',
              noise_tolerance_ok: data.noise_tolerance_ok ?? '',
              additional_info: data.additional_info ?? '',
            })
          setLoadingEdit(false)
        })
    }
  }, [editId, tipo])

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
        <SuccessScreen tipo={tipo} id={successId} onNew={handleNew} isEdit={!!editId} />
      </div>
    )
  }

  // While loading edit data, show skeleton
  const showEditLoading = editId && loadingEdit

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Cabecera */}
      <div>
        <h1 className="text-xl font-bold">{editId ? 'Editar anuncio' : 'Publicar'}</h1>
        <p className="text-sm text-muted-foreground">
          {editId ? 'Modifica los datos de tu anuncio' : '¿Qué quieres publicar?'}
        </p>
      </div>

      {/* Tipo de anuncio — solo visible en modo creación */}
      {!editId && (
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
      )}

      {/* Formulario */}
      <div className="border rounded-xl p-5 bg-card">
        {showEditLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : tipo === 'habitacion' ? (
          <ListingFormSteps
            key={`listing-${formKey}-${editId ?? 'new'}`}
            editId={editId}
            initialData={editId ? (editListingData ?? undefined) : undefined}
            initialImages={editId ? editListingImages : undefined}
            onSuccess={handleSuccess}
          />
        ) : (
          <RoommateFormSteps
            key={`roommate-${formKey}-${editId ?? 'new'}`}
            editId={editId}
            initialData={editId ? (editRoommateData ?? undefined) : undefined}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  )
}
