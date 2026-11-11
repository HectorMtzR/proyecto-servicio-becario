# Portal Becario — Anáhuac Scholar

Sistema web para gestionar el **servicio becario universitario**. Los alumnos registran jornadas de trabajo (con cronómetro o registro manual), los jefes de servicio las validan y los administradores gestionan usuarios, asignaciones, carreras, períodos y reportes.

La meta de horas de cada alumno equivale a su porcentaje de beca: un alumno con 50 % de beca debe cubrir 50 horas en el período.

---

## Contenido

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Desarrollo local](#desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Datos de demostración (seed)](#datos-de-demostración-seed)
- [Despliegue en Railway](#despliegue-en-railway)
- [Despliegue con Docker Compose (VPS)](#despliegue-con-docker-compose-vps)
- [Reglas de negocio principales](#reglas-de-negocio-principales)
- [Pendientes conocidos](#pendientes-conocidos)

---

## Funcionalidades

### Comunes a todos los roles
- Inicio de sesión con correo institucional y contraseña.
- Cambio de contraseña obligatorio en el primer acceso.
- Redirección automática y protección de rutas según el rol.
- Páginas de Perfil, Configuración y Ayuda.

### Alumno (`/alumno/*`)
- **Cronómetro** para iniciar y finalizar jornadas. La hora de inicio se guarda en la base de datos, así que el cronómetro sobrevive a recargas y cambios de dispositivo.
- **Registro manual** de jornadas (fecha, hora de inicio, hora de fin y descripción). Pasa por la misma validación del jefe.
- **Progreso** hacia la meta: barra animada y estadísticas (horas del mes, promedio semanal, horas restantes y estatus "En Tiempo" / "Atrasado").
- Actividad reciente e historial completo de jornadas.
- Cancelación de jornadas pendientes.

### Jefe de servicio (`/jefe/*`)
- **Bandeja de validaciones**: aprobar o rechazar jornadas terminadas. El rechazo requiere comentario.
- Indicador visual de jornadas registradas manualmente.
- Lista de alumnos asignados con su progreso y vista de detalle por alumno.
- Exportación a Excel de sus alumnos e historial de jornadas.

### Administrador (`/admin/*`)
- **Usuarios**: alta, edición, activación y desactivación (bloqueada si el usuario tiene relaciones activas, mostrando el motivo) y reseteo de contraseña.
- **Asignaciones** alumno ↔ jefe por período, con reasignación y motivo de remoción.
- **Carreras**: catálogo institucional con facultad.
- **Períodos**: creación y cierre con candado (no se puede cerrar si quedan jornadas pendientes).
- **Reportes** con filtros por período, carrera, facultad, jefe, porcentaje y tipo de beca.
- Vista de **alumnos sin avance**.
- **Importación masiva por CSV** de alumnos, jefes y asignaciones, con vista previa antes de confirmar.
- Exportación a Excel de reportes y de alumnos sin avance.

### Tipos de beca
Académica, Excelencia, Deportiva, Cultural, Comercial, Liderazgo Social y **SEP**. La beca SEP se trata como servicio voluntario: su estatus muestra "Voluntario" en lugar de "Atrasado".

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, `output: "standalone"`) + React 19 + TypeScript estricto |
| Runtime | Node.js 22 LTS (mínimo 20.9) |
| UI | Tailwind CSS, Radix UI / shadcn, Material Symbols Outlined |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 5 |
| Autenticación | Auth.js v5 (Credentials + bcrypt, sesiones JWT) |
| Validación | Zod (formularios y Server Actions) |
| Formularios | react-hook-form |
| Estado cliente | Zustand (solo UI y cronómetro) |
| Notificaciones | sonner |
| Archivos | papaparse (CSV de entrada), exceljs (Excel de salida) |

---

## Arquitectura

```
Navegador
   │
   ▼
[Caddy / proxy de la plataforma]  ← HTTPS
   │
   ▼
Next.js (server.js standalone, puerto 3000)
   ├── Proxy ............. Auth.js: sesión, rol, cambio de contraseña obligatorio
   ├── Server Components . lectura de datos
   ├── Server Actions .... escritura con validación Zod   (src/actions/)
   └── Route Handlers .... /api/auth, /api/export/* (Excel)
   │
   ▼
PostgreSQL (Prisma)
```

- **Monolito**: no hay backend separado. Toda la lógica de negocio vive en `src/actions/` como Server Actions, que regresan `{ success, error?, data? }`.
- **La autenticación se divide en dos archivos**:
  - `src/lib/auth.config.ts` no usa Prisma; lo usa el proxy (`src/proxy.ts`).
  - `src/lib/auth.ts` agrega el proveedor Credentials con acceso a la base de datos.
- **Zona horaria**: las fechas de negocio se interpretan en `America/Mexico_City`. En producción se fija con la variable `TZ`, que ya viene definida en el `Dockerfile`.
- **No hay dependencias de red escritas en el código**: la base de datos y la URL pública se configuran solo por variables de entorno.

---

## Estructura del proyecto

```
├── prisma/
│   ├── schema.prisma        # Modelos: User, Career, Period, StudentProfile, Assignment, WorkSession
│   ├── seed.ts              # Datos de demostración (idempotente, no borra datos)
│   └── seed-carreras.ts     # Solo el catálogo de carreras
├── src/
│   ├── actions/             # Server Actions (lógica de negocio)
│   ├── app/
│   │   ├── (auth)/          # /login, /cambiar-password
│   │   ├── (dashboard)/     # alumno/, jefe/, admin/, perfil, configuracion, ayuda
│   │   └── api/             # auth y exportaciones a Excel
│   ├── components/          # admin/, jefe/, cronometro/, layout/, shared/
│   ├── lib/                 # db, auth, utilidades, validaciones Zod
│   ├── stores/              # Zustand
│   └── proxy.ts             # Protección de rutas (antes middleware.ts)
├── docs/design/             # Mockups y design system "Academic Curator"
├── Dockerfile               # Imagen multi-stage (deps → builder → runner)
├── docker-compose.yml       # db + app + caddy (+ seed opcional) para VPS
├── Caddyfile                # Proxy inverso para docker-compose
└── railway.json             # Configuración de despliegue en Railway
```

---

## Desarrollo local

Requisitos: **Node.js 22 LTS** (mínimo 20.9) y **PostgreSQL 16+**, ya sea instalado localmente o en Docker. Los comandos están escritos para PowerShell.

```powershell
# 1. Dependencias
npm install

# 2. Variables de entorno
Copy-Item .env.example .env
#    Edita .env: ajusta usuario/contraseña de DATABASE_URL y genera AUTH_SECRET (ver abajo)

# 3. Crear tablas (Prisma crea la base de datos si no existe)
npm run db:push

# 4. Cargar datos de demostración
npm run db:seed

# 5. Servidor de desarrollo → http://localhost:3000
npm run dev
```

**¿No tienes PostgreSQL local?** Levanta uno en Docker. Se usa el puerto 5433 para no chocar con una instalación local en el 5432:

```powershell
docker run --name scholar-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:16-alpine
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/servicio_becario?schema=public"
```

**Generar `AUTH_SECRET` en PowerShell** (no requiere openssl):

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

Otros scripts útiles:

| Comando | Uso |
|---|---|
| `npm run build` | Compilación de producción |
| `npx tsc --noEmit` | Verificación de tipos |
| `npm run db:studio` | Explorar la base de datos con Prisma Studio |

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL |
| `AUTH_SECRET` | Sí | Secreto para firmar las sesiones (32 bytes en base64) |
| `AUTH_URL` | En producción | URL pública de la app, p. ej. `https://mi-app.up.railway.app` |
| `TZ` | Ya definida en Docker | `America/Mexico_City`. En local se usa la zona horaria del sistema |
| `PORT` | No | Puerto del servidor (por defecto 3000) |

Plantillas disponibles: `.env.example` (local) y `.env.production.example` (docker-compose).

---

## Datos de demostración (seed)

`npm run db:seed` es **idempotente**: usa upserts y solo crea las jornadas de ejemplo si la asignación no tiene ninguna. Nunca borra datos.

- **Período activo calculado con la fecha actual**: "Enero - Julio AAAA" o "Agosto - Diciembre AAAA". Las jornadas de ejemplo tienen fechas de los últimos 30 días, así que la demo siempre se ve vigente.
- Catálogo de 19 carreras.
- 1 admin, 2 jefes y 5 alumnos con distintos porcentajes y tipos de beca, además de jornadas aprobadas, pendientes, rechazadas, canceladas y manuales.

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | `admin@anahuac.mx` | `Admin123!` |
| Jefe | `jefe1@anahuac.mx`, `jefe2@anahuac.mx` | `Jefe123!` |
| Alumno | `alumno1@anahuac.mx` … `alumno5@anahuac.mx` | `Alumno123!` |

Los jefes y alumnos deben cambiar su contraseña en el primer inicio de sesión. El admin no.

> ⚠️ Son credenciales públicas de demostración. Cámbialas o desactiva esos usuarios si el sistema se usa con datos reales.

---

## Despliegue en Railway

Railway compila el `Dockerfile` del repositorio y lo ejecuta junto a una base de datos PostgreSQL administrada. El archivo `railway.json` ya define:

- **Build**: el `Dockerfile` (imagen standalone con `TZ=America/Mexico_City`).
- **Arranque**: `prisma db push` (crea o actualiza las tablas) y después `node server.js`.

### Requisitos
- Una cuenta en [railway.com](https://railway.com) (puedes entrar con GitHub). El plan de prueba incluye crédito inicial; después, el plan Hobby cuesta alrededor de 5 USD al mes.
- Los cambios del proyecto subidos a GitHub (`git push`).

### Paso 1: Crear el proyecto y la base de datos
1. En Railway: **New Project → Deploy from GitHub repo** y elige `proyecto-servicio-becario`. Si es la primera vez, autoriza la app de Railway en GitHub.
2. Railway detecta `railway.json` y empieza a compilar. El primer intento **fallará al arrancar** porque aún no hay variables; es normal.
3. Dentro del proyecto: **+ Create → Database → PostgreSQL**. Se crea un servicio llamado `Postgres`.

### Paso 2: Variables del servicio de la app
En el servicio de la app, ve a **Variables** y agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia a la red privada de Railway) |
| `AUTH_SECRET` | Genéralo con el comando de PowerShell de la sección [Desarrollo local](#desarrollo-local) |
| `PORT` | `3000` |
| `AUTH_URL` | Se llena en el paso 3 |

### Paso 3: Dominio público
1. En el servicio de la app: **Settings → Networking → Generate Domain**. Usa el puerto **3000**.
2. Copia el dominio generado (p. ej. `https://proyecto-servicio-becario-production.up.railway.app`) y guárdalo como `AUTH_URL` en Variables, con `https://` y **sin** `/` al final.
3. Railway vuelve a desplegar automáticamente. En **Deployments → View logs** deberías ver que Prisma sincroniza el esquema y que Next.js arranca (`✓ Ready`).

### Paso 4: Cargar datos de demostración
El seed se ejecuta **desde tu máquina** contra la URL pública de la base de datos:

1. En el servicio **Postgres → Variables**, copia el valor **resuelto** de `DATABASE_PUBLIC_URL` con el ícono del ojo o el de copiar. Debe verse así: `postgresql://postgres:CONTRASEÑA@xxxx.proxy.rlwy.net:NNNNN/railway`.
   > ⚠️ No copies la plantilla `postgresql://${{PGUSER}}:${{PGPASSWORD}}@...`. Si la armas a mano, quita todas las llaves `${{ }}`.
2. En PowerShell, desde la carpeta del proyecto (con `npm install` ya hecho). Usa **comillas simples** para que PowerShell no interprete `$` ni `{}` dentro de la URL:

```powershell
$env:DATABASE_URL = 'PEGA_AQUI_DATABASE_PUBLIC_URL'
npx prisma db push --skip-generate   # idempotente; asegura que las tablas existan
npm run db:seed
Remove-Item Env:DATABASE_URL          # limpia la variable de la sesión
```

### Paso 5: Verificar
Abre el dominio y entra como `admin@anahuac.mx` / `Admin123!`. Para recorrer el flujo completo:

1. Inicia sesión como `alumno1` (te pedirá cambiar la contraseña) y registra una jornada manual.
2. Entra como `jefe1` y apruébala en **Validaciones**.
3. Vuelve como `alumno1` y comprueba que el progreso aumentó.

### Actualizaciones
Cada `git push` a `main` dispara un nuevo despliegue. Los cambios en `schema.prisma` se aplican solos al arrancar gracias a `prisma db push`.

### Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `Can't reach database server` en los logs | `DATABASE_URL` no apunta a `${{Postgres.DATABASE_URL}}`, o el servicio Postgres tiene otro nombre (ajusta la referencia) |
| Después de iniciar sesión redirige a `localhost` | `AUTH_URL` falta o es incorrecta |
| `MissingSecret` en los logs | Falta `AUTH_SECRET` |
| "Application failed to respond" | El puerto del dominio no coincide con `PORT` (ambos deben ser 3000) |
| Horas de jornadas manuales corridas 6 h | La imagen no se construyó con el `Dockerfile` (revisa que el builder sea `DOCKERFILE`) |

---

## Despliegue con Docker Compose (VPS)

Esta opción sirve para cualquier VM con Docker: Hetzner, DigitalOcean, Lightsail, OCI, etc. Levanta `db` (PostgreSQL), `app` (Next.js) y `caddy` (proxy inverso en el puerto 80/443).

```bash
cp .env.production.example .env.production   # edita contraseñas, AUTH_SECRET y AUTH_URL
docker compose --env-file .env.production up -d --build

# Seed de demostración (opcional, una sola vez)
docker compose --env-file .env.production --profile seed run --rm seed
```

Para tener HTTPS, apunta un dominio a la IP de la VM y reemplaza `:80` en el `Caddyfile` por ese dominio. Caddy obtiene el certificado de Let's Encrypt automáticamente.

---

## Reglas de negocio principales

1. Solo una jornada activa (cronómetro corriendo) por alumno.
2. Sin traslapes entre jornadas del mismo alumno (las canceladas no cuentan).
3. Duración mínima de **30 minutos** por jornada.
4. Descripción obligatoria de al menos 10 caracteres.
5. Solo el jefe con asignación activa hacia el alumno puede validar sus jornadas.
6. Las jornadas aprobadas suman minutos a `accumulatedMinutes` de la asignación. Las horas se calculan solo para mostrarlas.
7. Un período **no se puede cerrar** si tiene jornadas pendientes. Una vez cerrado, sus jornadas no se pueden crear ni modificar.
8. No se puede desactivar un usuario con relaciones activas en períodos abiertos.
9. La meta de horas se copia del porcentaje de beca al crear la asignación.

---

## Pendientes conocidos

- `npm run lint` (ESLint 9) reporta 5 errores de la regla `react-hooks/set-state-in-effect`, que llegó con las nuevas reglas de React. No afectan el funcionamiento ni bloquean el build; conviene refactorizar esos efectos más adelante.
- `next-auth` v5 sigue en beta (`5.0.0-beta.32`).
- No hay pruebas automatizadas.
- La zona horaria depende de la variable `TZ` del servidor. Para plataformas que no permiten definirla (p. ej. Vercel), habría que manejar `America/Mexico_City` explícitamente en el código.
