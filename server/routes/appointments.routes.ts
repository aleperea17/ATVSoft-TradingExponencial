import { Router } from 'express'
import {
  appointmentConfigHandler,
  appointmentStatusHandler,
  videoCompletedHandler,
} from '../controllers/appointments.controller.ts'
import { appointmentWriteLimiter } from '../middleware/rateLimit.ts'

export const appointmentsRouter = Router()

appointmentsRouter.get('/config', appointmentConfigHandler)
appointmentsRouter.get('/:reference/status', appointmentStatusHandler)
appointmentsRouter.post('/video-completed', appointmentWriteLimiter, videoCompletedHandler)
