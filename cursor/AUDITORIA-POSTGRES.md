# Auditoría — Migrar SQLite → Postgres (Trading Exponencial)

Fecha: 14 sep 2026. **Solo lectura y research.** No se implementó nada.

Alcance: capa de datos actual, esquema real, particularidades SQLite, tests, Excel, sesiones admin, estimación y propuesta de `docker-compose.yml` (contenedor `postgres` propio en el VPS, mismo patrón ATV; no Neon ni servicio gestionado).

---

## Semáforo

| Superficie | Esfuerzo | Motivo |
| --- | --- | --- |
| Esquema (`leads` + `appointments`) | Bajo | 2 tablas, IDs UUID en app, SQL crudo acotado |
| Driver y servicios | Medio | Hoy es **`node:sqlite` síncrono**, no `better-sqlite3` ni ORM. Postgres implica `pg` asíncrono y ripple en controladores |
| Tests | Medio | 9 tests de API usan SQLite `:memory:`; Postgres no tiene equivalente nativo |
| ExcelJS | Bajo | Agnóstico del motor; sí depende del formato de `created_at` y de `consent` numérico |
| Sesiones admin | Bajo (si va en la misma pasada) | `MemoryStore` por defecto; no hay tabla de sesiones |

**Conclusión:** la migración es viable y acotada. El costo no está en el DDL ni en “traducir 80 queries”, sino en **cambiar de API síncrona a pool asíncrono** y en **cómo se resetea la base en tests**.

---

## 1. Capa de acceso a datos actual

### 1.1 Librería

No hay ORM (ni Prisma, ni Drizzle, ni Knex). No se usa `better-sqlite3` ni el paquete npm `sqlite3`.

| Pieza | Valor real |
| --- | --- |
| Driver | `node:sqlite` (`DatabaseSync`), built-in de Node 22+ |
| API | Síncrona: `exec`, `prepare().run()`, `prepare().get()`, `prepare().all()` |
| Singleton | `getDb()` en `server/database/db.ts` |
| Path | `DATABASE_PATH` → default `./data/leads.sqlite`; tests `:memory:` |
| Arranque | `PRAGMA journal_mode = WAL` + `PRAGMA foreign_keys = ON` + `migrate()` |
| Migraciones | Un único `CREATE TABLE IF NOT EXISTS` embebido. **No hay carpeta `migrations/` ni historial versionado** |

`createApp()` llama `getDb()` de forma síncrona al boot (`server/app.ts`). El proceso Node escribe directo al archivo; no hay contenedor de base hoy.

### 1.2 Archivos con SQL crudo

Solo **3 archivos** contienen SQL. El resto del backend consume funciones de servicio.

| Archivo | Statements | Rol |
| --- | --- | --- |
| `server/database/db.ts` | 2 `CREATE TABLE` + 2 `PRAGMA` | DDL / bootstrap |
| `server/services/leads.service.ts` | 4 | `INSERT`, `SELECT` (lista + por id), `UPDATE` estado |
| `server/services/appointments.service.ts` | 3 | `SELECT` por `public_reference`, `INSERT`, `UPDATE` video |

**Total: 7 queries de aplicación + DDL.** Placeholders actuales: `?` (estilo SQLite / `node:sqlite`).

No hay `json_extract`, `datetime()`, `strftime`, `IFNULL` ni otras funciones específicas de SQLite en el código.

### 1.3 Consumidores que no escriben SQL pero sí tocan la capa

Estos archivos **no tienen queries**, pero hay que tocarlos porque hoy los servicios son síncronos:

- `server/app.ts` — init de DB + `express-session`
- `server/config/env.ts` — `DATABASE_PATH` / `:memory:`
- `server/controllers/leads.controller.ts`
- `server/controllers/admin.controller.ts` (`listLeads`, `getLeadById`, `updateLeadStatus`, `exportLeadsHandler`)
- `server/controllers/appointments.controller.ts`
- `server/tests/setup-env.ts`
- `server/tests/leads.test.ts`
- `server/tests/appointments.test.ts`

El frontend (`src/services/admin.ts`) habla HTTP y no conoce SQLite.

### 1.4 Implicación del cambio de driver (el punto más caro)

`node:sqlite` es **síncrono**. `pg` / `postgres.js` son **asíncronos**. No existe un `DatabaseSync` equivalente oficial para Postgres.

