import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { CONTACT_STATUSES, resolveDatabasePath } from '../config/env.ts'
import { env } from '../config/env.ts'

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

let db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(resolveDatabasePath(env.DATABASE_PATH))
    db.exec('PRAGMA journal_mode = WAL;')
    db.exec('PRAGMA foreign_keys = ON;')
    migrate(db)
  }
  return db
}

export function resetDbForTests(): void {
  if (db) {
    db.close()
    db = null
  }
}

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
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
      consent INTEGER NOT NULL,
      contact_status TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      utm_source TEXT NOT NULL DEFAULT '',
      utm_medium TEXT NOT NULL DEFAULT '',
      utm_campaign TEXT NOT NULL DEFAULT '',
      utm_content TEXT NOT NULL DEFAULT '',
      utm_term TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      public_reference TEXT NOT NULL UNIQUE,
      lead_id TEXT,
      calendly_event_uri TEXT,
      calendly_invitee_uri TEXT,
      status TEXT NOT NULL,
      scheduled_at TEXT,
      video_completed_at TEXT,
      confirmed_at TEXT,
      canceled_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );
  `)
}

export function createLeadId(): string {
  return randomUUID()
}

export { CONTACT_STATUSES }
