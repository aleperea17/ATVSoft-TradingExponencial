import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { videoCompletedSchema } from '../schemas/appointment.schema.ts'
import {
  getAppointmentConfig,
  getPublicAppointmentStatus,
  markVideoCompleted,
} from '../services/appointments.service.ts'

export function appointmentConfigHandler(_req: Request, res: Response): void {
  res.json(getAppointmentConfig())
}

export function appointmentStatusHandler(req: Request, res: Response): void {
  const reference = String(req.params.reference ?? '')
  const status = getPublicAppointmentStatus(reference)
  if (!status) {
    res.status(404).json({ error: 'Referencia no encontrada' })
    return
  }
  res.json(status)
}

export function videoCompletedHandler(req: Request, res: Response): void {
  const parsed = videoCompletedSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', fields: fieldErrors(parsed.error) })
    return
  }
  try {
    const result = markVideoCompleted(parsed.data.publicReference)
    res.json(result)
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500
    if (status === 404) {
      res.status(404).json({ error: 'Referencia no encontrada' })
      return
    }
    throw error
  }
}

function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!result[key]) result[key] = issue.message
  }
  return result
}
