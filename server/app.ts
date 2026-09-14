import path from 'node:path'
import express from 'express'
import session from 'express-session'
import { env } from './config/env.ts'
import { applySecurity } from './middleware/security.ts'
import { publicError, sessionCookie } from './middleware/auth.ts'
import { leadsRouter } from './routes/leads.routes.ts'
import { adminRouter } from './routes/admin.routes.ts'
import { calendlyRouter } from './routes/calendly.routes.ts'
import { appointmentsRouter } from './routes/appointments.routes.ts'
import { getDb } from './database/db.ts'

declare module 'express-session' {
  interface SessionData {
    adminEmail?: string
  }
}

export function createApp() {
  getDb()
  const app = express()

  app.disable('x-powered-by')
  applySecurity(app)
  app.use(express.json({ limit: '32kb' }))
  app.use(
    session({
      name: 'te.sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      proxy: env.isProduction,
      cookie: sessionCookie,
    }),
  )

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/leads', leadsRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/calendly', calendlyRouter)
  app.use('/api/appointments', appointmentsRouter)

  if (env.isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next()
        return
      }
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use(publicError)
  return app
}