Eso obliga a:

1. Reemplazar `getDb(): DatabaseSync` por un `Pool` (recomendado: `pg`).
2. Convertir `createLead`, `listLeads`, `getLeadById`, `updateLeadStatus`, `getAppointmentByReference`, `insertAppointment`, `markVideoCompleted` a `async`.
3. Convertir los handlers Express que los llaman a `async` (Express 5 lo soporta).
4. Convertir `resetDbForTests()` a `async` (TRUNCATE / DROP + migrate, o schema por test).
5. Hacer `createApp()` async o separar `await initDb()` en `server.ts` antes de `listen`.

No hace falta introducir Prisma/Drizzle para este volumen de SQL. Un wrapper fino (`query`, `queryOne`) sobre `pg` alcanza. Un ORM añadiría setup sin reducir las 7 queries.

---

## 2. Inventario del esquema actual

Fuente: `migrate()` en `server/database/db.ts` (único DDL). No hay migraciones incrementales ni índices extra.

### 2.1 Tabla `leads`

Clave primaria: `id` **TEXT** (UUID generado en app con `randomUUID()`, no `AUTOINCREMENT`).

| Columna | Tipo SQLite | Null / default | Origen en app |
| --- | --- | --- | --- |
| `id` | `TEXT` | `PRIMARY KEY` | `createLeadId()` → UUID |
| `created_at` | `TEXT` | `NOT NULL` | `nowInLaRioja()` → `'YYYY-MM-DD HH:mm:ss'` (tz `America/Argentina/La_Rioja`) |
| `full_name` | `TEXT` | `NOT NULL` | cuestionario |
| `email` | `TEXT` | `NOT NULL` | cuestionario |
| `whatsapp` | `TEXT` | `NOT NULL` | E.164 normalizado |
| `country` | `TEXT` | `NOT NULL` | cuestionario |
| `city` | `TEXT` | `NOT NULL` | cuestionario |
| `experience` | `TEXT` | `NOT NULL` | cuestionario |
| `current_situation` | `TEXT` | `NOT NULL` | cuestionario |
| `goal` | `TEXT` | `NOT NULL` | cuestionario |
| `main_problem` | `TEXT` | `NOT NULL` | cuestionario |
| `capital` | `TEXT` | `NOT NULL` | cuestionario |
| `willing_to_invest` | `TEXT` | `NOT NULL` | cuestionario |
| `preferred_time` | `TEXT` | `NOT NULL` | cuestionario |
| `comments` | `TEXT` | `NOT NULL DEFAULT ''` | cuestionario |
| `consent` | `INTEGER` | `NOT NULL` | siempre `1` al insertar |
| `contact_status` | `TEXT` | `NOT NULL` | default `'Pendiente'`; enum app: Pendiente, Contactado, Calificado, No calificado, Cerrado, Sin respuesta |
| `source_url` | `TEXT` | `NOT NULL DEFAULT ''` | UTM / URL |
| `referrer` | `TEXT` | `NOT NULL DEFAULT ''` | |
| `user_agent` | `TEXT` | `NOT NULL DEFAULT ''` | header, max 400 |
| `utm_source` | `TEXT` | `NOT NULL DEFAULT ''` | |
| `utm_medium` | `TEXT` | `NOT NULL DEFAULT ''` | |
| `utm_campaign` | `TEXT` | `NOT NULL DEFAULT ''` | |
| `utm_content` | `TEXT` | `NOT NULL DEFAULT ''` | |
| `utm_term` | `TEXT` | `NOT NULL DEFAULT ''` | |

Índices: solo PK. No hay índice en `email`, `created_at` ni `contact_status`.

### 2.2 Tabla `appointments`

Clave primaria: `id` **TEXT** (UUID en app). `public_reference` **TEXT UNIQUE** (18 bytes `base64url`).

