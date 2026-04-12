# Anáhuac Scholar — Portal Institucional

## WHAT: Proyecto y Stack

Sistema web para gestión de servicio becario universitario. Los alumnos registran jornadas de trabajo con un cronómetro (o registro manual), los jefes validan esas jornadas, y los administradores gestionan usuarios, asignaciones, períodos y reportes.

- **Framework:** Next.js 14 (App Router) + TypeScript (modo estricto)
- **Runtime:** Node.js 20 LTS
- **UI:** Tailwind CSS + shadcn/ui + Material Symbols Outlined (iconos)
- **DB:** PostgreSQL 16 (local en desarrollo, cloud en producción)
- **ORM:** Prisma con `prisma/seed.ts` para datos de desarrollo
- **Auth:** Auth.js (v5), estrategia Credentials con bcrypt
- **Validación:** Zod en formularios, Server Actions y API — sin excepciones
- **Fechas:** date-fns con zona horaria `America/Mexico_City`
- **Estado:** Zustand con middleware `persist` (cronómetro + UI state)
- **Formularios:** react-hook-form + `@hookform/resolvers/zod`
- **Notificaciones:** sonner (toast notifications para feedback de acciones)

## WHY: Modelo de dominio

### Roles y permisos

**Admin:**
- Crea, edita y desactiva usuarios (uno por uno, no importación masiva)
- Asigna alumnos a jefes
- Gestiona catálogo de carreras y períodos
- Abre y cierra períodos (cierre manual, con candado si hay jornadas pendientes)
- Ve reportes globales con filtros por: porcentaje de beca, carrera, facultad, jefe y período
- NO valida jornadas

**Jefe_Servicio:**
- Ve listado de sus alumnos asignados y sus jornadas
- Aprueba o rechaza jornadas terminadas (comentario obligatorio al rechazar)
- Ve resumen de horas acumuladas por alumno con barra de progreso
- NO puede validar jornadas de alumnos que no le están asignados

**Alumno:**
- Inicia/detiene cronómetro para registrar jornadas
- Puede crear un registro manual (fecha, hora inicio, hora fin, descripción) — se trata como cualquier jornada y pasa por validación del jefe
- Ve su historial de jornadas y horas acumuladas
- Ve barra de progreso hacia su meta de horas + estadísticas
- Puede cancelar una jornada en estado Pendiente (no editar, solo cancelar)
- NO puede modificar jornadas Aprobadas o Rechazadas

### Schema de base de datos

```
User
  id                  String    @id @default(cuid())
  email               String    @unique
  name                String
  passwordHash        String
  role                Role      (enum: ADMIN, JEFE_SERVICIO, ALUMNO)
  mustChangePassword  Boolean   @default(true)
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

Career
  id                  String    @id @default(cuid())
  name                String    @unique
  faculty             String

Period
  id                  String    @id @default(cuid())
  name                String    @unique    // Ej: "Agosto - Diciembre 2024"
  startDate           DateTime
  endDate             DateTime
  isActive            Boolean   @default(true)
  isClosed            Boolean   @default(false)
  createdAt           DateTime  @default(now())

StudentProfile
  id                  String    @id @default(cuid())
  userId              String    @unique → User
  careerId            String → Career
  studentId           String    @unique   // Matrícula universitaria
  semester            Int
  enrollmentYear      Int
  scholarshipPercent  Int                 // Porcentaje de beca (1-100)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

Assignment (Alumno ↔ Jefe, relación vigente por período)
  id                  String    @id @default(cuid())
  studentId           String → User (role ALUMNO)
  supervisorId        String → User (role JEFE_SERVICIO)
  periodId            String → Period
  department          String              // Ej: "Laboratorios TI"
  targetHours         Int                 // = scholarshipPercent al momento de crear
  accumulatedMinutes  Int       @default(0) // Minutos aprobados (entero, evita float)
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  UNIQUE(studentId, periodId)

WorkSession (Jornada)
  id                  String    @id @default(cuid())
  assignmentId        String → Assignment   // Vincula jornada a asignación específica
  studentId           String → User (role ALUMNO)
  startTime           DateTime
  endTime             DateTime?
  totalMinutes        Int?                  // Se calcula al detener
  status              Status   (enum: PENDIENTE, APROBADA, RECHAZADA, CANCELADA)
  isManual            Boolean  @default(false) // true si fue registro manual
  description         String?
  rejectionComment    String?
  validatedBy         String? → User (role JEFE_SERVICIO)
  validatedAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
```

