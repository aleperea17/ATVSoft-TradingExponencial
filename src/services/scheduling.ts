export type SchedulingStatus = {
  enabled: boolean
  provider: string
}

export type AppointmentDisplay = 'pending' | 'video_completed' | 'confirmed' | 'demo'

/**
 * Capa de agenda del frontend. Nunca usa tokens de Calendly.
 * El estado real se consulta al backend; si está desactivada, no se muestra calendario.
 */
export async function getSchedulingStatus(): Promise<SchedulingStatus> {
  const response = await fetch('/api/calendly/status')
  if (!response.ok) {
    return { enabled: false, provider: 'calendly' }
  }
  return (await response.json()) as SchedulingStatus
}

export function shouldShowCalendar(status: SchedulingStatus): boolean {
  return status.enabled === true
}