| Columna | Tipo SQLite | Null / default | Notas |
| --- | --- | --- | --- |
| `id` | `TEXT` | `PRIMARY KEY` | UUID |
| `public_reference` | `TEXT` | `NOT NULL UNIQUE` | token público de `/post-agenda` |
| `lead_id` | `TEXT` | nullable | `FOREIGN KEY (lead_id) REFERENCES leads(id)` — hoy el insert pone `null` |
| `calendly_event_uri` | `TEXT` | nullable | stub / futuro Calendly |
| `calendly_invitee_uri` | `TEXT` | nullable | |
| `status` | `TEXT` | `NOT NULL` | enum app: pending, scheduled, video_pending, video_completed, confirmed, canceled, rescheduled |
| `scheduled_at` | `TEXT` | nullable | |
| `video_completed_at` | `TEXT` | nullable | escrito con `nowInLaRioja()` |
| `confirmed_at` | `TEXT` | nullable | |
| `canceled_at` | `TEXT` | nullable | |
| `created_at` | `TEXT` | `NOT NULL` | `nowInLaRioja()` |
| `updated_at` | `TEXT` | `NOT NULL` | `nowInLaRioja()` |

Índices: PK + UNIQUE de `public_reference`. No hay índice en `lead_id`.

### 2.3 Lo que **no** existe en DB

| Esperable | Estado |
| --- | --- |
| Tabla de sesiones admin | No. `express-session` usa **MemoryStore** en proceso |
| Tabla de usuarios admin | No. Email + hash bcrypt viven en `.env` |
| Tabla de FAQs / copy / CMS | No |
| Sesiones de video / `localStorage` | Solo cliente |
| Migraciones versionadas | No |
| Triggers / vistas / FTS | No |

### 2.4 Tipos TypeScript acoplados al esquema

`LeadRecord.consent` es `number`. `AppointmentRecord` y `LeadRecord` tipan todas las fechas como `string`. El admin frontend (`src/services/admin.ts`) espera `created_at: string` y `consent: number`. Cualquier cambio de tipo en el JSON de `/api/admin/leads` hay que mantenerlo compatible o adaptar el front.

---

## 3. Particularidades SQLite → Postgres

### 3.1 Traducción de tipos y DDL

| SQLite hoy | ¿Usado de forma específica? | Equivalente Postgres propuesto |
| --- | --- | --- |
| `id TEXT PRIMARY KEY` (UUID app) | Sí | `id UUID PRIMARY KEY` (sigue generando la app) o `TEXT`/`VARCHAR(36)` si se quiere dump 1:1 |
| `AUTOINCREMENT` / `rowid` | **No se usa** | No hace falta `SERIAL` / `IDENTITY` para estas tablas |
| `consent INTEGER` (0/1) | Sí | `consent BOOLEAN NOT NULL` |
| Fechas `TEXT` `'YYYY-MM-DD HH:mm:ss'` | Sí, escritas en app | `TIMESTAMPTZ NOT NULL` (o `TIMESTAMP` + `SET TIME ZONE 'America/Argentina/La_Rioja'`) |
| `comments TEXT DEFAULT ''` (y UTMs) | Sí | `TEXT NOT NULL DEFAULT ''` (igual) |
| `lead_id TEXT` + FK | Sí, nullable | `UUID REFERENCES leads(id) ON DELETE SET NULL` |
| `status TEXT` / `contact_status TEXT` | Validado en Zod/app | `TEXT` + `CHECK` o `CREATE TYPE` enum. Recomendación: `TEXT` + `CHECK` para no pelear con migraciones de enum |
| `PRAGMA journal_mode = WAL` | Sí | Eliminar. WAL de Postgres es interno |
| `PRAGMA foreign_keys = ON` | Sí | Eliminar. En Postgres las FK se respetan siempre |

**IDENTITY / SERIAL:** no aplica a `leads.id` ni `appointments.id`. Si más adelante se agrega tabla `session` de `connect-pg-simple`, esa tabla sí usa su propio esquema (típicamente `sid` texto, no serial de negocio).

### 3.2 Placeholders y API del driver

| SQLite / `node:sqlite` | Postgres / `pg` |
| --- | --- |
| `?` posicional | `$1, $2, …` |
| `stmt.run(a, b)` | `pool.query(sql, [a, b])` |
| `stmt.get(id)` | `const { rows } = await pool.query(...); rows[0]` |
| `stmt.all(...params)` | `rows` |
| `db.exec(ddl)` | `await pool.query(ddl)` |
| error síncrono | `try/catch` async; códigos `23505` (unique), `23503` (FK) |

El `LIKE` dinámico de búsqueda (`full_name LIKE ? OR email LIKE ? OR whatsapp LIKE ?`) se traduce a tres `$n` repetidos. El `ORDER BY created_at ASC|DESC` ya está whitelistado en JS (`sort === 'asc' ? 'ASC' : 'DESC'`); se puede dejar igual.