### Decisiones de diseño del schema

- **`accumulatedMinutes` es Int, no Float.** Evita problemas de precisión de punto flotante. Convertir a horas solo en la presentación: `accumulatedMinutes / 60`. Al finalizar el período, redondear al entero más cercano para el reporte final (`Math.round(accumulatedMinutes / 60)`).
- **`targetHours` vive en Assignment, no en StudentProfile.** Porque la meta de horas es por período. Si el alumno cambia de porcentaje de beca, el nuevo período tendrá un `targetHours` diferente. Las horas del período anterior no se arrastran.
- **`assignmentId` en WorkSession.** Vincula cada jornada a la asignación específica bajo la cual se trabajó. Si el alumno cambia de jefe entre períodos, el historial queda limpio.
- **Period como entidad.** Permite al admin gestionar períodos formalmente: abrir, cerrar, y aplicar candado. Los períodos ya no son strings sueltos sino registros con fechas de inicio/fin.
- **`isManual` en WorkSession.** Distingue jornadas registradas con cronómetro de las ingresadas manualmente.

### Regla de horas por beca

IMPORTANT: La meta de horas se determina por el porcentaje de beca del alumno. Si un alumno tiene 50% de beca, debe completar 50 horas de servicio en el semestre. Al crear un Assignment, `targetHours` se calcula automáticamente como `scholarshipPercent` del StudentProfile al momento de la asignación. Si el porcentaje cambia en un nuevo período, solo afecta al Assignment nuevo — los anteriores quedan intactos.

### Estadísticas calculadas (dashboard del alumno)

Se calculan en el servidor, no se persisten:
- **Este Mes:** suma de `totalMinutes / 60` de jornadas APROBADAS del mes actual
- **Promedio Semanal:** horas aprobadas del período / semanas transcurridas
- **Restantes:** `targetHours - (accumulatedMinutes / 60)` (del Assignment activo)
- **Estatus:** "En Tiempo" si el ritmo permite completar antes del fin del período; "Atrasado" si no

### Flujo de estados de una jornada

```
[Cronómetro iniciado]   → PENDIENTE (endTime = null, cronómetro corriendo)
[Cronómetro detenido]   → PENDIENTE (endTime set, descripción capturada, esperando validación)
[Registro manual]       → PENDIENTE (isManual = true, todos los campos llenos, esperando validación)
[Jefe aprueba]          → APROBADA  (accumulatedMinutes del Assignment += totalMinutes)
[Jefe rechaza]          → RECHAZADA (accumulatedMinutes NO se modifica, comentario obligatorio)
[Alumno cancela]        → CANCELADA (solo si status = PENDIENTE y endTime != null)
```

### Sistema de candado de período

IMPORTANT: El Admin es el único que puede cerrar un período. Un período NO se puede cerrar si existen jornadas con status PENDIENTE en cualquier Assignment de ese período. Esto fuerza a jefes y alumnos a resolver todas las jornadas antes del cierre. Cuando el período está cerrado (`isClosed = true`):
- No se pueden crear nuevas jornadas en ese período
- No se pueden modificar jornadas existentes
- Los datos quedan como histórico de consulta

### Reglas de desactivación de usuarios

IMPORTANT: Un usuario no puede ser desactivado si tiene relaciones activas:
- **Alumno:** no se puede desactivar si tiene un Assignment activo (período abierto). Primero desactivar o reasignar.
- **Jefe:** no se puede desactivar si tiene alumnos asignados en un período activo. Primero reasignar alumnos.
- **Admin:** no hay restricción (pero debe existir al menos un admin activo en el sistema).
- El botón de desactivar debe mostrar el motivo del bloqueo si hay relaciones activas.

