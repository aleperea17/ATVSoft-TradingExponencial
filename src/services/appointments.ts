export type AppointmentDisplay = 'pending' | 'video_completed' | 'confirmed' | 'demo'

export type AppointmentConfig = {
  calendlyEnabled: boolean
  demoMode: boolean
}

export type AppointmentStatusPayload = {
  publicReference: string
  status: string
  videoCompleted: boolean
  display: AppointmentDisplay
  title: string
  body: string
  demo: boolean
}

export async function fetchAppointmentConfig(): Promise<AppointmentConfig> {
  try {
    const response = await fetch('/api/appointments/config')
    if (!response.ok) return { calendlyEnabled: false, demoMode: false }
    return (await response.json()) as AppointmentConfig
  } catch {
    return { calendlyEnabled: false, demoMode: false }
  }
}

export async function fetchAppointmentStatus(reference: string): Promise<AppointmentStatusPayload | null> {
  const response = await fetch(`/api/appointments/${encodeURIComponent(reference)}/status`)
  if (response.status === 404) return null
  if (!response.ok) return null
  return (await response.json()) as AppointmentStatusPayload
}

export async function reportVideoCompleted(publicReference?: string): Promise<AppointmentStatusPayload> {
  const response = await fetch('/api/appointments/video-completed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(publicReference ? { publicReference } : {}),
  })
  if (!response.ok) {
    throw new Error('No se pudo registrar el video')
  }
  return (await response.json()) as AppointmentStatusPayload
}