### 3.3 Fechas y zona horaria

Hoy **la app** formatea con `Intl` en `America/Argentina/La_Rioja` y guarda un string **sin offset**. Excel parsea eso así:

```ts
// excel.service.ts
value.replace(' ', 'T') + '-03:00'
```

El admin pinta `lead.created_at` crudo en la tabla.

Opciones al migrar (elegir una y documentarla):

1. **Recomendada:** columnas `TIMESTAMPTZ`, insertar `new Date()` / `NOW()`, y en `mapRow` serializar a `'YYYY-MM-DD HH:mm:ss'` en La Rioja. Excel y admin no cambian.
2. Seguir guardando texto (`TEXT`/`VARCHAR`) — migra fácil pero pierde el motivo de ir a Postgres.
3. Devolver ISO-8601 al front — rompe la celda admin y `parseLaRiojaDate` si no se toca Excel.

`node-pg` hidrata `timestamptz` como `Date`. **Hay que formatear en `mapRow`**; si se hace `String(row.created_at)` queda un string tipo JS (`Mon Sep 14 2026…`) y Excel/admin se rompen.

### 3.4 Booleanos

| Hoy | Postgres |
| --- | --- |
| `consent: 1` en insert | `true` |
| `Number(row.consent)` en `mapRow` | `row.consent === true` → seguir exportando `1`/`0` al JSON admin **o** cambiar `AdminLead.consent` a boolean |

Excel ya trata `lead.consent` como truthy (`'Sí'` / `'No'`). Si `mapRow` sigue entregando `0|1`, Excel no cambia.

### 3.5 `LIKE` y collation

SQLite: `LIKE` es **case-insensitive** para ASCII.  
Postgres: `LIKE` es **case-sensitive**.

La búsqueda admin (`full_name` / `email` / `whatsapp`) debe pasar a **`ILIKE`** (o `LOWER(col) LIKE LOWER($1)`). Sin esto, filtrar `ana` no encuentra `Ana Pérez`.

### 3.6 Funciones SQLite usadas vs no usadas

| Función / rasgo | ¿En el repo? | Acción |
| --- | --- | --- |
| `json_extract` / `json_each` | No | — |
| `datetime()` / `strftime()` | No | Las fechas las arma JS |
| `IFNULL` / `COALESCE` | No | — |
| `AUTOINCREMENT` | No | — |
| `rowid` | No | — |
| `LIMIT 1` | Sí | Igual en Postgres |
| Concatenación `\|\|` | No | — |
| `INSERT OR IGNORE` / `ON CONFLICT` | No | — |

### 3.7 Índices y constraints a agregar en el DDL nuevo (no existen hoy)

No son bloqueantes para traducir, pero conviene incluirlos en el primer schema Postgres:

- `CREATE INDEX idx_leads_created_at ON leads (created_at DESC);`
- `CREATE INDEX idx_leads_contact_status ON leads (contact_status);`
- `CREATE INDEX idx_appointments_lead_id ON appointments (lead_id);`
- `CHECK` de `contact_status` y `appointments.status` (mismos arrays que ya están en `env.ts` / `db.ts`).

### 3.8 Datos existentes (cutover)

El dump 1:1 de SQLite → Postgres es trivial (2 tablas, tipos texto). Pasos conceptuales, **no implementados**:

1. Exportar filas (`sqlite3 … .mode insert` o script one-shot).
2. Castear `consent` 0/1 → boolean.
3. Parsear `created_at` / `*_at` con offset `-03:00` (La Rioja no usa DST) → `timestamptz`.
4. Verificar FK: `appointments.lead_id` solo si apunta a un `leads.id` real (hoy suele ser `NULL`).

No hay otras tablas que migrar.

---

## 4. Tests

### 4.1 Conteo real

La auditoría general anterior documentó **27** tests. El árbol actual tiene **29** `it()` en 7 archivos (se sumaron casos de post-agenda / FAQ). De esos:

