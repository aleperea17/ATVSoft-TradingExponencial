import rateLimit from 'express-rate-limit'
import { env } from '../config/env.ts'

const skipInTest = () => env.isTest

export const leadsWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.' },
})

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Demasiados intentos de acceso. Espera unos minutos.' },
})

export const appointmentWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.' },
})
