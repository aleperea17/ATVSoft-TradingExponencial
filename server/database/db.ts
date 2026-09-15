import { randomUUID } from 'node:crypto'
import { Pool, type QueryResultRow } from 'pg'
import { CONTACT_STATUSES, env } from '../config/env.ts'

export const APPOINTMENT_STATUSES = [
  'pending',
  'scheduled',
  'video_pending',
  'video_completed',
  'confirmed',
  'canceled',
  'rescheduled',
] as const

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export type AppointmentRecord = {
  id: string
  public_reference: string
  lead_id: string | null
  calendly_event_uri: string | null
  calendly_invitee_uri: string | null
  status: AppointmentStatus
  scheduled_at: string | null
  video_completed_at: string | null
  confirmed_at: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export type LeadRecord = {
  id: string
  created_at: string
  full_name: string
  email: string
  whatsapp: string
  country: string
  city: string
  experience: string
  current_situation: string
  goal: string
  main_problem: string
  capital: string
  willing_to_invest: string
  preferred_time: string
  comments: string
  consent: number
  contact_status: string
  source_url: string
  referrer: string
  user_agent: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
}

const contactStatusSql = CONTACT_STATUSES.map((status) => `'${status.replaceAll("'", "''")}'`).join(', ')
const appointmentStatusSql = APPOINTMENT_STATUSES.map((status) => `'${status}'`).join(', ')

let pool: Pool | null = null
let migrated = false

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
    })
    pool.on('error', (error) => {
      console.error('Error inesperado en el pool de Postgres:', error.message)
    })
  }
  return pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params)
  return result.rows
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const rows = await query<T>(text, params)
  return rows[0]
}

export async function initDb(): Promise<Pool> {
  const current = getPool()
  if (!migrated) {
    try {
      await migrate()
      migrated = true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(
        `No se pudo conectar a Postgres (${message}). Levantá el servicio con: docker compose up -d postgres`,
      )
    }
  }
  return current
}

export async function resetDbForTests(): Promise<void> {
  await initDb()
  await query('TRUNCATE leads, appointments RESTART IDENTITY CASCADE')
}

async function migrate(): Promise<void> {
  const client = await getPool().connect()
  try {
    await client.query('SELECT pg_advisory_lock(871234)')
    await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      experience TEXT NOT NULL,
      current_situation TEXT NOT NULL,
      goal TEXT NOT NULL,
      main_problem TEXT NOT NULL,
      capital TEXT NOT NULL,
      willing_to_invest TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      comments TEXT NOT NULL DEFAULT '',
      consent BOOLEAN NOT NULL,
      contact_status TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      utm_source TEXT NOT NULL DEFAULT '',
      utm_medium TEXT NOT NULL DEFAULT '',
      utm_campaign TEXT NOT NULL DEFAULT '',
      utm_content TEXT NOT NULL DEFAULT '',
      utm_term TEXT NOT NULL DEFAULT '',
      CONSTRAINT leads_contact_status_check CHECK (contact_status IN (${contactStatusSql}))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY,
      public_reference TEXT NOT NULL UNIQUE,
      lead_id UUID,
      calendly_event_uri TEXT,
      calendly_invitee_uri TEXT,
      status TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ,
      video_completed_at TIMESTAMPTZ,
      confirmed_at TIMESTAMPTZ,
      canceled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      CONSTRAINT appointments_status_check CHECK (status IN (${appointmentStatusSql})),
      CONSTRAINT appointments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_contact_status ON leads (contact_status);
    CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments (lead_id);
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session (expire);
  `)
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(871234)')
    } finally {
      client.release()
    }
  }
}

export function createLeadId(): string {
  return randomUUID()
}

export function toConsentFlag(value: unknown): number {
  if (value === true || value === 1 || value === '1' || value === 't' || value === 'true') return 1
  return 0
}

export { CONTACT_STATUSES }
