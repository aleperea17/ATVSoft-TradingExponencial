# Landing VSL Trading Exponencial

Landing de calificación de **Trading Exponencial**, replicada a partir de la VSL original, con un cuestionario propio y registro de prospectos. Los botones **QUIERO INGRESAR** ya no envían a Calendly: llevan al cuestionario interno.

## 1. Objetivo

- Replicar la landing de la VSL.
- Calificar prospectos con un cuestionario configurable.
- Guardar cada envío en Postgres.
- Permitir al equipo comercial revisar, filtrar y exportar prospectos a Excel.
- Dejar preparada una capa de integración con Calendly, desactivada por ahora.

## 2. Tecnologías

- React 19, Vite, TypeScript, Tailwind CSS, React Router.
- Node.js, Express, Zod, `pg`, ExcelJS.
- Vitest y Supertest.
- Lucide React solo para iconos puntuales.

## 3. Requisitos previos

- Node.js 22 o superior (se recomienda 24).
- npm 11 o superior.
- Docker (servicio `postgres` vía Compose).

## 4. Instalación

```bash
cd landingv1
npm install
copy .env.example .env
```

En macOS o Linux usa `cp .env.example .env`.

Levantá Postgres (el override local publica `127.0.0.1:5432`):

```bash
docker compose up -d postgres
```

En el VPS, sin publicar el puerto:

```bash
docker compose -f docker-compose.yml up -d
```

## 5. Variables de entorno

Edita `.env`:

```
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
POSTGRES_USER=te_app
POSTGRES_PASSWORD=te_local_dev
POSTGRES_DB=trading_exponencial
DATABASE_URL=postgres://te_app:te_local_dev@127.0.0.1:5432/trading_exponencial
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
CALENDLY_ENABLED=false
CALENDLY_API_TOKEN=
CALENDLY_EVENT_TYPE_URI=
CALENDLY_WEBHOOK_SIGNING_KEY=
POST_APPOINTMENT_DEMO=false
```

Genera el secreto de sesión:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado en `SESSION_SECRET`.

Las variables vacías de Calendly no provocan error mientras `CALENDLY_ENABLED=false`.

## 6. Ejecución del frontend

```bash
npm run dev:frontend
```

Queda en `http://localhost:5173` y reenvía `/api` al backend.

## 7. Ejecución del backend

```bash
npm run dev:backend
```

Queda en `http://localhost:3001`.

Para levantar ambos a la vez:

```bash
npm run dev
```

## 8. Creación del administrador

```bash
npm run create-admin -- "una-contraseña-segura"
```

El comando imprime `ADMIN_PASSWORD_HASH=...`. Pégalo en `.env`. El correo del administrador es `ADMIN_EMAIL`.

No se almacenan contraseñas en texto plano: el hash usa bcrypt.

## 9. Postgres

La app usa `DATABASE_URL`. Compose levanta un contenedor `postgres` propio (`te_app` / `trading_exponencial`) con el volumen nombrado `te_pgdata`.

En desarrollo, `docker-compose.override.yml` publica **solo** `127.0.0.1:5432`. En el VPS no copies ese override (o usá `-f docker-compose.yml`) y conectá la app por la red interna `te_internal`.

Si queda un SQLite viejo con filas reales:

```bash
DATABASE_PATH=./data/leads.sqlite npm run import-sqlite
```

Si está vacío, no hace falta importar: levantá Postgres y listo.

### Advertencia de persistencia (VPS)

- Los datos viven en el volumen Docker `te_pgdata`, no en el directorio del clone.
- No publiques `5432` en `0.0.0.0`. Si Node corre en el host, bind a `127.0.0.1`.
- Hacé backups con `pg_dump`, no copies el directorio de data de Postgres en caliente.

## 10. Exportación a Excel

1. Entra a `http://localhost:5173/admin/leads`.
2. Inicia sesión.
3. Pulsa **Excel**.

También puedes llamar, autenticado:

```
GET /api/leads/export
```

El archivo se descarga como `prospectos-trading-exponencial.xlsx`, hoja `Prospectos`.

## 11. Compilación para producción

```bash
npm run build
```

Luego, con `NODE_ENV=production` y `FRONTEND_URL` apuntando al dominio real:

```bash
set NODE_ENV=production
npm start
```

En Linux:

```bash
NODE_ENV=production npm start
```

Express sirve el frontend compilado en `dist/` y las rutas `/api`. Recargar `/cuestionario`, `/gracias` o `/admin/leads` funciona porque las rutas desconocidas devuelven `index.html`.

