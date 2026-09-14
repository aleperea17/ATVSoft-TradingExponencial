import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { leadInputSchema } from '../schemas/lead.schema.ts'
import { createLead } from '../services/leads.service.ts'
import { calendlyService } from '../services/calendly.service.ts'

function fieldErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!result[key]) result[key] = issue.message
  }
  return result
}

export function createLeadHandler(req: Request, res: Response): void {
  const parsed = leadInputSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Revisa los datos ingresados',
      fields: fieldErrors(parsed.error),
    })
    return
  }

  const lead = createLead({
    input: parsed.data,
    userAgent: String(req.get('user-agent') ?? '').slice(0, 400),
  })

  res.status(201).json({
    ok: true,
    id: lead.id,
    schedulingEnabled: calendlyService.isEnabled(),
  })
}
