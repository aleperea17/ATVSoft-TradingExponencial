import { Router } from 'express'
import { createLeadHandler } from '../controllers/leads.controller.ts'
import { exportLeadsHandler } from '../controllers/admin.controller.ts'
import { requireAdmin } from '../middleware/auth.ts'
import { leadsWriteLimiter } from '../middleware/rateLimit.ts'

export const leadsRouter = Router()

leadsRouter.post('/', leadsWriteLimiter, createLeadHandler)
leadsRouter.get('/export', requireAdmin, exportLeadsHandler)
