import type { AppointmentDisplay } from '../../services/appointments.ts'

type Props = {
  display: AppointmentDisplay
  title: string
  body: string
  demo: boolean
  demoBadge: string
}

export function ConfirmationBlock({ display, title, body, demo, demoBadge }: Props) {
  const confirmed = display === 'confirmed' || display === 'demo' || display === 'video_completed'
  if (!confirmed) return null

  return (
    <div id="post-agenda-confirmacion" className="pa-confirm" aria-live="polite">
      <p className="pa-confirm-kicker">Completado</p>
      <h2>{title}</h2>
      <p>{body}</p>
      {demo ? <p className="pa-confirm-demo">{demoBadge}</p> : null}
    </div>
  )
}
