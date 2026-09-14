import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.ts'

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.adminEmail) {
    next()
    return
  }
  res.status(401).json({ error: 'No autorizado' })
}

export function publicError(_err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  res.status(500).json({ error: 'No se pudo completar la solicitud. Inténtalo nuevamente.' })
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.isProduction,
  path: '/',
  maxAge: 1000 * 60 * 60 * 8,
}
