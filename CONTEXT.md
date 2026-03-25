/# Kivio Web — Contexto del Proyecto

## ¿Qué es Kivio?

Kivio es una plataforma de búsqueda de compañeros de piso y habitaciones compartidas orientada a estudiantes y jóvenes profesionales en España. El creador es **Mario Rodríguez** (19 años).

El objetivo principal es conectar a personas que buscan habitación con propietarios que ofrecen alojamiento compartido, con énfasis en **perfiles verificados** y **compatibilidad entre usuarios**.

---

## Estado actual

- La app **ya existe en formato móvil** (React Native / Expo, previsiblemente).
- El **backend ya está montado en Supabase** (base de datos PostgreSQL + funciones Edge + Auth).
- Este repositorio es la **versión web** que se construye desde cero, conectándose a la misma Supabase.

---

## Stack tecnológico (Web)

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Estilos | Tailwind CSS |
| Componentes UI | **shadcn/ui (100%)** — sin otros sistemas de componentes |
| Backend / DB | Supabase (compartido con la app móvil) |
| Auth | Supabase Auth (mismo sistema que la app) |
| Router | React Router v7 (por definir) |
| Estado global | Por definir (Zustand o Context API) |

> **Regla clave:** Todos los componentes de interfaz deben usarse desde shadcn/ui. No mezclar con otras librerías de UI.

---

## Funcionalidades principales (extraídas de kivio.es y la app)

### Para usuarios que buscan piso / habitación
- Registro y login con perfil verificado
- Búsqueda de habitaciones con filtros avanzados (ciudad, precio, estilo de vida…)
- Ver fichas de habitaciones con fotos, precio y amenities
- Sistema de mensajería integrado con propietarios
- Matching de compatibilidad con otros usuarios

### Para propietarios
- Publicar anuncios de habitaciones con fotos y precios
- Panel de gestión de solicitudes y candidatos
- Editar y eliminar listados

### General
- Blog / artículos de ayuda (selección de compañero, guías de barrios, convivencia)
- Cobertura geográfica: Madrid, Barcelona, Valencia y toda España

---

## Base de datos (Supabase — pendiente de documentar)

> La estructura exacta se completará una vez que se configure el MCP de Supabase.
> Lo que se sabe hasta ahora:
> - Existe una tabla de **usuarios/perfiles**
> - Existe una tabla de **habitaciones/anuncios**
> - Existe un sistema de **mensajería**
> - Existe un sistema de **matching / compatibilidad**
> - Posiblemente tablas de **solicitudes** y **favoritos**

---

## Estructura de carpetas prevista (src/)

```
src/
├── components/          # Componentes reutilizables (basados en shadcn)
│   └── ui/              # Componentes shadcn generados
├── pages/               # Vistas / rutas principales
│   ├── auth/            # Login, registro
│   ├── home/            # Landing / búsqueda
│   ├── rooms/           # Listado y detalle de habitaciones
│   ├── profile/         # Perfil de usuario
│   ├── messages/        # Mensajería
│   └── dashboard/       # Panel de propietario
├── lib/
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Utilidades (shadcn cn helper)
├── hooks/               # Custom hooks
├── store/               # Estado global
└── types/               # Tipos TypeScript compartidos
```

---

## Rutas previstas

| Ruta | Vista |
|---|---|
| `/` | Landing / home con búsqueda |
| `/login` | Login |
| `/register` | Registro |
| `/rooms` | Listado de habitaciones (búsqueda + filtros) |
| `/rooms/:id` | Detalle de habitación |
| `/profile/:id` | Perfil de usuario |
| `/messages` | Bandeja de mensajes |
| `/dashboard` | Panel del propietario |
| `/dashboard/new` | Crear nuevo anuncio |

---

## Notas de desarrollo

- La versión web debe ser **responsive**, priorizando escritorio pero funcional en móvil.
- El diseño debe mantener la identidad visual de Kivio (colores, logo, tono).
- Se conecta a la **misma Supabase** que la app móvil: no hay migración de datos, solo conexión al proyecto existente.
- Las **Edge Functions** de Supabase ya existentes (notificaciones, matching, etc.) también estarán disponibles.
- El proyecto es un **TFG** (Trabajo de Fin de Grado), por lo que la calidad del código y arquitectura son importantes.

---

## Pendiente antes de empezar a codificar

- [ ] Configurar MCP de Supabase para explorar el esquema de la base de datos
- [ ] Documentar todas las tablas y relaciones
- [ ] Documentar las Edge Functions disponibles
- [ ] Instalar y configurar dependencias: Tailwind, shadcn, React Router, Supabase JS, Zustand
- [ ] Configurar variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Inicializar shadcn en el proyecto
