/# Kivio Web — Contexto del Proyecto

## ¿Qué es Kivio?

Kivio es una plataforma de búsqueda de compañeros de piso y habitaciones compartidas orientada a estudiantes y jóvenes profesionales en España. El creador es **Mario Rodríguez** (19 años), es su TFG.

El objetivo principal es conectar a personas que buscan habitación con propietarios que ofrecen alojamiento compartido, con énfasis en **perfiles verificados** y **compatibilidad entre usuarios**.

---

## Estado actual (2026-03-25)

- La app **ya existe en formato móvil** (React Native / Expo).
- El **backend ya está montado en Supabase** (compartido con la app móvil).
- Este repositorio es la **versión web** conectada a la misma Supabase.

### Páginas completadas ✅
- **Login** (`/login`) — email + password, logo, link a register
- **Register** (`/register`) — onboarding 5 pasos con todos los campos de `profiles`, usa `safe_insert_pending_profile` RPC + pantalla de confirmación de email
- **Home** (`/`) — saludo con avatar, fila horizontal de habitaciones (scroll con flechas), fila horizontal de compañeros, acciones rápidas

### Páginas pendientes ⏳
- **Buscar** (`/buscar`) — tabs Habitaciones/Compañeros, filtros, cards con compatibilidad
- **Publicar** (`/publicar`) — tabs Habitación/Compañero, formularios completos
- **Chat** (`/chat` + `/chat/:conversationId`) — lista conversaciones + panel mensajes con Realtime
- **Perfil** (`/perfil`) — ver/editar perfil, mis anuncios, favoritos

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Estilos | Tailwind CSS v4 |
| Componentes UI | **shadcn/ui (100%)** — sin otros sistemas de componentes |
| Backend / DB | Supabase (compartido con la app móvil) |
| Auth | Supabase Auth (mismo sistema que la app) |
| Router | React Router v7 (library mode) |
| Estado global | Context API (`AuthContext`) |

> **Regla clave:** Todos los componentes de interfaz deben usarse desde shadcn/ui. No mezclar con otras librerías de UI.

---

## Estructura de carpetas (src/)

```
src/
├── assets/              # kiviologo.png
├── components/
│   ├── layout/          # AppSidebar.tsx
│   └── ui/              # Componentes shadcn generados
├── contexts/            # AuthContext.tsx
├── layouts/             # AppLayout.tsx (SidebarProvider + max-w-5xl centrado)
├── lib/
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts
├── pages/
│   ├── auth/            # LoginPage.tsx, RegisterPage.tsx
│   ├── home/            # HomePage.tsx ✅
│   ├── search/          # SearchPage.tsx (placeholder)
│   ├── publish/         # PublishPage.tsx (placeholder)
│   ├── chat/            # ChatPage.tsx (placeholder)
│   └── profile/         # ProfilePage.tsx (placeholder)
└── types/               # database.ts (tipos completos de Supabase)
```

---

## Rutas

| Ruta | Vista | Estado |
|---|---|---|
| `/login` | Login | ✅ |
| `/register` | Registro multi-step | ✅ |
| `/` | Home | ✅ |
| `/buscar` | Búsqueda | ⏳ |
| `/publicar` | Publicar anuncio | ⏳ |
| `/chat` | Lista de chats | ⏳ |
| `/chat/:conversationId` | Conversación | ⏳ |
| `/perfil` | Perfil | ⏳ |

---

## Detalles de implementación clave

### Auth flow
- Email confirmation requerida
- No hay INSERT trigger en `auth.users`
- Solo hay trigger UPDATE (`on_auth_user_confirmed_improved`) que llama a `move_pending_to_profiles()`
- `safe_insert_pending_profile()` RPC es SECURITY DEFINER — funciona sin sesión activa

### Color principal
- `#8052E0` → `oklch(0.55 0.22 287)` — aplicado en `src/index.css` como `--primary`

### Layout
- `AppLayout` tiene `max-w-5xl mx-auto` centrado sobre el contenido de todas las páginas
- Sidebar `collapsible="icon"` con logo, navegación y footer de usuario

### Cards en scroll horizontal (ScrollRow)
- Las cards deben usar `ring-0 border` en lugar del `ring-1` por defecto de shadcn/ui Card
- Motivo: `ring-1` usa `box-shadow` que se recorta con `overflow-x: auto`
- `border` es parte del box model y no se recorta
- ScrollRow usa `py-2 -my-2` para que el `hover:shadow-md` no se recorte verticalmente
- `snap-x snap-mandatory` + `snap-start` en cada card para scroll limpio sin cards cortadas

### search_compatible_listings
- Puede devolver 400 si el usuario no tiene fila en `profiles`
- Fallback: `get_public_listings`
