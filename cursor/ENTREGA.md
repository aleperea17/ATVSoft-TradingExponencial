# Trading Exponencial — información del proyecto

Un solo proyecto (React + Express + SQLite). No hay otro repositorio ni otro backend. Calendly **no** está conectado (`CALENDLY_ENABLED=false`).

## Enlaces

| Qué | URL |
| --- | --- |
| Landing VSL (local) | http://localhost:5173/ |
| Cuestionario | http://localhost:5173/cuestionario |
| Gracias | http://localhost:5173/gracias |
| Post-agenda | http://localhost:5173/post-agenda |
| Panel admin | http://localhost:5173/admin/leads |
| API | http://localhost:3001 |
| Referencia VSL | https://sites.leadconnectorhq.com/preview/XAmlfwFioOEem757mdrU?notrack=true |
| Referencia post-agenda | https://pre-llamada-tradingexponencial.lovable.app |

## Arranque local

```bash
npm install
copy .env.example .env
npm run create-admin -- "tu-contraseña"
npm run dev
```

- Frontend: puerto 5173 (proxy `/api` → 3001)
- Backend: puerto 3001
- Node 22+ (recomendado 24)

```bash
npm run test
npm run build
npm start
```

## Variables de entorno

```
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
DATABASE_PATH=./data/leads.sqlite
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
CALENDLY_ENABLED=false
CALENDLY_API_TOKEN=
CALENDLY_EVENT_TYPE_URI=
CALENDLY_WEBHOOK_SIGNING_KEY=
POST_APPOINTMENT_DEMO=false
```

Las credenciales de Calendly pueden quedar vacías. No usar variables `VITE_` para secretos.

Modo demo de post-agenda: `POST_APPOINTMENT_DEMO=true` y reiniciar el backend. En producción queda forzado a `false`.

## Rutas

- `/` — landing VSL
- `/cuestionario` — cuestionario de calificación
- `/gracias` — solicitud recibida (no afirma llamada agendada)
- `/post-agenda` — landing después de agendar
- `/admin/login` — acceso al panel
- `/admin/leads` — prospectos
- `POST /api/leads` — alta de prospecto
- `GET /api/leads/export` — Excel (sesión admin)
- `GET /api/appointments/config` — Calendly on/off y demo
- `POST /api/appointments/video-completed` — video terminado (idempotente)
- `GET /api/appointments/:reference/status` — estado público, sin datos personales

---

## Landing VSL (`/`)

Fondo degradado violeta, Inter, CTA `#155eef`.

1. Hero + video Vimeo `1149336170`
2. CTA `QUIERO INGRESAR`
3. Testimonios YouTube (`jW7sA9tb-7o`, `waIG_OlJUAA`)
4. Problemas + lo único que necesitas
5. Beneficios (6) + CTA `Quiero Ingresar`
6. Bonus 10K
7. Resultados (8 capturas)
8. ¿Es para ti?
9. FAQ
10. CTA final
11. Footer legal

Los 3 CTA van a `/cuestionario` y conservan UTM. No hay enlaces activos a `calendly.com`.

Imágenes en `public/assets/landing/`.

---

## Cuestionario y panel

Preguntas en `src/config/questionnaire.ts`. Borrador en `localStorage` (`te-questionnaire-draft`). Se limpia tras un envío correcto.

Prospectos en SQLite: `./data/leads.sqlite` (misma base para todo). Excel al descargar: hoja `Prospectos`.

Admin: hash bcrypt, cookie `te.sid` httpOnly, `sameSite=lax`, `secure` en producción.

---

## Landing post-agenda (`/post-agenda`)

Fondo blanco, Inter + Barlow Condensed, acento `#1e4fff`.

### Inventario de la referencia Lovable

1. Cinta azul: instrucción obligatoria
2. Titular: *Si no miras este video vamos a cancelar tu llamada*
3. Video obligatorio (~5 min)
4. Pasos: agendaste (hecho) / mira el video (pendiente)
5. 6 dudas en video
6. Alumnos: Sebas, Héctor, Ana, Jonas
7. Perfiles 01–04
8. FAQ acordeón
9. Footer 2025

