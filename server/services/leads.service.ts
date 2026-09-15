import { formatInLaRiojaRequired } from '../config/env.ts'
import { createLeadId, query, queryOne, toConsentFlag, type LeadRecord } from '../database/db.ts'
import type { LeadInput } from '../schemas/lead.schema.ts'

export function nowInLaRioja(): string {
  return formatInLaRiojaRequired(new Date())
}

export type CreateLeadParams = {
  input: LeadInput
  userAgent: string
}

function mapRow(row: Record<string, unknown>): LeadRecord {
  return {
    id: String(row.id),
    created_at: formatInLaRiojaRequired(row.created_at as Date | string),
    full_name: String(row.full_name),
    email: String(row.email),
    whatsapp: String(row.whatsapp),
    country: String(row.country),
    city: String(row.city),
    experience: String(row.experience),
    current_situation: String(row.current_situation),
    goal: String(row.goal),
    main_problem: String(row.main_problem),
    capital: String(row.capital),
    willing_to_invest: String(row.willing_to_invest),
    preferred_time: String(row.preferred_time),
    comments: String(row.comments ?? ''),
    consent: toConsentFlag(row.consent),
    contact_status: String(row.contact_status),
    source_url: String(row.source_url ?? ''),
    referrer: String(row.referrer ?? ''),
    user_agent: String(row.user_agent ?? ''),
    utm_source: String(row.utm_source ?? ''),
    utm_medium: String(row.utm_medium ?? ''),
    utm_campaign: String(row.utm_campaign ?? ''),
    utm_content: String(row.utm_content ?? ''),
    utm_term: String(row.utm_term ?? ''),
  }
}

export async function createLead({ input, userAgent }: CreateLeadParams): Promise<LeadRecord> {
  const id = createLeadId()
  const row = await queryOne(
    `INSERT INTO leads (
      id, created_at, full_name, email, whatsapp, country, city,
      experience, current_situation, goal, main_problem, capital,
      willing_to_invest, preferred_time, comments, consent, contact_status,
      source_url, referrer, user_agent, utm_source, utm_medium,
      utm_campaign, utm_content, utm_term
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23, $24, $25
    ) RETURNING *`,
    [
      id,
      new Date(),
      input.fullName,
      input.email,
      input.whatsapp,
      input.country,
      input.city,
      input.experience,
      input.currentSituation,
      input.goal,
      input.mainProblem,
      input.capital,
      input.willingToInvest,
      input.preferredTime,
      input.comments,
      true,
      'Pendiente',
      input.sourceUrl,
      input.referrer,
      userAgent.slice(0, 400),
      input.utmSource,
      input.utmMedium,
      input.utmCampaign,
      input.utmContent,
      input.utmTerm,
    ],
  )

  if (!row) {
    throw new Error('No se pudo guardar el prospecto')
  }

  return mapRow(row)
}

export type LeadFilters = {
  search?: string
  status?: string
  sort?: 'asc' | 'desc'
}

export async function listLeads(filters: LeadFilters = {}): Promise<LeadRecord[]> {
  const sort = filters.sort === 'asc' ? 'ASC' : 'DESC'
  const clauses: string[] = []
  const params: unknown[] = []

  if (filters.search) {
    const like = `%${filters.search}%`
    params.push(like, like, like)
    clauses.push(
      `(full_name ILIKE $${params.length - 2} OR email ILIKE $${params.length - 1} OR whatsapp ILIKE $${params.length})`,
    )
  }
  if (filters.status) {
    params.push(filters.status)
    clauses.push(`contact_status = $${params.length}`)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = await query(`SELECT * FROM leads ${where} ORDER BY created_at ${sort}`, params)
  return rows.map((row) => mapRow(row))
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  const row = await queryOne('SELECT * FROM leads WHERE id = $1', [id])
  return row ? mapRow(row) : null
}

export async function updateLeadStatus(id: string, status: string): Promise<LeadRecord | null> {
  const row = await queryOne('UPDATE leads SET contact_status = $1 WHERE id = $2 RETURNING *', [status, id])
  return row ? mapRow(row) : null
}
