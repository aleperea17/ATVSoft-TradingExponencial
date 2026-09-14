# Auditoría general — Landings Trading Exponencial

Fecha: 14 sep 2026. Solo lectura y verificación contra código y runtime. No se modificó código de producto.

Fuentes de contexto contrastadas: `ENTREGA.md`, `cursor/ENTREGA.md`, `README.md`.

---

## Semáforo

| Superficie | Estado | Motivo |
| --- | --- | --- |
| VSL (`/`) | Verde | CTA a `/cuestionario`, UTM reales, sin `calendly.com`, SQLite + Excel protegido |
| Post-agenda (`/post-agenda`) | Amarillo | Anti-adelanto y confirmación OK; **la pausa de los videos FAQ no está bloqueada** (pedido de Lorena incompleto) |
| General | Amarillo | VSL lista para uso interno; falta video original, datos de prueba, store de sesión y el bloqueo de pausa FAQ antes de producción pública |

---

## 1. Rutas

### Frontend (recarga directa)

Vite escucha en `localhost` / `[::1]:5173` (no en `127.0.0.1`). Comando usado: `curl.exe` a `http://localhost:5173…`

| Ruta | HTTP | `id="root"` | Navegador |
| --- | --- | --- | --- |
| `/` | 200 `text/html` | sí | VSL con 3 CTA |
| `/cuestionario` | 200 | sí | Cuestionario (tras clic con UTM) |
| `/gracias` | 200 | sí | «¡Solicitud recibida correctamente!» |
| `/post-agenda` | 200 | sí | Título «Antes de tu llamada — Trading Exponencial» |
| `/admin/login` | 200 | sí | Formulario de acceso |
| `/admin/leads` | 200 HTML | sí | Sin sesión, React redirige a `/admin/login` (no es HTTP 401) |

Definición en `src/App.tsx` (líneas 20–31).

### Backend / API (`http://127.0.0.1:3001`)

| Endpoint | Resultado real |
| --- | --- |
| `GET /api/health` | 200 `{"ok":true}` |
| `GET /api/appointments/config` | 200 `{"calendlyEnabled":false,"demoMode":false}` |
| `POST /api/appointments/video-completed` `{}` | 200, crea cita y responde `display: video_completed` |
| `GET /api/appointments/no-existe/status` | 404 `Referencia no encontrada` |
| `GET /api/appointments/tdAbm2SoBoY53MIdfzcEMFFk/status` | 200 (referencia creada en esta auditoría) |
| `POST /api/leads` `{}` | 400 con errores Zod de todos los campos obligatorios (la ruta existe) |
| `GET /api/leads/export` | 401 `No autorizado` |
| `GET /api/admin/leads` | 401 |
| `GET /api/admin/me` | 401 |
| `GET /api/calendly/status` | 200 `{"enabled":false,"provider":"calendly"}` — API local, no Calendly |

### Fallback `index.html` de Express

En `server/app.ts` el fallback **solo corre si `NODE_ENV=production`**:

```46:55:server/app.ts
  if (env.isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next()
        return
      }
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }
```

Evidencia:

- `npm run dev` backend (`:3001`): `GET /` y `GET /cuestionario` → **404**. En desarrollo el SPA lo sirve Vite, no Express.
- `NODE_ENV=production PORT=3010 npm start`: las seis rutas frontend → **200** `text/html` con `<div id="root"></div>`. `GET /api/does-not-exist` → 404 (no se traga las API).

Discrepancia con el documento: no queda escrito que el fallback SPA es **solo producción**.

---

## 2. Landing VSL — pedido de Paula

### 2.1 Tres CTA → `/cuestionario`

Grep de `IngresarButton` (únicos usos de producto):

- `HeroCta` en `HeroSection.tsx` — «QUIERO INGRESAR» (después del video, `LandingPage.tsx` orden: Hero → Video → HeroCta)
- `BenefitsSection.tsx` — «Quiero Ingresar»
- `FinalCtaSection.tsx` — «QUIERO INGRESAR»

`IngresarButton` hace `Link to={withQuery('/cuestionario')}`.

Prueba en navegador, URL  
`http://localhost:5173/?utm_source=instagram&utm_medium=paid&utm_campaign=vsl&utm_content=cta1&utm_term=audit`:

```
count: 3
QUIERO INGRESAR → /cuestionario?utm_source=instagram&utm_medium=paid&utm_campaign=vsl&utm_content=cta1&utm_term=audit
Quiero Ingresar → (idéntico)
QUIERO INGRESAR → (idéntico)
calendly.com en el HTML: false
```

