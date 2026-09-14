import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

dotenv.config()

const TRUTHY = new Set(['1', 'true', 'yes', 'on'])

function read(name: string): string {
  return process.env[name]?.trim() ?? ''
}

function requireValue(name: string, value: string): string {
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`)
  }
  return value
}

function parseBoolean(value: string): boolean {
  return TRUTHY.has(value.toLowerCase())
}

const nodeEnv = read('NODE_ENV') || 'development'
const isTest = nodeEnv === 'test'

const calendlyEnabledFlag = parseBoolean(read('CALENDLY_ENABLED'))
const calendlyApiToken = read('CALENDLY_API_TOKEN')
const calendlyEventTypeUri = read('CALENDLY_EVENT_TYPE_URI')
const calendlyWebhookSigningKey = read('CALENDLY_WEBHOOK_SIGNING_KEY')

if (calendlyEnabledFlag && (!calendlyApiToken || !calendlyEventTypeUri) && !isTest) {
  console.warn(
    'CALENDLY_ENABLED=true pero faltan CALENDLY_API_TOKEN o CALENDLY_EVENT_TYPE_URI. La agenda permanece desactivada.',
  )
}

const adminPasswordHash = read('ADMIN_PASSWORD_HASH')
if (!adminPasswordHash && !isTest) {
  throw new Error(
    'Falta ADMIN_PASSWORD_HASH. Genera uno con: npm run create-admin -- "tu-contraseña"',
  )
}

export const env = {
  NODE_ENV: nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest,
  PORT: Number(read('PORT') || '3001'),
  FRONTEND_URL: requireValue('FRONTEND_URL', read('FRONTEND_URL') || (isTest ? 'http://localhost:5173' : '')),
  DATABASE_PATH: read('DATABASE_PATH') || (isTest ? ':memory:' : './data/leads.sqlite'),
  ADMIN_EMAIL: requireValue('ADMIN_EMAIL', read('ADMIN_EMAIL') || (isTest ? 'admin@example.com' : '')),
  ADMIN_PASSWORD_HASH: adminPasswordHash || (isTest ? '$2a$10$invalidhashforunusableloginxxxxxxxxxxxxxx' : ''),
  SESSION_SECRET: requireValue(
    'SESSION_SECRET',
    read('SESSION_SECRET') || (isTest ? 'test-session-secret-not-for-production' : ''),
  ),
  CALENDLY_ENABLED: calendlyEnabledFlag,
  CALENDLY_API_TOKEN: calendlyApiToken,
  CALENDLY_EVENT_TYPE_URI: calendlyEventTypeUri,
  CALENDLY_WEBHOOK_SIGNING_KEY: calendlyWebhookSigningKey,
  POST_APPOINTMENT_DEMO: parseBoolean(read('POST_APPOINTMENT_DEMO')) && !((nodeEnv === 'production') && !isTest),
}

export const TIMEZONE = 'America/Argentina/La_Rioja'

export const CONTACT_STATUSES = [
  'Pendiente',
  'Contactado',
  'Calificado',
  'No calificado',
  'Cerrado',
  'Sin respuesta',
] as const

export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export function resolveDatabasePath(dbPath: string): string {
  if (dbPath === ':memory:') return dbPath
  const absolute = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)
  fs.mkdirSync(path.dirname(absolute), { recursive: true })
  return absolute
}

export function corsOrigins(): string[] {
  const origins = new Set<string>([env.FRONTEND_URL])
  try {
    const url = new URL(env.FRONTEND_URL)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      origins.add(`http://localhost:${url.port || '5173'}`)
      origins.add(`http://127.0.0.1:${url.port || '5173'}`)
    }
  } catch {
    /* ignore invalid URL, validated at boot */
  }
  return [...origins]
}
