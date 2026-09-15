import bcrypt from 'bcryptjs'

process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.PORT = process.env.PORT || '3001'
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.POSTGRES_USER = process.env.POSTGRES_USER || 'te_app'
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'te_local_dev'
process.env.POSTGRES_DB = process.env.POSTGRES_DB || 'trading_exponencial'
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgres://te_app:te_local_dev@127.0.0.1:5432/trading_exponencial_test'
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
process.env.ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('test-admin-password', 4)
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-not-for-production'
process.env.CALENDLY_ENABLED = process.env.CALENDLY_ENABLED || 'false'
process.env.POST_APPOINTMENT_DEMO = process.env.POST_APPOINTMENT_DEMO || 'false'