Clic en el primer CTA: la URL pasó a  
`/cuestionario?utm_source=instagram&utm_medium=paid&utm_campaign=vsl&utm_content=cta1&utm_term=audit`.

### 2.2 `calendly.com`

Grep en `src/`, `server/`, `dist/` (excluyendo `node_modules`): **cero URLs `calendly.com`**.

La única mención es un test negativo en `src/components/IngresarButton.test.tsx`.

Sí hay código **local** llamado «calendly»: adaptador stub (`server/services/calendly.service.ts`), ruta `GET /api/calendly/status`, columnas SQLite `calendly_event_uri`. Con `CALENDLY_ENABLED=false`, `isEnabled()` retorna false **antes** de cualquier token; `validateExistingBooking` / webhooks no hacen `fetch` a internet.

### 2.3 UTM

Implementado en `src/hooks/useUtmParams.ts` (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`). Confirmado en navegador (sección 2.1). El cuestionario los manda en `submitLead` (`useQuestionnaire.ts` + `QuestionnairePage.tsx`).

### 2.4 Cuestionario → SQLite, sin CRM externo

14 campos en `src/config/questionnaire.ts`: `fullName`, `email`, `whatsapp`, `country`, `city`, `experience`, `currentSituation`, `goal`, `mainProblem`, `capital`, `willingToInvest`, `preferredTime`, `comments`, `consent`.

Columnas reales de `leads` (PRAGMA):  
`id,created_at,full_name,email,whatsapp,country,city,experience,current_situation,goal,main_problem,capital,willing_to_invest,preferred_time,comments,consent,contact_status,source_url,referrer,user_agent,utm_source,utm_medium,utm_campaign,utm_content,utm_term`.

Flujo de envío: `submitLead` → `POST /api/leads` → `createLead` INSERT local. El frontend no llama ninguna API de CRM. Tras enviar, `getSchedulingStatus()` pega a `/api/calendly/status` (mismo backend); ambos ramas de `QuestionnairePage` navegan a `/gracias`.

### 2.5 Excel protegido

`GET /api/leads/export` usa `requireAdmin`. Curl sin cookie: 401.

`server/services/excel.service.ts` incluye los 14 datos de calificación (WhatsApp combinado, no columna `countryCode` suelta) más estado, origen y UTM. Hoja `Prospectos`.

---

## 3. Landing post-agenda — pedido de Lorena

### 3.1 Anti-adelanto

Implementado de verdad: `onTimeUpdate` + `onSeeking` + `clampSeek` en `GatedVideoPlayer.tsx` / `useGatedVideo.ts`. Test unitario `clampSeek(40, 12) === 12`.

Prueba en página viva (video de prueba 5.05 s): `currentTime = duration` → quedó en **0.28 s**, confirmación **no** apareció.

### 3.2 Confirmación solo al terminar

Carga inicial: `confirmacion` ausente, barra «Paso 1 de 2 pendiente». Seek al final no dispara confirmación.

El `ended` real llama `onEnded` → `POST /api/appointments/video-completed` → «¡Video completado correctamente!».

**Caminos extra (no son seek, sí aparecen sin un `ended` nuevo en esa visita):**

1. `GatedVideoPlayer`: si `localStorage` tiene `completed: true`, ejecuta `onEnded()` al montar.
2. Si la URL trae `?ref=` de una cita ya `video_completed`, `fetchAppointmentStatus` pinta confirmación al cargar.

Discrepancia: `ENTREGA.md` dice que el estado pendiente es «Tu llamada todavía no está confirmada» hasta `ended`. El UI actual **no muestra esa tarjeta** en pendiente; usa la cinta «Paso 1 de 2 pendiente». El texto viejo sigue en `postAgendaContent.pendingTitle` y en el backend `confirmationCopy('pending')`, pero `ConfirmationBlock` retorna `null` si `display === 'pending'`.

### 3.3 Videos FAQ: pausa

Controles nativos: `controls={false}` en todos los `<video>` (confirmado en runtime `nativeAll: true`). Overlay de play desaparece al iniciar.

Pedido original «que luego no lo pudieran pausar»: **incompleto**.

Tras play, `faq.pause()` dejó `paused: true`. No hay `onPause` que reanude, ni bloqueo de tecla espacio / API `pause()`. `pointer-events-none` solo evita clic sobre el video; no impide pausar por otros medios. El video principal **sí** tiene botón Pausa (correcto para el obligatorio).

### 3.4 `CALENDLY_ENABLED=false`

`.env` no define `POST_APPOINTMENT_DEMO` (queda false). API: `calendlyEnabled: false`.  
`CalendlyService.isEnabled()`: si el flag es false, return false inmediato. No hay `fetch` a `api.calendly.com`. Stubs `not_implemented` solo si el flag está true.

### 3.5 Responsive 1440 / 1024 / 768 / 390

Capturas ya generadas (no se regeneraron): `cursor/auditoria/ref-*.png` vs `local-*.png`. Revisión de 390: layout, titular, play 96 px y aviso coinciden con Lovable. Overflow 390 comprobado en auditoría previa (scrollWidth = innerWidth).

---

## 4. Seguridad y configuración

1. **Secretos `VITE_`:** cero coincidencias en `src/`, `server/`, `.env`, `.env.example`. Grep en `dist/` de `SESSION_SECRET`, `ADMIN_PASSWORD`, `CALENDLY_API`, `calendly.com`: vacío.
2. **`.gitignore` real:** `.env`, `data/`, `*.xlsx`, `*.xls`, `*.sqlite`. El repo local no tiene remoto git (no se pudo contrastar `git check-ignore` contra un origin).
3. **bcrypt:** `create-admin.ts` usa `bcrypt.hashSync(..., 12)`; login usa `bcrypt.compare` contra `ADMIN_PASSWORD_HASH`. El valor en `.env` está presente y el prefijo es `$2` (no texto plano). No se copia el hash aquí.
4. **401:** `/api/admin/*` y `/api/leads/export` → 401 sin sesión. Las rutas de **página** `/admin/*` responden 200 con el SPA y redirigen en cliente. No confundir con 401 HTTP.

Aviso al levantar producción local: `express-session` MemoryStore no es apto para VPS (lo imprimió Express en `:3010`).

---

## 5. Dato de prueba (no borrado)

SQLite `./data/leads.sqlite`: **2** prospectos.

Sigue el lead pedido:

- Nombre: `Auditoría QA Landing V1`
- WhatsApp: `+5491122233344`
- Email: `auditoria.qa.landingv1@example.test`
- id: `6ecad44f-40ff-4d83-9af3-0a95c457b135`
- created_at: `2026-09-14 13:55:57`

También hay `Ana Perez` / `+5491123456789`. Borrar ambos a mano antes de producción.

Hay **2** filas en `appointments` (una creada por el `POST /video-completed` de esta auditoría). No se eliminaron.

---

## 6. Build y tests (corridos de nuevo)

```
npm run test
  Test Files  7 passed (7)
  Tests  27 passed (27)
  Duration  8.53s

npm run build
  tsc -b && vite build
  ✓ built in 1.46s
```

El «16/16» de `ENTREGA.md` es histórico; la suite actual es 27/27 y se reconfirmó.

---

## Discrepancias documento vs código

| Documento | Código / runtime |
| --- | --- |
| Pendiente post-agenda: «Tu llamada todavía no está confirmada» | No se renderiza esa tarjeta; se usa «Paso 1 de 2 pendiente» |
| FAQ: «sin controles nativos» (implícito suficiente) | Sin controles nativos, **pero la pausa no está bloqueada** |
| Express sirve el SPA | Solo con `NODE_ENV=production`. En `npm run dev` Express da 404 a `/cuestionario` |
| `/admin/*` 401 | Cierto para `/api/admin/*`. Las páginas `/admin/*` son 200 + redirect JS |
| Cero Calendly | Cero `calendly.com`. Sí hay stub y `/api/calendly/status` local |
| Un lead de prueba QA | QA sigue; hay un segundo lead `Ana Perez` |

---

## Pendientes reales antes de producción

Más allá de video original, Calendly y servidor:

1. **Bloquear pausa de videos FAQ** si el pedido de Lorena sigue vigente (espacio, `video.pause()`, etc.).
2. Borrar a mano leads de prueba (`Auditoría QA Landing V1`, `Ana Perez`) y citas de prueba en `appointments`.
3. Reemplazar `public/assets/post-appointment/demo-main.mp4` por el MP4 original.
4. Store de sesión persistente (no MemoryStore); cookie `secure` + HTTPS; `DATABASE_PATH` en volumen que no se pise al deployar.
5. Nginx (o equivalente) delante, con fallback al `index.html` o usando `npm start` ya en producción.
6. Comparar VSL lado a lado con LeadConnector; abrir el Excel en Excel/LibreOffice.
7. Decidir si Vite debe escuchar también en `127.0.0.1` (hoy solo `::1`); irrelevante en VPS si se sirve `dist` por Express.
8. Opcional: alinear `ENTREGA.md` con el copy real de post-agenda.

No se conectó Calendly. No se cambió código de producto en esta pasada.
