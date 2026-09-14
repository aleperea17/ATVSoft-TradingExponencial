# Entrega — Landing VSL Trading Exponencial

Réplica de la VSL de **Trading Exponencial** más la landing **post-agenda**, en un solo proyecto.

- `/` — VSL. CTA a `/cuestionario` (no Calendly).
- `/cuestionario` — calificación. SQLite compartida.
- `/gracias` — solicitud recibida.
- `/post-agenda` — página posterior a una reserva.
- `/admin/login` y `/admin/leads` — panel.

Calendly sigue desconectado (`CALENDLY_ENABLED=false`).

Referencia VSL: https://sites.leadconnectorhq.com/preview/XAmlfwFioOEem757mdrU?notrack=true  
Referencia post-agenda: https://pre-llamada-tradingexponencial.lovable.app

Instalación y VPS: `README.md`.

---

## Post-agenda

Fondo blanco, Inter + Barlow Condensed, acento `#1e4fff`.

1. Aviso obligatorio y video principal (no adelantar).
2. Estado: «Tu llamada todavía no está confirmada» hasta el evento `ended`.
3. Dudas frecuentes en video (play limpio, sin controles nativos).
4. Alumnos / método / FAQ acordeón / footer.

Sin Calendly, al terminar: «¡Video completado correctamente!».  
Modo demo (`POST_APPOINTMENT_DEMO=true`, no producción): muestra el diseño de llamada confirmada con etiqueta de prueba.

El MP4 actual es de prueba. Hay que reemplazar `public/assets/post-appointment/demo-main.mp4` por el video original (Drive). IDs en `src/config/postAppointment.ts`.

---

## Auditoría VSL (14 sep 2026)

`npm run test` 16/16 en su momento; hoy la suite completa es **27/27**. `npm run build` OK, chunks separados (post-agenda y admin en lazy).

Pendiente manual de la VSL: comparar LeadConnector lado a lado, Excel en Microsoft Excel, Nginx real.