| Archivo | Tests | ¿Habla con SQLite? |
| --- | --- | --- |
| `server/tests/leads.test.ts` | 5 | Sí (`createApp` → `getDb`) |
| `server/tests/appointments.test.ts` | 4 de API + 1 de copy | Los 4 de API sí; `confirmationCopy` no |
| `server/tests/schema.test.ts` | 5 | No (Zod) |
| `src/hooks/useGatedVideo.test.ts` | 3 | No |
| `src/hooks/useQuestionnaire.test.ts` | 3 | No |
| `src/components/IngresarButton.test.tsx` | 3 | No |
| `src/pages/PostAppointmentPage.test.tsx` | 5 | No |

**9 tests de integración dependen de la DB.** El resto puede seguir igual.

### 4.2 Cómo corre SQLite hoy

`vite.config.ts` → `setupFiles: ['./server/tests/setup-env.ts']`:

```
NODE_ENV=test
DATABASE_PATH=:memory:
```

`env.ts` default en test también es `:memory:`.

`beforeEach` llama `resetDbForTests()`: cierra el `DatabaseSync` y pone el singleton en `null`. El siguiente `createApp()` → `getDb()` crea **otra** base vacía en memoria y vuelve a correr `migrate()`.

No hay archivo temporal en disco. No hay mocks de SQL. Supertest pega al `createApp()` real.

### 4.3 Qué hace falta para Postgres

`:memory:` **no existe** en Postgres. Opciones, de más simple a más “prod-like”:

| Estrategia | Pros | Contras | Recomendación |
| --- | --- | --- | --- |
| **A. Contenedor de test** (`docker compose` servicio `postgres` + `DATABASE_URL` de test, `TRUNCATE … RESTART IDENTITY CASCADE` o `DROP SCHEMA public CASCADE`) | Misma semántica que VPS | CI/local necesitan Docker; más lento que `:memory:` | **Default ATV** si el VPS y el equipo ya viven en Compose |
| **B. Schema por worker** (`test_${workerId}`) | Paralelo seguro | Más código de harness | Solo si se paraleliza Vitest |
| **C. PGlite** (`@electric-sql/pglite`) | Postgres embebido, sin Docker, cerca de `:memory:` | No es el binario oficial 16; alguna diferencia de extensión | Buena para laptops Windows sin Docker Desktop |
| **D. Mocks del repositorio** | Tests rápidos | No ejercitan SQL ni constraints | No para esta suite: los 9 tests **son** de persistencia |
| **E. Dual driver SQLite+PG** | Tests locales sin PG | Doble mantenimiento, mentira en CI | Evitar |

**Propuesta:** en implementación, `DATABASE_URL` obligatorio fuera de test; en test:

1. Si hay `DATABASE_URL` → Postgres real (Compose / CI service).
2. Harness: `beforeEach` → `TRUNCATE leads, appointments CASCADE` (y `session` si se agrega) + no cerrar el pool en cada test (solo truncar).
3. `resetDbForTests` deja de “cerrar archivo” y pasa a truncar.

Vitest hoy es `environment: 'node'` global; los tests de React marcan `/** @vitest-environment jsdom */` y no necesitan DB.

No hace falta mockear Excel en la migración: el test de export ya valida headers y tamaño, no el motor.

---

## 5. ExcelJS / export

`buildLeadsWorkbook(leads: LeadRecord[])` **no abre SQLite**. Recibe filas ya mapeadas.

Dependencias indirectas a revisar al cambiar tipos:

| Campo | Uso en Excel | Riesgo Postgres |
| --- | --- | --- |
| `created_at` | `parseLaRiojaDate` espera `'YYYY-MM-DD HH:mm:ss'` o ISO con `T` | Alto si `mapRow` hace `String(Date)` |
| `consent` | `lead.consent ? 'Sí' : 'No'` | Nulo si se mantiene `0/1` o boolean |
| Resto | strings de texto | Nulo |

**Veredicto:** el servicio de export es agnóstico del motor **si `LeadRecord` conserva el contrato actual** (fechas string La Rioja, consent numérico). Ese contrato debe vivir en `mapRow`, no en Excel.

---

## 6. Sesiones admin y si conviene Postgres en la misma pasada

### 6.1 Estado actual

`server/app.ts`:

```ts
session({
  name: 'te.sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: env.isProduction,
  cookie: sessionCookie, // httpOnly, sameSite lax, secure en prod, 8 h
})
```

Sin `store` → **MemoryStore** (default de `express-session`). Express ya lo advirtió en la auditoría previa al levantar producción local.

