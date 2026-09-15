import { randomBytes, randomUUID } from 'node:crypto'
import { calendlyService } from './calendly.service.ts'
import { env, formatInLaRioja, formatInLaRiojaRequired } from '../config/env.ts'
import { queryOne, type AppointmentRecord, type AppointmentStatus } from '../database/db.ts'

export type AppointmentDisplay = 'video_completed' | 'confirmed' | 'demo' | 'pending'

export type AppointmentPublicStatus = {
  publicReference: string
  status: AppointmentStatus
  videoCompleted: boolean
  display: AppointmentDisplay
  title: string
  body: string
  demo: boolean
}

function createPublicReference(): string {
  return randomBytes(18).toString('base64url')
}

function row(record: Record<string, unknown>): AppointmentRecord {
  return {
    id: String(record.id),
    public_reference: String(record.public_reference),
    lead_id: record.lead_id ? String(record.lead_id) : null,
    calendly_event_uri: record.calendly_event_uri ? String(record.calendly_event_uri) : null,
    calendly_invitee_uri: record.calendly_invitee_uri ? String(record.calendly_invitee_uri) : null,
    status: record.status as AppointmentStatus,
    scheduled_at: formatInLaRioja(record.scheduled_at as Date | string | null),
    video_completed_at: formatInLaRioja(record.video_completed_at as Date | string | null),
    confirmed_at: formatInLaRioja(record.confirmed_at as Date | string | null),
    canceled_at: formatInLaRioja(record.canceled_at as Date | string | null),
    created_at: formatInLaRiojaRequired(record.created_at as Date | string),
    updated_at: formatInLaRiojaRequired(record.updated_at as Date | string),
  }
}

export function getAppointmentConfig() {
  return {
    calendlyEnabled: calendlyService.isEnabled(),
    demoMode: env.POST_APPOINTMENT_DEMO,
  }
}

export async function getAppointmentByReference(publicReference: string): Promise<AppointmentRecord | null> {
  const found = await queryOne('SELECT * FROM appointments WHERE public_reference = $1 LIMIT 1', [publicReference])
  return found ? row(found) : null
}

async function insertAppointment(status: AppointmentStatus): Promise<AppointmentRecord> {
  const now = new Date()
  const inserted = await queryOne(
    `INSERT INTO appointments (
      id, public_reference, lead_id, calendly_event_uri, calendly_invitee_uri,
      status, scheduled_at, video_completed_at, confirmed_at, canceled_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [randomUUID(), createPublicReference(), null, null, null, status, null, null, null, null, now, now],
  )

  if (!inserted) {
    throw new Error('No se pudo crear la cita')
  }

  return row(inserted)
}

function toPublic(record: AppointmentRecord): AppointmentPublicStatus {
  const videoCompleted = Boolean(record.video_completed_at)
  const booking = calendlyService.resolveConfirmation(record)
  const demo = env.POST_APPOINTMENT_DEMO && videoCompleted && !booking.confirmed
  let display: AppointmentDisplay = 'pending'
  if (booking.confirmed) display = 'confirmed'
  else if (demo) display = 'demo'
  else if (videoCompleted) display = 'video_completed'

  const copy = confirmationCopy(display)
  return {
    publicReference: record.public_reference,
    status: record.status,
    videoCompleted,
    display,
    title: copy.title,
    body: copy.body,
    demo,
  }
}

export function confirmationCopy(display: AppointmentDisplay): { title: string; body: string } {
  if (display === 'confirmed' || display === 'demo') {
    return {
      title: '¡Tu llamada está confirmada!',
      body: 'Has completado correctamente el proceso. Revisa tu correo y asegúrate de estar disponible en el día y horario seleccionados.',
    }
  }
  if (display === 'video_completed') {
    return {
      title: '¡Video completado correctamente!',
      body: 'Hemos registrado que terminaste el video. El equipo validará los datos de tu llamada.',
    }
  }
  return {
    title: 'Tu llamada todavía no está confirmada',
    body: 'Para completar el proceso, mira el siguiente video hasta el final.',
  }
}

export async function getPublicAppointmentStatus(publicReference: string): Promise<AppointmentPublicStatus | null> {
  const record = await getAppointmentByReference(publicReference)
  return record ? toPublic(record) : null
}

export async function markVideoCompleted(publicReference?: string): Promise<AppointmentPublicStatus> {
  const now = new Date()
  let record = publicReference ? await getAppointmentByReference(publicReference) : null
  if (publicReference && !record) {
    throw Object.assign(new Error('Referencia no encontrada'), { status: 404 })
  }
  if (!record) {
    record = await insertAppointment('video_pending')
  }

  if (!record.video_completed_at) {
    const booking = calendlyService.resolveConfirmation(record)
    const nextStatus: AppointmentStatus = booking.confirmed ? 'confirmed' : 'video_completed'
    const updated = await queryOne(
      `UPDATE appointments
       SET status = $1, video_completed_at = $2, confirmed_at = COALESCE($3, confirmed_at), updated_at = $4
       WHERE id = $5
       RETURNING *`,
      [nextStatus, now, booking.confirmed ? now : null, now, record.id],
    )
    record = updated ? row(updated) : record
  }

  return toPublic(record)
}
