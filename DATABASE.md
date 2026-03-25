# Kivio — Esquema de Base de Datos (Supabase)

> Documentado el 2026-03-25 vía MCP de Supabase.
> Si hay dudas, consultar directamente el MCP de Supabase para ver el estado actual.

## Conexión

| Campo | Valor |
|---|---|
| URL | `https://afzbbgymbgbupfvvxcrt.supabase.co` |
| Anon Key | Ver `.env` → `VITE_SUPABASE_ANON_KEY` |
| Auth | Supabase Auth (compartida con la app móvil) |

---

## Tablas

### `profiles` — Perfiles de usuario (171 filas)
Tabla principal de usuarios. RLS activa. Vinculada a `auth.users`.

| Columna | Tipo | Nullable | Default | Restricciones |
|---|---|---|---|---|
| `id` | uuid | NO | — | PK → `auth.users.id` |
| `email` | text | NO | — | UNIQUE |
| `full_name` | text | SÍ | — | |
| `avatar_url` | text | SÍ | — | |
| `age` | integer | SÍ | — | 18–100 |
| `city` | text | SÍ | — | |
| `neighborhood` | text | SÍ | — | |
| `gender` | text | SÍ | — | `hombre` / `mujer` / `otro` |
| `bio` | text | SÍ | — | |
| `occupation` | text | SÍ | — | `estudiante` / `trabajador` / `freelance` / `autonomo` / `otro` |
| `schedule_preference` | text | SÍ | — | `dia` / `noche` |
| `study_time` | text | SÍ | — | `mañana` / `tarde` / `ambos` |
| `wakeup_time` | text | SÍ | — | `antes_8am` / `8am_10am` / `despues_10am` |
| `bedtime` | text | SÍ | — | `antes_11pm` / `11pm_1am` / `despues_1am` |
| `smoker` | text | SÍ | — | `si` / `no` / `ocasionalmente` |
| `party_lifestyle` | text | SÍ | — | `muy_social` / `ocasionalmente` / `tranquilo` |
| `clean_lifestyle` | text | SÍ | — | `muy_ordenado` / `normal` / `relajado` |
| `noise_tolerance` | text | SÍ | — | `silencio` / `normal` / `ruido_ok` |
| `cooking_frequency` | text | SÍ | — | `diario` / `varias_veces_semana` / `rara_vez` / `nunca` |
| `pets_friendly` | boolean | SÍ | `false` | |
| `interests` | text[] | SÍ | `{}` | Array libre de hobbies |
| `languages` | text[] | SÍ | `{}` | Array de idiomas |
| `instagram_handle` | text | SÍ | — | |
| `linkedin_url` | text | SÍ | — | |
| `verified_social` | boolean | SÍ | `false` | |
| `push_token` | text | SÍ | — | Token Expo para push notifications |
| `created_at` | timestamptz | SÍ | `now()` | |
| `updated_at` | timestamptz | SÍ | `now()` | |

**RLS:**
- SELECT: todos los perfiles son públicos (cualquier usuario autenticado)
- INSERT: solo el propio perfil (`id = auth.uid()`)
- UPDATE: solo el propio perfil

---

### `pending_profiles` — Perfiles en proceso de registro (24 filas)
Tabla temporal durante el onboarding. Mismos campos que `profiles`. Una vez completado el registro, se migra a `profiles` via `move_pending_to_profiles()`.

**RLS:** solo el propio usuario puede leer/escribir su pending profile.

---

### `listings` — Anuncios de habitaciones (15 filas)
Habitaciones publicadas por propietarios. RLS activa.

