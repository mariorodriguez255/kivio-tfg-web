export type Gender = 'hombre' | 'mujer' | 'otro'
export type SchedulePreference = 'dia' | 'noche'
export type StudyTime = 'mañana' | 'tarde' | 'ambos'
export type Smoker = 'si' | 'no' | 'ocasionalmente'
export type PartyLifestyle = 'muy_social' | 'ocasionalmente' | 'tranquilo'
export type CleanLifestyle = 'muy_ordenado' | 'normal' | 'relajado'
export type Occupation = 'estudiante' | 'trabajador' | 'freelance' | 'autonomo' | 'otro'
export type WakeupTime = 'antes_8am' | '8am_10am' | 'despues_10am'
export type Bedtime = 'antes_11pm' | '11pm_1am' | 'despues_1am'
export type NoiseTolerance = 'silencio' | 'normal' | 'ruido_ok'
export type CookingFrequency = 'diario' | 'varias_veces_semana' | 'rara_vez' | 'nunca'
export type ListingStatus = 'active' | 'paused' | 'completed' | 'expired'
export type GenderPreference = 'hombre' | 'mujer' | 'cualquiera'
export type NotificationType =
  | 'new_application'
  | 'application_response'
  | 'listing_expired'
  | 'new_listing_match'
  | 'new_message'
  | 'roommate_application'
  | 'new_listing'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  age: number | null
  city: string | null
  neighborhood: string | null
  gender: Gender | null
  bio: string | null
  occupation: Occupation | null
  schedule_preference: SchedulePreference | null
  study_time: StudyTime | null
  wakeup_time: WakeupTime | null
  bedtime: Bedtime | null
  smoker: Smoker | null
  party_lifestyle: PartyLifestyle | null
  clean_lifestyle: CleanLifestyle | null
  noise_tolerance: NoiseTolerance | null
  cooking_frequency: CookingFrequency | null
  pets_friendly: boolean
  interests: string[]
  languages: string[]
  instagram_handle: string | null
  linkedin_url: string | null
  verified_social: boolean
  push_token: string | null
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  owner_id: string | null
  title: string
  description: string
  city: string
  neighborhood: string | null
  address: string | null
  total_rooms: number
  available_spots: number
  bathrooms: number
  furnished: boolean
  has_kitchen: boolean
  has_living_room: boolean
  has_parking: boolean
  has_elevator: boolean
  has_balcony: boolean
  has_wifi: boolean
  monthly_rent: number
  deposit: number | null
  bills_included: boolean
  estimated_bills: number | null
  gender_preference: GenderPreference | null
  age_min: number | null
  age_max: number | null
  smoker_allowed: boolean
  pets_allowed: boolean
  party_lifestyle_ok: boolean
  images: string[] | null
  video_url: string | null
  house_rules: string | null
  status: ListingStatus
  views_count: number
  created_at: string
  updated_at: string
  // joined
  profiles?: Profile
}

export interface RoommateListing {
  id: string
  user_id: string
  title: string
  description: string
  city: string
  neighborhood: string | null
  max_budget: number
  expenses_included: boolean
  preferred_gender: GenderPreference | null
  preferred_age_min: number | null
  preferred_age_max: number | null
  smoker_ok: boolean
  pets_ok: boolean
  party_lifestyle_ok: boolean
  clean_lifestyle_ok: string | null
  noise_tolerance_ok: string | null
  cooking_shared: boolean
  occupation_preference: string | null
  languages_required: string[]
  move_in_date: string | null
  min_stay_months: number | null
  additional_info: string | null
  status: ListingStatus
  views_count: number
  expires_at: string
  created_at: string
  updated_at: string
  // joined
  profiles?: Profile
}

export interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  listing_id: string | null
  title: string | null
  last_message_content: string | null
  last_message_at: string
  last_message_sender_id: string | null
  status: 'active' | 'archived' | 'blocked'
  muted_by_participant_1: boolean
  muted_by_participant_2: boolean
  created_at: string
  updated_at: string
  // joined
  other_user?: Profile
  listing?: Listing
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  status: 'sending' | 'sent' | 'delivered' | 'read'
  reply_to_message_id: string | null
  edited: boolean
  edited_at: string | null
  deleted_by_sender: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  related_listing_id: string | null
  roommate_listing_id: string | null
  created_at: string
}
