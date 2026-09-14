import { Router } from 'express'
import {
  getLeadHandler,
  listLeadsHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  updateLeadStatusHandler,
} from '../controllers/admin.controller.ts'
import { requireAdmin } from '../middleware/auth.ts'
import { adminLoginLimiter } from '../middleware/rateLimit.ts'

export const adminRouter = Router()

adminRouter.post('/login', adminLoginLimiter, loginHandler)
adminRouter.post('/logout', logoutHandler)
adminRouter.get('/me', requireAdmin, meHandler)
adminRouter.get('/leads', requireAdmin, listLeadsHandler)
adminRouter.get('/leads/:id', requireAdmin, getLeadHandler)
adminRouter.patch('/leads/:id', requireAdmin, updateLeadStatusHandler)
