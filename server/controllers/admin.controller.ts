import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.ts'
import { loginSchema, leadStatusSchema } from '../schemas/lead.schema.ts'
import { getLeadById, listLeads, updateLeadStatus } from '../services/leads.service.ts'
import { buildLeadsWorkbook } from '../services/excel.service.ts'

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos de acceso inválidos' })
    return
  }

  const emailMatches = parsed.data.email.trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase()
  const passwordMatches = env.ADMIN_PASSWORD_HASH
    ? await bcrypt.compare(parsed.data.password, env.ADMIN_PASSWORD_HASH)
    : false

  if (!emailMatches || !passwordMatches) {
    res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    return
  }

  req.session.adminEmail = env.ADMIN_EMAIL
  res.json({ ok: true, email: env.ADMIN_EMAIL })
}

export function logoutHandler(req: Request, res: Response): void {
  req.session.destroy(() => {
    res.clearCookie('te.sid')
    res.json({ ok: true })
  })
}

export function meHandler(req: Request, res: Response): void {
  res.json({ email: req.session.adminEmail })
}

export async function listLeadsHandler(req: Request, res: Response): Promise<void> {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  const sort = req.query.sort === 'asc' ? 'asc' : 'desc'
  const leads = await listLeads({
    search: search || undefined,
    status: status || undefined,
    sort,
  })
  res.json({ leads })
}

export async function getLeadHandler(req: Request, res: Response): Promise<void> {
  const lead = await getLeadById(String(req.params.id ?? ''))
  if (!lead) {
    res.status(404).json({ error: 'Prospecto no encontrado' })
    return
  }
  res.json({ lead })
}

export async function updateLeadStatusHandler(req: Request, res: Response): Promise<void> {
  const parsed = leadStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }
  const lead = await updateLeadStatus(String(req.params.id ?? ''), parsed.data.contactStatus)
  if (!lead) {
    res.status(404).json({ error: 'Prospecto no encontrado' })
    return
  }
  res.json({ lead })
}

export async function exportLeadsHandler(_req: Request, res: Response): Promise<void> {
  const leads = await listLeads({ sort: 'desc' })
  const workbook = await buildLeadsWorkbook(leads)
  const buffer = await workbook.xlsx.writeBuffer()
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="prospectos-trading-exponencial.xlsx"')
  res.setHeader('Content-Length', String(buffer.byteLength))
  res.send(Buffer.from(buffer))
}