## 12. Despliegue en un VPS

1. Instala Node.js 22+ y un proceso manager (`systemd` o PM2).
2. Clona el proyecto y ejecuta `npm install`.
3. Crea `.env` con valores de producción.
4. Ejecuta `npm run build`.
5. Inicia `npm start` (o `tsx server/server.ts`) en el puerto interno, por ejemplo `3001`.
6. Pon Nginx o Caddy delante para HTTPS.

Ejemplo de unidad systemd:

```
[Service]
WorkingDirectory=/var/www/landingv1
EnvironmentFile=/var/www/landingv1/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
```

## 13. Dominio y HTTPS

Ejemplo Nginx:

```
server {
  listen 443 ssl http2;
  server_name tudominio.com;
  ssl_certificate     /etc/letsencrypt/live/tudominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

En `.env` de producción:

```
FRONTEND_URL=https://tudominio.com
```

## 14. Copias de seguridad de la base

Usá `pg_dump` contra el contenedor (el archivo no debe vivir solo dentro de un release que se pisa):

```bash
mkdir -p /backups/leads
docker compose exec -T postgres pg_dump -U te_app trading_exponencial > "/backups/leads/leads-$(date +%F).sql"
```

En Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path backups | Out-Null
docker compose exec -T postgres pg_dump -U te_app trading_exponencial | Set-Content -Encoding utf8 "backups\leads-$(Get-Date -Format yyyy-MM-dd).sql"
```

Automatiza esta copia una vez al día.

## 15. Cómo conectar Calendly después

Hoy `CALENDLY_ENABLED=false`. El cuestionario y el guardado de prospectos no dependen de Calendly.

Cuando tengas credenciales:

1. Completa `CALENDLY_API_TOKEN`, `CALENDLY_EVENT_TYPE_URI` y `CALENDLY_WEBHOOK_SIGNING_KEY`.
2. Pon `CALENDLY_ENABLED=true`.
3. Implementa las llamadas reales en:
   - `server/services/calendly.service.ts`
   - `server/routes/calendly.routes.ts`
   - `src/services/scheduling.ts`
4. El token nunca debe ir al frontend ni en variables `VITE_`.

Hasta entonces no se muestra calendario ni se simulan horarios.

## 16. Landing post-agenda (`/post-agenda`)

Página que ve el prospecto después de agendar. No es un proyecto aparte.

- Ruta: http://localhost:5173/post-agenda
- El video principal no permite adelantar por la interfaz (barra y `seeking`). Se puede pausar, continuar y retroceder.
- La restricción no es infalible: alguien técnico puede saltársela. Impide el adelantamiento normal del navegador.
- El progreso se guarda en `localStorage` (`te-post-agenda:...`). Con Calendly conectado, la base será la fuente de verdad.
- Sin Calendly, al terminar el video se muestra «Video completado correctamente», nunca una reserva falsa.
- Modo demo visual (solo desarrollo): en `.env` pon `POST_APPOINTMENT_DEMO=true` y reinicia el backend. Entonces, al terminar, verás el diseño de «Tu llamada está confirmada» con la etiqueta de prueba. En producción el demo queda forzado a `false`.
- API: `GET /api/appointments/config`, `POST /api/appointments/video-completed`, `GET /api/appointments/:reference/status`. La referencia pública es aleatoria; el status no devuelve datos personales.
- Los videos originales están en Google Drive. Hoy `public/assets/post-appointment/demo-main.mp4` es un MP4 de prueba (HTML5) para poder controlar reproducción. Sustitúyelo por el video obligatorio y, si quieres, por un MP4 por cada FAQ conservando las rutas de `src/config/postAppointment.ts`. Los `driveId` de cada pieza están en ese archivo.

## 17. Recursos de la landing que deban proporcionarse

Las imágenes y el póster del VSL se descargaron desde los recursos originales autorizados y están en `public/assets/landing/`.

Si alguna imagen se ve cortada o desactualizada, reemplázala en esa carpeta conservando el nombre.

## Comandos

```bash
npm install
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm start
npm run test
npm run create-admin -- "tu-contraseña"
```

## Rutas

- `/` landing
- `/cuestionario` cuestionario
- `/gracias` confirmación
- `/post-agenda` landing posterior a una reserva
- `/admin/leads` panel privado
- `POST /api/leads` alta de prospecto
- `GET /api/leads/export` Excel (sesión admin)
- `POST /api/appointments/video-completed` registro de video terminado
- `GET /api/appointments/:reference/status` estado público de la reserva
