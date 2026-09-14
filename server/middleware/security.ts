import helmet from 'helmet'
import cors from 'cors'
import type { Express } from 'express'
import { corsOrigins, env } from '../config/env.ts'

export function applySecurity(app: Express): void {
  // Solo en producción, detrás de un proxy (Nginx). En local evita falsos positivos de IP.
  app.set('trust proxy', env.isProduction ? 1 : false)
  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:', 'https://i.vimeocdn.com', 'https://i.ytimg.com', 'https://img.youtube.com'],
              frameSrc: [
                "'self'",
                'https://player.vimeo.com',
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
              ],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  )

  app.use(
    cors({
      origin: corsOrigins(),
      credentials: true,
    }),
  )
}