### Flujo de pantallas por rol

**Login (`/login`):**
- Formulario con correo institucional y contraseña
- Redirección automática según rol
- Si `mustChangePassword`, redirigir a `/cambiar-password`
- No hay mockup específico — seguir la misma línea visual del dashboard (filosofía Academic Curator, misma paleta, Manrope + Inter)

**Cambiar contraseña (`/cambiar-password`):**
- Campos: contraseña actual (solo si no es primer login), nueva contraseña, confirmar contraseña
- Seguir línea visual del login

**Dashboard Alumno (`/alumno/jornadas`):**
- Layout Bento Grid (12 columnas) — ver mockup en `docs/design/screen.png`
- Cronómetro grande (span 8): display oversized del tiempo (HH:MM:ss), botones "Iniciar Jornada" / "Finalizar"
- Card de asignación (span 4): fondo oscuro (zinc-900), muestra jefe asignado, período actual, departamento
- Progreso (span 12): barra de progreso con gradiente naranja + stripe animation, porcentaje grande, 4 stat cards (Este Mes, Promedio Semanal, Restantes, Estatus)
- Actividad reciente (span 12): tabla con fecha, jefe, horas, estado (chips de color), menú de acciones
- Botón "Registrar Jornada" en sidebar: abre modal/página para registro manual (fecha, hora inicio, hora fin, descripción)
- FAB naranja fijo en esquina inferior derecha

**Dashboard Jefe (`/jefe/validaciones`):**
- Bandeja de jornadas terminadas pendientes de validación
- Indicador visual si la jornada fue registro manual (`isManual`)
- Por cada jornada: datos del alumno, fecha, duración, descripción
- Botones Aprobar / Rechazar (rechazar abre modal para comentario)
- Vista de alumnos asignados con progreso (`/jefe/alumnos`)
- Sin mockup específico — seguir línea visual del dashboard alumno

**Dashboard Admin:**
- Reportes con filtros (`/admin/reportes`): porcentaje de beca, carrera, facultad, jefe, período
- Tabla resumen: alumno, carrera, % beca, horas meta, horas acumuladas, % completado
- CRUD usuarios (`/admin/usuarios`)
- Asignaciones alumno↔jefe (`/admin/asignaciones`)
- Catálogo de carreras (`/admin/carreras`)
- Gestión de períodos (`/admin/periodos`): crear, cerrar (con validación de candado)
- Sin mockup específico — seguir línea visual del dashboard alumno

## HOW: Reglas de desarrollo

### Shell
- Entorno Windows. Usar PowerShell para todos los comandos.

### Código
- Naming en inglés para código; UI 100% en español (incluyendo sidebar, navegación, labels, botones, todo).
- Separación estricta: marcar `"use client"` solo donde sea necesario.
- Nunca generar fragmentos parciales — archivos completos y funcionales.
- Verificar tipos con `npx tsc --noEmit` después de cambios.
- Importar Prisma client siempre desde `@/lib/db` (singleton pattern).

### Manejo de errores
- Server Actions retornan `{ success: boolean, error?: string, data?: T }`.
- Feedback con sonner: `toast.success()` / `toast.error()`.
- `error.tsx` boundaries en cada ruta de layout.
- `loading.tsx` con skeletons para estados de carga.

### Testing y verificación
- `npm run build` después de cada cambio significativo.
- `npx prisma validate` tras modificar schema.
- `npx prisma db push` en desarrollo (migrations hasta producción).

### Git
- Commits atómicos, mensajes en español.
- Formato: `feat: descripción`, `fix: descripción`, `chore: descripción`.

