import { Router } from 'express'
import { calendlyService } from '../services/calendly.service.ts'

export const calendlyRouter = Router()

calendlyRouter.get('/status', (_req, res) => {
  res.json(calendlyService.getPublicStatus())
})

/**
 * Futuros endpoints, todos del lado del servidor:
 * GET /availability  -> consulta de horarios reales
 * POST /bookings     -> creación o vinculación de reserva
 * POST /webhooks     -> confirmación firmada de Calendly
 * GET  /bookings/:id -> validar que una reserva existe
 */