### Comportamiento del video principal

- HTML5 propio (`GatedVideoPlayer`). Pausar y continuar sí. Adelantar no. Retroceder sí.
- Sin velocidad, sin descarga, sin Picture-in-Picture.
- Confirmación solo con el evento real `ended`.
- Progreso en `localStorage` (`te-post-agenda:...`).
- La restricción evita el adelantamiento normal; no es infalible ante alguien técnico.

Estado inicial:

- *Tu llamada todavía no está confirmada*
- *Para completar el proceso, mira el siguiente video hasta el final.*

Al terminar, **sin Calendly**: *¡Video completado correctamente!* (no inventa una reserva).

Modo demo: diseño de *¡Tu llamada está confirmada!* con etiqueta *Reserva de prueba — no es una llamada real*.

Videos FAQ: play centrado, sin controles nativos, replay pequeño al terminar.

### Videos originales (hay que reemplazar el MP4 de prueba)

Hoy se usa `public/assets/post-appointment/demo-main.mp4` para poder controlar la reproducción. Sustituirlo por el archivo real.

| Pieza | Drive ID | Póster local |
| --- | --- | --- |
| Video obligatorio | `1M1ZTnAdY_IkkNcfbDrFwmcRO225HXDO2` | `poster-main.jpg` |
| FAQ 01 experiencia | `1u1U_rwaUSyUbzCuBLseWDiuOg5GM5bnn` | `faq-01.jpg` |
| FAQ 02 acompañamiento | `1fIBcXJTIKX6zIAGSwdbtPZW5tRg0Cgog` | `faq-02.jpg` |
| FAQ 03 resultados | `1tzejxmYMaEqNSPWYvycDSwqH88FTLnCq` | `faq-03.jpg` |
| FAQ 04 tiempo | `1kZEMJ7P8HO8bNdJVRhJpymdcKysNhiuM` | `faq-04.jpg` |
| FAQ 05 capital | `1Ma6eG2FiQRO4IOBjh1bFuhnff5W4LOOv` | `faq-05.jpg` |
| FAQ 06 señales vs sistema | `1vxTXgczxyyT6WvdJh1mgMvqSGOiIQ5sK` | `faq-06.jpg` |

Rutas de `src` en `src/config/postAppointment.ts`.

### Base `appointments` (misma SQLite)

Campos: `id`, `public_reference`, `lead_id`, URIs de Calendly (pueden ser NULL), `status`, fechas de agenda / video / confirmación / cancelación.

Estados: `pending`, `scheduled`, `video_pending`, `video_completed`, `confirmed`, `canceled`, `rescheduled`.

La referencia pública es aleatoria. El GET de status no expone email, nombre ni WhatsApp.

Cuando Calendly se conecte: validar reserva, relacionar prospecto, marcar video y confirmación, webhooks. Código preparado en `server/services/calendly.service.ts` (sin llamadas reales ahora).

---

## Calendly (después)

1. Completar token, event type URI y webhook signing key.
2. `CALENDLY_ENABLED=true`.
3. Implementar llamadas reales en:
   - `server/services/calendly.service.ts`
   - `server/routes/calendly.routes.ts`
   - `src/services/scheduling.ts`
4. El token nunca va al frontend.

---

## Persistencia en VPS

No guardar SQLite solo en una carpeta que se pisa al desplegar. Usar `DATABASE_PATH` absoluto en un volumen persistente. Backups con `.backup` / `VACUUM INTO` o proceso detenido. Permisos restringidos en `data/`.

---

## Comprobado

- `npm run test`: 27/27
- `npm run build`: OK (chunks separados; post-agenda y admin en lazy)
- VSL: 3 CTA con UTM, sin Calendly
- Post-agenda visible en local, overflow 390 px sin desborde
- API appointments: sin Calendly no confirma reserva falsa; duplicados idempotentes

## Pendiente manual

- Pegar los MP4 originales
- Comparar VSL lado a lado con LeadConnector
- Abrir Excel en Microsoft Excel / LibreOffice
- Login admin en el formulario del navegador
- Nginx, cookie `secure`, `DATABASE_PATH` persistente