Login (`admin.controller.ts`): guarda solo `req.session.adminEmail`. No hay tabla de usuarios. `requireAdmin` mira esa propiedad. Cookie `te.sid`.

Implicaciones en VPS:

- Reinicio de Node = todos los admins deslogueados.
- Dos procesos / `tsx` + cluster = sesiones no compartidas.
- Memory leak conocido de MemoryStore si crece el tráfico (aquí el tráfico admin es bajo, pero el warning sigue siendo correcto).

### 6.2 Recomendación

**Sí: resolver el store en la misma pasada.** Motivos:

1. Ya se introduce `pg` + pool + `DATABASE_URL` + Compose. El costo extra es **una dependencia** (`connect-pg-simple`) y ~15 líneas en `app.ts`.
2. Es un pendiente explícito de producción (`cursor/AUDITORIA.md` § pendientes).
3. Evita un segundo deploy “tocamos de nuevo la capa de datos”.
4. La tabla `session` que crea `connect-pg-simple` vive en el **mismo** Postgres; no hace falta Redis para un solo admin.

Alternativas descartadas para esta pasada:

| Opción | Por qué no ahora |
| --- | --- |
| Redis / `connect-redis` | Otro contenedor sin beneficio con un usuario admin |
| JWT en cookie | Cambia el modelo de `/api/admin/me` y logout; más superficie |
| Dejar MemoryStore “un sprint más” | El VPS va a reiniciar Node en cada deploy |

Cuidados al implementarlo (para la fase de build, no ahora):

- Crear la tabla con `store.sync()` o DDL estático de `connect-pg-simple` **dentro de `migrate()`**.
- Incluir `session` en el `TRUNCATE` de tests (o usar MemoryStore **solo** cuando `env.isTest`, que es más simple y deja los 9 tests iguales).
- **Recomendación de tests:** MemoryStore en `NODE_ENV=test`; `connect-pg-simple` en development/production. Así no se acopla login/export a Postgres-sesión.
- Cookie `secure` + `proxy: true` detrás de Nginx/HTTPS (ya está el flag de production).
- No exponer `SESSION_SECRET` ni el password de Postgres en el compose committed.

---

## 7. Estimación de esfuerzo

### 7.1 Archivos a tocar (implementación futura)

| Grupo | Archivos | Complejidad |
| --- | --- | --- |
| Driver + schema | `server/database/db.ts` (reescritura) | Media |
| Env | `server/config/env.ts`, `.env.example` | Baja |
| SQL crudo | `leads.service.ts`, `appointments.service.ts` | Baja (pocas queries, async + `$n`) |
| HTTP | `app.ts`, `server.ts`, 3 controllers | Media (async boot) |
| Tests | `setup-env.ts`, `leads.test.ts`, `appointments.test.ts` | Media (harness PG o PGlite) |
| Sesión (si va) | `app.ts`, `package.json`, migrate | Baja |
| Ops | `docker-compose.yml` **nuevo**, README, `ENTREGA.md` | Baja |
| Excel / front | Solo si se cambia el contrato de `LeadRecord` | Evitable |
| Cutover | script one-shot de dump SQLite (si hay filas en el VPS) | Baja |

**Orden de magnitud:** ~12–16 archivos de producto + 2–3 de docs. **No** hay que tocar las 2 landings, el cuestionario, los players ni Calendly stubs.

### 7.2 Complejidad

- **Baja** en modelo de datos (2 tablas, sin joins reales en queries, sin FTS).
- **Media** en ingeniería: sync → async, fechas/`pg` `Date`, tests sin `:memory:`, Compose en Windows/VPS.
- **Baja** en riesgo de producto si `mapRow` congela el JSON actual.

Estimación de implementación (cuando se pida): **un tramo acotado de backend + ops**, no un rewrite. Un día sólido de desarrollo + verificación de tests/export/login suele alcanzar si se elige `pg` crudo + MemoryStore en test + `connect-pg-simple` en prod.

### 7.3 Lo que no conviene hacer en esa pasada

- Introducir Prisma/Drizzle “por si acaso”.
- Exponer `5432` a `0.0.0.0` en el VPS.
- Migrar admin a una tabla `users` (fuera de alcance; el hash sigue en `.env`).
- Dual-write SQLite+Postgres.

---

## 8. Propuesta de `docker-compose.yml`

