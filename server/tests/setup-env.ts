import bcrypt from 'bcryptjs'

process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.PORT = process.env.PORT || '3001'
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.DATABASE_PATH = process.env.DATABASE_PATH || ':memory:'
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
process.env.ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('test-admin-password', 4)
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-not-for-production'
process.env.CALENDLY_ENABLED = process.env.CALENDLY_ENABLED || 'false'
process.env.POST_APPOINTMENT_DEMO = process.env.POST_APPOINTMENT_DEMO || 'false'
