import { DatabaseSync } from 'node:sqlite'
import { existsSync } from 'node:fs'
import { env, formatInLaRioja, resolveDatabasePath } from '../config/env.ts'
import { initDb, query, queryOne, toConsentFlag } from '../database/db.ts'

function parseStoredDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return value
  const raw = String(value)
  const iso = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const withOffset = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}-03:00`
  const date = new Date(withOffset)
  return Number.isNaN(date.getTime()) ? null : date
}

function requiredDate(value: unknown, fallback = new Date()): Date {
  return parseStoredDate(value) ?? fallback
}

const sqlitePath = resolveDatabasePath(env.DATABASE_PATH || './data/leads.sqlite')

if (!existsSync(sqlitePath) || sqlitePath === ':memory:') {
  console.log(`No hay SQLite para importar en ${sqlitePath}. Postgres queda vacío.`)
  process.exit(0)
}

const sqlite = new DatabaseSync(sqlitePath)
const leads = sqlite.prepare('SELECT * FROM leads').all() as Record<string, unknown>[]
const appointments = sqlite
  .prepare('SELECT * FROM appointments')
  .all() as Record<string, unknown>[]

if (leads.length === 0 && appointments.length === 0) {
  console.log('SQLite está vacío. No hay nada que migrar.')
  sqlite.close()
  process.exit(0)
}

await initDb()

let importedLeads = 0
for (const lead of leads) {
  const existing = await queryOne('SELECT id FROM leads WHERE id = $1', [lead.id])
  if (existing) continue
  await query(
    `INSERT INTO leads (
      id, created_at, full_name, email, whatsapp, country, city,
      experience, current_situation, goal, main_problem, capital,
      willing_to_invest, preferred_time, comments, consent, contact_status,
      source_url, referrer, user_agent, utm_source, utm_medium,
      utm_campaign, utm_content, utm_term
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23, $24, $25
    )`,
    [
      lead.id,
      requiredDate(lead.created_at),
      lead.full_name,
      lead.email,
      lead.whatsapp,
      lead.country,
      lead.city,
      lead.experience,
      lead.current_situation,
      lead.goal,
      lead.main_problem,
      lead.capital,
      lead.willing_to_invest,
      lead.preferred_time,
      lead.comments ?? '',
      toConsentFlag(lead.consent) === 1,
      lead.contact_status,
      lead.source_url ?? '',
      lead.referrer ?? '',
      lead.user_agent ?? '',
      lead.utm_source ?? '',
      lead.utm_medium ?? '',
      lead.utm_campaign ?? '',
      lead.utm_content ?? '',
      lead.utm_term ?? '',
    ],
  )
  importedLeads += 1
}

let importedAppointments = 0
for (const appointment of appointments) {
  const existing = await queryOne('SELECT id FROM appointments WHERE id = $1', [appointment.id])
  if (existing) continue
  await query(
    `INSERT INTO appointments (
      id, public_reference, lead_id, calendly_event_uri, calendly_invitee_uri,
      status, scheduled_at, video_completed_at, confirmed_at, canceled_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      appointment.id,
      appointment.public_reference,
      appointment.lead_id || null,
      appointment.calendly_event_uri || null,
      appointment.calendly_invitee_uri || null,
      appointment.status,
      parseStoredDate(appointment.scheduled_at),
      parseStoredDate(appointment.video_completed_at),
      parseStoredDate(appointment.confirmed_at),
      parseStoredDate(appointment.canceled_at),
      requiredDate(appointment.created_at),
      requiredDate(appointment.updated_at),
    ],
  )
  importedAppointments += 1
}

sqlite.close()

console.log(
  `Importación lista. Leads: ${importedLeads}/${leads.length}. Citas: ${importedAppointments}/${appointments.length}.`,
)
if (importedLeads > 0) {
  const sample = await queryOne<{ created_at: Date }>('SELECT created_at FROM leads ORDER BY created_at DESC LIMIT 1')
  console.log(`Última fecha importada (La Rioja): ${formatInLaRioja(sample?.created_at)}`)
}
