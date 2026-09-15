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
const isProduction = nodeEnv === 'production'

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

const postgresUser = read('POSTGRES_USER') || 'te_app'
const postgresPassword = read('POSTGRES_PASSWORD') || (isTest ? 'te_local_dev' : '')
const postgresDb = read('POSTGRES_DB') || 'trading_exponencial'
const postgresTestDb = read('POSTGRES_TEST_DB') || 'trading_exponencial_test'
const postgresHost = read('POSTGRES_HOST') || '127.0.0.1'
const postgresPort = read('POSTGRES_PORT') || '5432'

function buildDatabaseUrl(): string {
  const explicit = read('DATABASE_URL')
  const password = postgresPassword || 'te_local_dev'

  if (isTest) {
    if (explicit.includes(postgresTestDb)) return explicit
    return `postgres://${encodeURIComponent(postgresUser)}:${encodeURIComponent(password)}@${postgresHost}:${postgresPort}/${postgresTestDb}`
  }

  if (explicit) return explicit

  if (isProduction) {
    throw new Error('Falta la variable de entorno obligatoria: DATABASE_URL')
  }

  return `postgres://${encodeURIComponent(postgresUser)}:${encodeURIComponent(password)}@${postgresHost}:${postgresPort}/${postgresDb}`
}

export const env = {
  NODE_ENV: nodeEnv,
  isProduction,
  isTest,
  PORT: Number(read('PORT') || '3001'),
  FRONTEND_URL: requireValue('FRONTEND_URL', read('FRONTEND_URL') || (isTest ? 'http://localhost:5173' : '')),
  DATABASE_URL: buildDatabaseUrl(),
  DATABASE_PATH: read('DATABASE_PATH'),
  POSTGRES_USER: postgresUser,
  POSTGRES_PASSWORD: postgresPassword,
  POSTGRES_DB: postgresDb,
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

export function formatInLaRioja(value: Date | string | null | undefined): string | null {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

export function formatInLaRiojaRequired(value: Date | string): string {
  return formatInLaRioja(value) ?? ''
}

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
