# Kivio Web

Adaptación web de la aplicación móvil **Kivio**, desarrollada como **Trabajo Final de Grado (TFG)** por **Mario Rodríguez**.

Kivio es una plataforma para encontrar habitaciones y compañeros de piso compatibles con tu estilo de vida. Esta versión web conecta directamente con el backend de la app móvil original, compartiendo la misma base de datos en Supabase.

---

## Características

- **Autenticación** — Registro multistep con perfil detallado (estilo de vida, intereses, idiomas) y login con email/contraseña
- **Inicio** — Recomendaciones de habitaciones y compañeros personalizadas según compatibilidad de perfil
- **Buscar** — Búsqueda y filtrado de habitaciones y anuncios de compañeros por ciudad, precio, características y preferencias
- **Publicar** — Formulario multistep para publicar habitaciones disponibles o anuncios de búsqueda de compañero
- **Chat** — Mensajería en tiempo real entre usuarios (Supabase Realtime)
- **Perfil** — Visualización y edición completa del perfil de usuario

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Framework UI |
| TypeScript | 5.9 | Tipado estático |
| Vite | 8 | Bundler y dev server |
| Tailwind CSS | 4 | Estilos |
| shadcn/ui | 4 | Componentes UI |
| React Router | 7 | Enrutado |
| Supabase JS | 2 | Base de datos, auth y realtime |
| Lucide React | — | Iconos |
| Sonner | — | Notificaciones toast |

---

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- Acceso al proyecto de Supabase de Kivio

---

## Instalación y uso

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd kivio-tfg-web

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase

# 4. Arrancar en desarrollo
npm run dev

# 5. Build de producción
npm run build
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz con las siguientes variables:

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## Estructura del proyecto

```
src/
├── assets/           # Imágenes y recursos estáticos
├── components/
│   ├── layout/       # AppSidebar — navegación principal
│   └── ui/           # Componentes shadcn/ui
├── contexts/
│   └── AuthContext   # Sesión, usuario y perfil global
├── hooks/            # Hooks reutilizables
├── layouts/          # AppLayout — estructura con sidebar
├── lib/
│   ├── supabase.ts   # Cliente Supabase
│   └── utils.ts      # Funciones utilitarias (cn, getInitials, timeAgo)
├── pages/
│   ├── auth/         # Login y registro
│   ├── home/         # Página de inicio con recomendaciones
│   ├── search/       # Búsqueda, detalle de habitación y compañero
│   ├── publish/      # Publicar anuncio (habitación o compañero)
│   ├── chat/         # Mensajería en tiempo real
│   └── profile/      # Perfil y edición de datos
└── types/
    └── database.ts   # Tipos TypeScript del esquema de BD
```

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo en localhost:5173
npm run build     # Build de producción (TypeScript + Vite)
npm run preview   # Vista previa del build de producción
npm run lint      # Linting con ESLint
```

---

## Relación con la app móvil

Esta web es una adaptación de la aplicación móvil Kivio (desarrollada en React Native / Expo). Ambas comparten:

- La misma base de datos PostgreSQL en Supabase
- El mismo sistema de autenticación (Supabase Auth)
- Las mismas tablas: `profiles`, `listings`, `roommate_listings`, `conversations`, `messages`
- Las mismas RPCs y funciones de base de datos

Los usuarios pueden usar indistintamente la app móvil y la web con la misma cuenta.

---

## Autor

**Mario Rodríguez** — Trabajo Final de Grado