### Estructura de carpetas (src/)
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── cambiar-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── alumno/
│   │   │   └── jornadas/
│   │   ├── jefe/
│   │   │   ├── validaciones/
│   │   │   └── alumnos/
│   │   └── admin/
│   │       ├── usuarios/
│   │       ├── asignaciones/
│   │       ├── carreras/
│   │       ├── periodos/
│   │       └── reportes/
│   └── api/
├── components/
│   ├── ui/
│   ├── layout/           # Sidebar, TopBar, NavUser
│   ├── cronometro/
│   └── shared/           # DataTable, StatusChip, ConfirmDialog, ProgressBar
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── auth.config.ts
│   ├── utils.ts
│   └── validations/
├── actions/
├── hooks/
├── stores/
└── types/
```

### Variables de entorno

Generar `.env.example`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/servicio_becario"
AUTH_SECRET="generar-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### Referencia visual

Mockups y design system en `docs/design/`. IMPORTANT: Antes de implementar cualquier pantalla, revisar las imágenes y el código HTML en esa carpeta. El HTML de Stitch es referencia visual, NO código de producción. Las pantallas sin mockup (login, jefe, admin) deben seguir la misma línea visual del dashboard del alumno.

## Reglas de negocio CRÍTICAS

IMPORTANT: Violar estas reglas es un bug.

1. **Sesión activa única:** Solo una jornada activa por alumno (`endTime IS NULL`). Validar en DB. Si existe una activa, mostrar error y redirigir al cronómetro activo.
2. **No overlapping:** Sin traslapes de tiempo entre jornadas del mismo alumno (excluyendo CANCELADAS). Aplica tanto para cronómetro como para registros manuales.
3. **Duración mínima:** Una jornada debe durar al menos 15 minutos. Si el cronómetro se detiene antes de 15 min, mostrar error y no guardar. En registro manual, validar que la diferencia entre hora fin y hora inicio sea ≥ 15 min. Notificar al usuario claramente de este requisito.
4. **Flujo de validación:** Solo el Jefe con Assignment activo hacia ese alumno puede validar.
5. **Acumulado de horas:** APROBADA suma `totalMinutes` a `accumulatedMinutes` del Assignment. RECHAZADA/CANCELADA no suma. Convertir a horas solo en presentación.
6. **Persistencia del cronómetro:** `startTime` se guarda en DB al iniciar. Frontend calcula tiempo desde ese `startTime`. Zustand solo guarda estado de UI; DB es la fuente de verdad.
7. **Cambio de contraseña obligatorio:** Middleware redirige a `/cambiar-password` si `mustChangePassword === true`. Excepciones: la ruta de cambio de contraseña y logout.
8. **Descripción obligatoria:** Al detener cronómetro o enviar registro manual, mínimo 10 caracteres describiendo actividades.
9. **Protección de rutas por rol:** Middleware valida acceso. Alumno no accede a `/admin/*` ni `/jefe/*`.
10. **Meta = porcentaje de beca:** `targetHours` se copia de `scholarshipPercent` al crear Assignment. Si el porcentaje cambia, solo afecta nuevos Assignments.
11. **Candado de período:** No se puede cerrar un período con jornadas PENDIENTES. Esto bloquea al Admin hasta que jefes y alumnos resuelvan todas las jornadas.
12. **Integridad de desactivación:** No se puede desactivar un usuario con relaciones activas en períodos abiertos. Mostrar motivo del bloqueo.
13. **Período cerrado = inmutable:** En período cerrado, no se crean ni modifican jornadas.

## Design System: "The Academic Curator"

### Filosofía

Arquitectura Tonal — usar whitespace y cambios de fondo para definir zonas, NO líneas. El dashboard debe sentirse como un servicio premium, no como una base de datos. Referencia completa en `docs/design/DESIGN.md`.

### Tipografía dual

- **Manrope** (headlines, títulos, nav, cronómetro): `font-headline`. Letter-spacing: -0.02em.
- **Inter** (body, labels, datos): `font-body` / `font-label`.
- Labels de categoría: uppercase con tracking +0.05em.

Importar ambas desde Google Fonts:
```
Manrope:wght@400;500;600;700;800
Inter:wght@400;500;600
```

### Iconografía

Material Symbols Outlined (no Lucide). Importar desde Google Fonts. `FILL 1` para ícono activo en sidebar, `FILL 0` para el resto.

### Paleta de colores (tokens que se usan en tailwind.config.ts)

```javascript
colors: {
  // Superficies (jerarquía de fondos)
  "surface":                  "#f8f9fa",  // Fondo principal de la app
  "surface-bright":           "#f8f9fa",  // Hover en filas de tabla
  "surface-container-lowest": "#ffffff",  // Cards flotantes
  "surface-container-low":    "#f3f4f5",  // Sub-secciones, stat cards, inputs
  "surface-container":        "#edeeef",  // Barra de progreso fondo
  "surface-container-high":   "#e7e8e9",  // Botones secundarios soft, chip cancelada
  "surface-variant":          "#e1e3e4",  // Fondos alternativos

  // Primary (Anáhuac Orange)
  "primary":                  "#a04100",  // Texto de acento, segundos del cronómetro
  "primary-container":        "#ff6b00",  // Botones primarios, FAB, barra de progreso fill
  "on-primary":               "#ffffff",  // Texto sobre primary
  "on-primary-container":     "#572000",  // Texto sobre primary-container

  // Secondary (Anthracite)
  "secondary":                "#5f5e5e",  // Texto secundario
  "secondary-container":      "#e2dfde",  // Fondos secundarios
  "on-secondary":             "#ffffff",
  "on-secondary-container":   "#636262",

  // Tertiary (Institutional Blue — estados positivos, NO verde)
  "tertiary":                 "#0062a1",  // Texto "En Tiempo" en estatus
  "tertiary-fixed":           "#d0e4ff",  // Chip "Aprobada" fondo
  "on-tertiary-fixed":        "#001d35",  // Chip "Aprobada" texto

  // Error
  "error":                    "#ba1a1a",
  "error-container":          "#ffdad6",  // Chip "Rechazada" fondo
  "on-error-container":       "#93000a",  // Chip "Rechazada" texto

  // Texto y bordes
  "on-surface":               "#191c1d",  // Texto principal
  "on-surface-variant":       "#5a4136",  // Texto terciario, chip cancelada texto
  "outline-variant":          "#e2bfb0",  // Ghost borders (15% opacity)
  "background":               "#f8f9fa",
}
```

Tokens adicionales del Material Design 3 (inverse, fixed-dim, etc.) están en `docs/design/DESIGN.md` para referencia pero no se incluyen en Tailwind config del MVP para evitar ruido.

### Regla "No-Line"

IMPORTANT: Prohibido usar `border` de 1px sólido para separar contenido. Definir límites solo con cambios de fondo o whitespace. Excepciones:
- Focus state en inputs: 2px ghost border con `primary`
- Separador en sidebar: `border-white/10`
- Dividers en tabla: `divide-zinc-50` (casi invisible)

### Elevación y profundidad

- NO usar sombras default de Tailwind sin modificar.
- Cards flotantes: `shadow-[0_4px_32px_rgba(25,28,29,0.06)]` (glow suave).
- Hover en cards: background shift a `surface-bright` + incremento sutil de sombra.
- Glassmorphism en TopBar: `bg-white/80 backdrop-blur-xl`.

### Componentes clave

**Sidebar (fija, w-64, zinc-900):**
- Logo: "Anáhuac Scholar" en Manrope bold blanco, subtítulo "PORTAL INSTITUCIONAL" en uppercase zinc-500
- Nav items en español: Inicio, Mis Jornadas, Reportes, Perfil
- Ítem activo: `border-r-4 border-orange-500 bg-white/5`
- Footer: botón CTA naranja "Registrar Jornada" (abre modal de registro manual), links Configuración/Ayuda

**TopBar (fija, glassmorphism):**
- Título de sección en Manrope bold
- Avatar + nombre del usuario con rol en uppercase
- Sin barra de búsqueda (fuera del MVP)
- Sin íconos de notificaciones ni grid (fuera del MVP)

**Cronómetro:**
- Tipografía: `text-8xl font-black font-headline tracking-tighter` para HH:MM
- Segundos: `text-3xl font-bold text-primary`
- Label "JORNADA ACTIVA" en uppercase tracking-widest
- Botón primario: gradiente sutil, `shadow-lg shadow-orange-200/50`, hover `-translate-y-0.5`
- Botón secundario: `border-2 border-orange-200 text-primary`

**Barra de progreso:**
- Container: `h-6 bg-surface-container rounded-full`
- Fill: `bg-primary-container rounded-full` con glow `shadow-[0_0_20px_rgba(255,107,0,0.4)]`
- Stripe animation diagonal (referencia en `docs/design/code.html`)
- Stat cards: grid 4 cols, fondo `surface-container-low rounded-xl`

**Status Chips:**
- Aprobada: `bg-tertiary-fixed text-on-tertiary-fixed` (azul, NO verde)
- Pendiente: `bg-orange-100 text-orange-600`
- Rechazada: `bg-error-container text-on-error-container`
- Cancelada: `bg-surface-container-high text-on-surface-variant`
- Estilo: `rounded-full text-[10px] font-black uppercase tracking-wider px-3 py-1`

**Card de asignación:**
- Fondo `zinc-900`, texto blanco
- Ícono en container `bg-white/10 rounded-xl`
- Labels uppercase `text-zinc-400 tracking-widest`
- Separador: `border-t border-white/10`

**FAB:** fijo `bottom-8 right-8`, `w-14 h-14 bg-primary-container text-white rounded-full shadow-2xl`

**Tabla de actividad:**
- `divide-zinc-50`, headers uppercase `text-xs tracking-widest text-zinc-500`
- Hover: `hover:bg-surface-bright`
- Indicador de registro manual: badge o ícono sutil junto al chip de estado

### Font config en Tailwind
```javascript
fontFamily: {
  headline: ["Manrope"],
  body: ["Inter"],
  label: ["Inter"],
}
borderRadius: {
  DEFAULT: "0.25rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "9999px",
}
```

## Alcance del MVP

Incluir:
- Login + cambio de contraseña obligatorio
- Roles con protección de rutas
- Cronómetro con persistencia
- Registro manual de jornadas
- Validación de jornadas por jefe
- Progreso de horas con estadísticas
- Panel admin: CRUD usuarios, asignaciones, carreras, períodos
- Candado de período
- Reportes básicos con filtros

IMPORTANT: No incluir salvo que se pida:
- SSO o integración institucional
- Notificaciones por email
- Exportación a PDF o Excel
- App móvil
- Multi-campus
- Auditoría avanzada
- Integraciones externas
- Barra de búsqueda en TopBar
- Sistema de notificaciones in-app

## Seed data

`prisma/seed.ts` con:
- 1 período activo: "Agosto - Diciembre 2024"
- 1 Admin: admin@anahuac.mx / Admin123! (mustChangePassword: false)
- 2 Jefes: jefe1@anahuac.mx, jefe2@anahuac.mx / Jefe123!
- 5 Alumnos con distintos % de beca:
  - alumno1 (80%, 80h meta) — Ing. Sistemas, Laboratorios TI
  - alumno2 (50%, 50h meta) — Ing. Sistemas, Laboratorios TI
  - alumno3 (30%, 30h meta) — Administración, Coordinación Académica
  - alumno4 (100%, 100h meta) — Administración, Coordinación Académica
  - alumno5 (25%, 25h meta) — Derecho, Bufete Jurídico
  - Password: Alumno123!
- 3 Carreras: Ing. Sistemas (Fac. Ingeniería), Administración (Fac. Economía y Negocios), Derecho (Fac. Derecho)
- Assignments con departamentos: alumno1-3 → jefe1, alumno4-5 → jefe2
- Jornadas de ejemplo: mix de aprobadas (con minutos sumados en accumulatedMinutes), pendientes, rechazadas, y al menos 1 registro manual

## Workflow

Entregas pequeñas y funcionales. Al terminar cada tarea, preguntar antes de avanzar. No adelantar fases sin confirmación.