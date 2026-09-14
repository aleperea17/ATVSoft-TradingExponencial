import { randomBytes, randomUUID } from 'node:crypto'
import { calendlyService } from './calendly.service.ts'
import { env } from '../config/env.ts'
import { getDb, type AppointmentRecord, type AppointmentStatus } from '../database/db.ts'
import { nowInLaRioja } from './leads.service.ts'

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
    scheduled_at: record.scheduled_at ? String(record.scheduled_at) : null,
    video_completed_at: record.video_completed_at ? String(record.video_completed_at) : null,
    confirmed_at: record.confirmed_at ? String(record.confirmed_at) : null,
    canceled_at: record.canceled_at ? String(record.canceled_at) : null,
    created_at: String(record.created_at),
    updated_at: String(record.updated_at),
  }
}

export function getAppointmentConfig() {
  return {
    calendlyEnabled: calendlyService.isEnabled(),
    demoMode: env.POST_APPOINTMENT_DEMO,
  }
}

export function getAppointmentByReference(publicReference: string): AppointmentRecord | null {
  const found = getDb()
    .prepare('SELECT * FROM appointments WHERE public_reference = ? LIMIT 1')
    .get(publicReference) as Record<string, unknown> | undefined
  return found ? row(found) : null
}

function insertAppointment(status: AppointmentStatus): AppointmentRecord {
  const db = getDb()
  const now = nowInLaRioja()
  const record: AppointmentRecord = {
    id: randomUUID(),
    public_reference: createPublicReference(),
    lead_id: null,
    calendly_event_uri: null,
    calendly_invitee_uri: null,
    status,
    scheduled_at: null,
    video_completed_at: null,
    confirmed_at: null,
    canceled_at: null,
    created_at: now,
    updated_at: now,
  }
  db.prepare(
    `INSERT INTO appointments (
      id, public_reference, lead_id, calendly_event_uri, calendly_invitee_uri,
      status, scheduled_at, video_completed_at, confirmed_at, canceled_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.public_reference,
    record.lead_id,
    record.calendly_event_uri,
    record.calendly_invitee_uri,
    record.status,
    record.scheduled_at,
    record.video_completed_at,
    record.confirmed_at,
    record.canceled_at,
    record.created_at,
    record.updated_at,
  )
  return record
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

export function getPublicAppointmentStatus(publicReference: string): AppointmentPublicStatus | null {
  const record = getAppointmentByReference(publicReference)
  return record ? toPublic(record) : null
}

export function markVideoCompleted(publicReference?: string): AppointmentPublicStatus {
  const now = nowInLaRioja()
  let record = publicReference ? getAppointmentByReference(publicReference) : null
  if (publicReference && !record) {
    throw Object.assign(new Error('Referencia no encontrada'), { status: 404 })
  }
  if (!record) {
    record = insertAppointment('video_pending')
  }

  if (!record.video_completed_at) {
    const booking = calendlyService.resolveConfirmation(record)
    const nextStatus: AppointmentStatus = booking.confirmed ? 'confirmed' : 'video_completed'
    getDb()
      .prepare(
        `UPDATE appointments
         SET status = ?, video_completed_at = ?, confirmed_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(nextStatus, now, booking.confirmed ? now : record.confirmed_at, now, record.id)
    record = getAppointmentByReference(record.public_reference) as AppointmentRecord
  }

  return toPublic(record)
}