| Columna | Tipo | Nullable | Default | Restricciones |
|---|---|---|---|---|
| `id` | uuid | NO | `uuid_generate_v4()` | PK |
| `owner_id` | uuid | SÍ | — | FK → `profiles.id` |
| `title` | text | NO | — | |
| `description` | text | NO | — | |
| `city` | text | NO | — | |
| `neighborhood` | text | SÍ | — | |
| `address` | text | SÍ | — | |
| `total_rooms` | integer | NO | — | > 0 |
| `available_spots` | integer | NO | — | > 0 |
| `bathrooms` | integer | NO | — | > 0 |
| `furnished` | boolean | SÍ | `false` | |
| `has_kitchen` | boolean | SÍ | `true` | |
| `has_living_room` | boolean | SÍ | `true` | |
| `has_parking` | boolean | SÍ | `false` | |
| `has_elevator` | boolean | SÍ | `false` | |
| `has_balcony` | boolean | SÍ | `false` | |
| `has_wifi` | boolean | SÍ | `true` | |
| `monthly_rent` | numeric | NO | — | > 0 |
| `deposit` | numeric | SÍ | — | |
| `bills_included` | boolean | SÍ | `false` | |
| `estimated_bills` | numeric | SÍ | — | |
| `gender_preference` | text | SÍ | — | `hombre` / `mujer` / `cualquiera` |
| `age_min` | integer | SÍ | — | >= 18 |
| `age_max` | integer | SÍ | — | <= 100 |
| `smoker_allowed` | boolean | SÍ | `true` | |
| `pets_allowed` | boolean | SÍ | `false` | |
| `party_lifestyle_ok` | boolean | SÍ | `true` | |
| `images` | text[] | SÍ | — | Array de URLs |
| `video_url` | text | SÍ | — | |
| `house_rules` | text | SÍ | — | Máx 1000 chars |
| `status` | text | SÍ | `'active'` | `active` / `paused` / `completed` / `expired` |
| `views_count` | integer | SÍ | `0` | |
| `created_at` | timestamptz | SÍ | `now()` | |
| `updated_at` | timestamptz | SÍ | `now()` | |

**RLS:**
- SELECT: activos (públicos) + propios aunque no activos
- INSERT/UPDATE/DELETE: solo el `owner_id = auth.uid()`

---

### `roommate_listings` — Anuncios de búsqueda de compañero (7 filas)
Publicados por usuarios que buscan piso (no propietarios). RLS activa.

| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `user_id` | uuid | NO | FK → `profiles.id` |
| `title` | text | NO | |
| `description` | text | NO | |
| `city` | text | NO | |
| `neighborhood` | text | SÍ | |
| `max_budget` | numeric | NO | |
| `expenses_included` | boolean | SÍ | `false` |
| `preferred_gender` | text | SÍ | `hombre`/`mujer`/`cualquiera` |
| `preferred_age_min` | integer | SÍ | >= 18 |
| `preferred_age_max` | integer | SÍ | <= 100 |
| `smoker_ok` | boolean | SÍ | `true` |
| `pets_ok` | boolean | SÍ | `true` |
| `party_lifestyle_ok` | boolean | SÍ | `true` |
| `clean_lifestyle_ok` | text | SÍ | `muy_ordenado`/`normal`/`relajado`/`cualquiera` |
| `noise_tolerance_ok` | text | SÍ | `silencio`/`normal`/`ruido_ok`/`cualquiera` |
| `cooking_shared` | boolean | SÍ | `false` |
| `occupation_preference` | text | SÍ | `estudiante`/`trabajador`/`freelance`/`cualquiera` |
| `languages_required` | text[] | SÍ | `{}` |
| `move_in_date` | date | SÍ | |
| `min_stay_months` | integer | SÍ | 1–24 |
| `additional_info` | text | SÍ | |
| `status` | text | SÍ | `active`/`paused`/`completed`/`expired` |
| `views_count` | integer | SÍ | `0` |
| `expires_at` | timestamptz | SÍ | `now() + 30 days` |
| `created_at` | timestamptz | SÍ | |
| `updated_at` | timestamptz | SÍ | |

**RLS:**
- SELECT: activos (públicos) + los propios del usuario
- INSERT/UPDATE/DELETE: solo el `user_id = auth.uid()`

---

### `conversations` — Conversaciones de chat (24 filas)
Chat entre dos usuarios, opcionalmente ligado a un listing.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `participant_1_id` | uuid | FK → `auth.users.id` |
| `participant_2_id` | uuid | FK → `auth.users.id` |
| `listing_id` | uuid | FK → `listings.id` (opcional) |
| `title` | text | Opcional |
| `last_message_id` | uuid | |
| `last_message_content` | text | Cache del último mensaje |
| `last_message_at` | timestamptz | `now()` |
| `last_message_sender_id` | uuid | |
| `status` | text | `active` / `archived` / `blocked` |
| `muted_by_participant_1` | boolean | `false` |
| `muted_by_participant_2` | boolean | `false` |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** solo los participantes pueden ver/actualizar su conversación.