Hoy **no existe** compose en el repo. Propuesta alineada al patrón ATV: contenedor `postgres` propio, credenciales del proyecto, volumen persistente, **sin publicar el puerto** en el VPS (la app Node habla por la red interna). En el PC de desarrollo se puede habilitar bind solo a localhost.

Variables nuevas previstas (nombres; no implementadas):

```
DATABASE_URL=postgres://te_app:${POSTGRES_PASSWORD}@postgres:5432/trading_exponencial
POSTGRES_PASSWORD=...   # solo compose / .env del VPS
POSTGRES_USER=te_app
POSTGRES_DB=trading_exponencial
```

`DATABASE_PATH` quedaría deprecado (o se acepta un tiempo como fallback de lectura para el script de cutover).

Estructura propuesta (ilustrativa):

```yaml
# docker-compose.yml — propuesta, no implementada
services:
  postgres:
    image: postgres:16-alpine
    container_name: te-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: te_app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: trading_exponencial
    volumes:
      - te_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U te_app -d trading_exponencial']
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - te_internal
    # VPS: no mapear ports.
    # Dev local opcional, solo loopback:
    # ports:
    #   - '127.0.0.1:5432:5432'

  # Cuando la app también viva en Compose (mismo estilo ATV):
  # app:
  #   build: .
  #   depends_on:
  #     postgres:
  #       condition: service_healthy
  #   environment:
  #     DATABASE_URL: postgres://te_app:${POSTGRES_PASSWORD}@postgres:5432/trading_exponencial
  #     NODE_ENV: production
  #   networks:
  #     - te_internal
  #   # ports: '127.0.0.1:3001:3001' detrás de Nginx, no 0.0.0.0:5432

volumes:
  te_pgdata:

networks:
  te_internal:
    driver: bridge
```

Notas de ops:

- Usuario/password/db **propios** (`te_app` / `trading_exponencial`), no `postgres/postgres`.
- Volumen con nombre (`te_pgdata`), no bind-mount del código, para que un deploy no pise datos (el problema que hoy tiene `./data/leads.sqlite` si el clone se reemplaza).
- Healthcheck obligatorio si la app espera a la DB.
- Backups: `pg_dump` a un directorio fuera del volume de deploy (reemplaza `sqlite3 .backup` del README).
- Imagen `16-alpine` (estable y liviana). Subir a 17 solo si el resto de ATV ya unificó esa major.
- No commitear `POSTGRES_PASSWORD`. El `.env` del VPS ya está en `.gitignore`.

Tests contra este servicio:

```
DATABASE_URL=postgres://te_app:…@127.0.0.1:5432/trading_exponencial_test
```

Una base `trading_exponencial_test` (o schema `test`) evita que Vitest trunque datos reales si alguien apunta mal al volume de prod. Crear esa DB en un `docker-compose.override.yml` de desarrollo, no en el compose de VPS.

---

## 9. Decisiones recomendadas para cuando se implemente

1. **Driver:** `pg` + `Pool`. SQL crudo, wrapper de 20 líneas. Sin ORM.
2. **IDs:** seguir generando UUID en la app; columnas `UUID`.
3. **Tiempo:** `TIMESTAMPTZ` + `mapRow` que formatea La Rioja, para no romper admin/Excel.
4. **Consent:** `BOOLEAN` en PG, `0|1` en el JSON (compat).
5. **Búsqueda:** `ILIKE`.
6. **DDL:** un `migrate()` al boot (mismo estilo) + `CHECK` e índices. Versionar después si el esquema crece.
7. **Tests:** Postgres de Compose en CI; MemoryStore de sesión en test; TRUNCATE de tablas de negocio.
8. **Sesiones:** `connect-pg-simple` en la misma pasada, solo fuera de test.
9. **Compose:** servicio `postgres` interno, volumen `te_pgdata`, sin `ports` públicos en VPS.
10. **Cutover:** script de una vez si el SQLite de prod tiene filas; si está vacío, solo levantar Postgres y apagar `DATABASE_PATH`.

---

## 10. Fuera de alcance de esta auditoría

- Implementación, dependencias nuevas, o compose real en el repo.
- Conexión a un cluster externo (Neon, RDS, etc.).
- Rediseño del login admin (tabla `users`, 2FA).
- Calendly real (sigue stub / `CALENDLY_ENABLED=false`).
