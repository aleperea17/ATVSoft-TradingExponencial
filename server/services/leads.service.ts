import { TIMEZONE } from '../config/env.ts'
import { createLeadId, getDb, type LeadRecord } from '../database/db.ts'
import type { LeadInput } from '../schemas/lead.schema.ts'

export function nowInLaRioja(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

export type CreateLeadParams = {
  input: LeadInput
  userAgent: string
}

export function createLead({ input, userAgent }: CreateLeadParams): LeadRecord {
  const db = getDb()
  const record: LeadRecord = {
    id: createLeadId(),
    created_at: nowInLaRioja(),
    full_name: input.fullName,
    email: input.email,
    whatsapp: input.whatsapp,
    country: input.country,
    city: input.city,
    experience: input.experience,
    current_situation: input.currentSituation,
    goal: input.goal,
    main_problem: input.mainProblem,
    capital: input.capital,
    willing_to_invest: input.willingToInvest,
    preferred_time: input.preferredTime,
    comments: input.comments,
    consent: 1,
    contact_status: 'Pendiente',
    source_url: input.sourceUrl,
    referrer: input.referrer,
    user_agent: userAgent.slice(0, 400),
    utm_source: input.utmSource,
    utm_medium: input.utmMedium,
    utm_campaign: input.utmCampaign,
    utm_content: input.utmContent,
    utm_term: input.utmTerm,
  }

  db.prepare(
    `INSERT INTO leads (
      id, created_at, full_name, email, whatsapp, country, city,
      experience, current_situation, goal, main_problem, capital,
      willing_to_invest, preferred_time, comments, consent, contact_status,
      source_url, referrer, user_agent, utm_source, utm_medium,
      utm_campaign, utm_content, utm_term
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.created_at,
    record.full_name,
    record.email,
    record.whatsapp,
    record.country,
    record.city,
    record.experience,
    record.current_situation,
    record.goal,
    record.main_problem,
    record.capital,
    record.willing_to_invest,
    record.preferred_time,
    record.comments,
    record.consent,
    record.contact_status,
    record.source_url,
    record.referrer,
    record.user_agent,
    record.utm_source,
    record.utm_medium,
    record.utm_campaign,
    record.utm_content,
    record.utm_term,
  )

  return record
}

export type LeadFilters = {
  search?: string
  status?: string
  sort?: 'asc' | 'desc'
}

function mapRow(row: Record<string, unknown>): LeadRecord {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
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
    consent: Number(row.consent),
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

export function listLeads(filters: LeadFilters = {}): LeadRecord[] {
  const db = getDb()
  const sort = filters.sort === 'asc' ? 'ASC' : 'DESC'
  const clauses: string[] = []
  const params: string[] = []

  if (filters.search) {
    clauses.push('(full_name LIKE ? OR email LIKE ? OR whatsapp LIKE ?)')
    const like = `%${filters.search}%`
    params.push(like, like, like)
  }
  if (filters.status) {
    clauses.push('contact_status = ?')
    params.push(filters.status)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db.prepare(`SELECT * FROM leads ${where} ORDER BY created_at ${sort}`).all(...params)
  return rows.map((row) => mapRow(row as Record<string, unknown>))
}

export function getLeadById(id: string): LeadRecord | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? mapRow(row) : null
}

export function updateLeadStatus(id: string, status: string): LeadRecord | null {
  const db = getDb()
  db.prepare('UPDATE leads SET contact_status = ? WHERE id = ?').run(status, id)
  return getLeadById(id)
}