---

### `messages` — Mensajes individuales (377 filas)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `conversation_id` | uuid | FK → `conversations.id` |
| `sender_id` | uuid | FK → `auth.users.id` |
| `content` | text | |
| `message_type` | text | `text` / `image` / `file` / `system` |
| `status` | text | `sending` / `sent` / `delivered` / `read` |
| `reply_to_message_id` | uuid | FK → `messages.id` (opcional) |
| `edited` | boolean | `false` |
| `edited_at` | timestamptz | |
| `deleted_by_sender` | boolean | `false` |
| `deleted_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** solo participantes de la conversación pueden ver/crear mensajes.

---

### `message_read_status` — Estado de lectura de mensajes (367 filas)

| Columna | Tipo |
|---|---|
| `id` | uuid PK |
| `message_id` | uuid FK → `messages.id` |
| `user_id` | uuid FK → `auth.users.id` |
| `conversation_id` | uuid FK → `conversations.id` |
| `read_at` | timestamptz |

---

### `conversation_participants` — Participantes extendidos (48 filas)

| Columna | Tipo |
|---|---|
| `id` | uuid PK |
| `conversation_id` | uuid FK → `conversations.id` |
| `user_id` | uuid FK → `auth.users.id` |
| `joined_at` | timestamptz |
| `last_read_at` | timestamptz |
| `notifications_enabled` | boolean `true` |
| `custom_nickname` | text |

---

### `notifications` — Notificaciones (779 filas)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `profiles.id` |
| `type` | text | `new_application` / `application_response` / `listing_expired` / `new_listing_match` / `new_message` / `roommate_application` / `new_listing` |
| `title` | text | |
| `message` | text | |
| `read` | boolean | `false` |
| `related_listing_id` | uuid | FK → `listings.id` |
| `roommate_listing_id` | uuid | FK → `roommate_listings.id` |
| `created_at` | timestamptz | |

**RLS:** INSERT público (funciones del sistema), SELECT/UPDATE solo el propio usuario.

---

### `favorites` — Anuncios guardados (3 filas)

| Columna | Tipo |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid FK → `profiles.id` |
| `listing_id` | uuid FK → `listings.id` |
| `created_at` | timestamptz |

**RLS:** solo el propio usuario puede ver/añadir/borrar sus favoritos.

---

### `compatibility_scores` — Puntuaciones de compatibilidad (0 filas — tabla lista)

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `profiles.id` |
| `target_id` | uuid | FK → `profiles.id` |
| `total_score` | integer | 0–100 |
| `lifestyle_score` | integer | 0–40 |
| `demographics_score` | integer | 0–20 |
| `location_score` | integer | 0–15 |
| `budget_score` | integer | 0–15 |
| `interests_score` | integer | 0–10 |
| `calculated_at` | timestamptz | |
| `created_at` | timestamptz | |

**RLS:** SELECT solo propios, gestión completa por `service_role`.

---

### `blocked_users` — Usuarios bloqueados (0 filas)

| Columna | Tipo |
|---|---|
| `id` | uuid PK |
| `blocker_id` | uuid FK → `profiles.id` |
| `blocked_id` | uuid FK → `profiles.id` |
| `reason` | text |
| `created_at` / `updated_at` | timestamptz |

---

### `scheduled_notifications` — Notificaciones programadas (19 filas)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `profiles.id` |
| `title` / `body` | text | |
| `type` | text | |
| `data` | jsonb | `{}` |
| `priority` | text | `low`/`normal`/`high`/`urgent` |
| `scheduled_for` | timestamptz | |
| `expires_at` | timestamptz | |
| `sent` | boolean | `false` |
| `sent_at` | timestamptz | |
| `created_at` | timestamptz | |

**RLS:** gestionada solo por `service_role`.

---

### `notification_templates` — Plantillas de notificación (8 filas)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `title` / `body` | text | |
| `type` | text | `broadcast` |
| `target_segment` | text | `all`/`active_users`/`inactive_users`/`owners`/`seekers` |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** solo `service_role`.

---

### `error_reports` — Reportes de errores (0 filas)

| Columna | Tipo |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid FK → `profiles.id` |
| `error_type` | `crash`/`bug`/`ui_issue`/`performance`/`feature_request`/`other` |
| `title` / `description` | text |
| `steps_to_reproduce` / `expected_behavior` / `actual_behavior` | text |
| `severity` | `low`/`medium`/`high`/`critical` |
| `screen_name` / `app_version` | text |
| `device_info` | jsonb |
| `error_stack` | text |
| `user_email` | text |
| `attachments` | text[] |
| `status` | `open`/`in_progress`/`resolved`/`closed` |

---

## Diagrama de relaciones (simplificado)

```
auth.users
    │
    ├── profiles (1:1)
    │       ├── listings (1:N) ← owner_id
    │       ├── roommate_listings (1:N) ← user_id
    │       ├── favorites (1:N)
    │       ├── notifications (1:N)
    │       ├── compatibility_scores (1:N como user y target)
    │       ├── blocked_users (1:N como blocker y blocked)
    │       └── scheduled_notifications (1:N)
    │
    ├── conversations (participant_1_id + participant_2_id)
    │       ├── messages (1:N) ← conversation_id
    │       ├── message_read_status (1:N)
    │       └── conversation_participants (1:N)
    │
    └── pending_profiles (1:1, tabla temporal de onboarding)

listings
    ├── conversations (opcional, listing_id)
    ├── favorites (1:N)
    └── notifications (related_listing_id)

roommate_listings
    └── notifications (roommate_listing_id)
```

---

## Funciones SQL (RPCs)

### Autenticación / Perfil
| Función | Retorno | Descripción |
|---|---|---|
| `handle_new_user()` | trigger | Crea perfil en `profiles` al registrarse |
| `handle_new_user_improved()` | trigger | Versión mejorada del anterior |
| `handle_email_confirmation()` | trigger | Maneja confirmación de email |
| `handle_email_confirmation_improved()` | trigger | Versión mejorada |
| `move_pending_to_profiles(...)` | record | Mueve un `pending_profile` a `profiles` |
| `manually_move_profile(...)` | text | Migración manual de perfil pendiente |
| `safe_insert_pending_profile(...)` | record | Inserta o actualiza pending profile |
| `get_unified_profile(...)` | record | Devuelve el perfil unificado (profiles + pending) |
| `anonymize_user_data(...)` | boolean | Anonimiza datos de usuario (GDPR) |
| `delete_user_data(...)` | boolean | Borra datos del usuario |
| `delete_user_account(...)` | jsonb | Elimina cuenta completa |
| `export_user_data(...)` | jsonb | Exporta todos los datos del usuario (GDPR) |

### Listings y búsqueda
| Función | Retorno | Descripción |
|---|---|---|
| `get_public_listings(...)` | record | Listado público de habitaciones con filtros |
| `search_compatible_listings(...)` | record | Busca listings compatibles con el perfil del usuario |
| `search_compatible_roommates(...)` | record | Busca compañeros compatibles |
| `increment_listing_views(listing_id)` | integer | Incrementa contador de vistas de un listing |
| `increment_roommate_views(listing_id)` | integer | Incrementa vistas de roommate listing |
| `is_listing_favorited(listing_id)` | boolean | Comprueba si un listing está en favoritos del usuario |
| `get_listing_favorites_count(listing_id)` | integer | Nº de veces que un listing está en favoritos |
| `user_owns_listing(listing_id)` | boolean | ¿El usuario autenticado es el owner? |
| `create_sample_listings()` | void | Genera listings de prueba |

### Compatibilidad
| Función | Retorno | Descripción |
|---|---|---|
| `calculate_compatibility_score(user_id, target_id)` | record | Calcula score entre dos usuarios (lifestyle 40, demographics 20, location 15, budget 15, interests 10) |
| `clear_compatibility_cache()` | trigger | Limpia la caché de scores cuando cambia un perfil |

### Chat / Mensajería
| Función | Retorno | Descripción |
|---|---|---|
| `chat_get_or_create_conversation(other_user_id, listing_id?)` | record | Obtiene o crea una conversación |
| `chat_get_user_conversations()` | record | Lista todas las conversaciones del usuario |
| `chat_send_message(conversation_id, content, message_type?)` | record | Envía un mensaje |
| `get_conversation_messages(conversation_id, limit?, offset?)` | record | Obtiene mensajes de una conversación |
| `mark_messages_as_read(conversation_id)` | integer | Marca mensajes como leídos |
| `update_message_status(message_id, status)` | boolean | Actualiza el estado de un mensaje |
| `user_can_access_conversation(conversation_id)` | boolean | ¿El usuario tiene acceso? |
| `user_can_access_message(message_id)` | boolean | ¿El usuario puede ver este mensaje? |
| `cleanup_empty_conversations()` | integer | Limpia conversaciones vacías |

### Notificaciones
| Función | Retorno | Descripción |
|---|---|---|
| `create_notification(user_id, type, title, message, ...)` | uuid | Crea una notificación en BD |
| `notify_new_listing(...)` | trigger/void | Notifica a usuarios cuando hay nuevo listing |
| `notify_new_listing_roomiematch(...)` | trigger/void | Notifica match de roommate listing |
| `notify_listing_status_change(...)` | trigger/void | Notifica cambio de estado de listing |
| `check_and_schedule_notifications(...)` | record | Comprueba y programa notificaciones pendientes |
| `process_scheduled_notifications()` | record | Procesa notificaciones programadas |
| `cleanup_expired_scheduled_notifications()` | integer | Limpia notificaciones expiradas |
| `schedule_engagement_notifications()` | record | Programa notificaciones de engagement |
| `send_engagement_notifications_now()` | record | Envía notificaciones de engagement inmediatamente |
| `run_engagement_cycle()` | record | Ejecuta el ciclo completo de engagement (llamado por la Edge Function) |

### Usuarios bloqueados
| Función | Retorno | Descripción |
|---|---|---|
| `block_user(blocked_id)` | jsonb | Bloquea a un usuario |
| `unblock_user(blocked_id)` | jsonb | Desbloquea a un usuario |
| `is_user_blocked(user_id)` | boolean | ¿Está bloqueado? |
| `get_blocked_users()` | record | Lista de usuarios bloqueados por el actual |

### Utilidades / Admin
| Función | Retorno | Descripción |
|---|---|---|
| `get_database_stats()` | record | Estadísticas generales de la BD |
| `clean_unused_profile_images()` | void | Limpia imágenes de perfil no usadas |
| `verify_rls_security()` | record | Verifica que las políticas RLS son correctas |
| `trigger_set_timestamp()` | trigger | Actualiza `updated_at` automáticamente |
| `update_updated_at_column()` | trigger | Idem |

---

## Edge Functions

### `send-notification`
- **Autenticación:** JWT requerido
- **Propósito:** Envía push notification via Expo + guarda la notificación en BD
- **Payload:**
  ```ts
  {
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    type: 'message' | 'application' | 'application_response' | 'listing_match' | 'roommate_application'
  }
  ```
- **Flujo:** Lee `push_token` de `profiles` → envía a `exp.host` (Expo) → guarda en `notifications`

### `engagement-cycle`
- **Autenticación:** JWT + header `x-cron-secret`
- **Propósito:** Ejecuta el ciclo de engagement (notificaciones programadas, usuarios inactivos, etc.)
- **Flujo:** Llama a `run_engagement_cycle()` vía RPC
- **Uso:** Cron job automatizado, no se llama desde el cliente web

---

## Notas para el desarrollo web

1. **Chat**: usar `chat_get_or_create_conversation()` y `chat_send_message()` vía RPC. Suscribirse a cambios en `messages` con Supabase Realtime.
2. **Listings**: usar `get_public_listings()` o `search_compatible_listings()` para búsqueda. `increment_listing_views()` al entrar al detalle.
3. **Onboarding**: el registro usa `pending_profiles`. Al completar, `move_pending_to_profiles()` o `manually_move_profile()`.
4. **Favoritos**: `is_listing_favorited()` + INSERT/DELETE en `favorites`.
5. **Notificaciones**: leer de `notifications` + marcar como leídas con UPDATE. No hay push web, solo in-app.
6. **Compatibilidad**: `calculate_compatibility_score(user_id, target_id)` devuelve score total y desglosado.
7. **Bloqueos**: `block_user()` / `unblock_user()` / `is_user_blocked()`.
