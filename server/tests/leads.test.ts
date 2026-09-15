import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { resetDbForTests } from '../database/db.ts'

const payload = {
  fullName: 'Ana Pérez',
  email: 'ana@example.com',
  countryCode: '+54',
  phone: '91123456789',
  country: 'Argentina',
  city: 'La Rioja',
  experience: 'Menos de 6 meses.',
  currentSituation: 'Estoy aprendiendo.',
  goal: 'Volverme consistente',
  mainProblem: 'No tengo un sistema',
  capital: 'Entre USD 500 y USD 1.000.',
  willingToInvest: 'Sí.',
  preferredTime: 'Tarde.',
  comments: 'Quiero avanzar',
  consent: true,
  website: '',
  sourceUrl: 'http://localhost:5173/?utm_source=instagram&utm_medium=paid&utm_campaign=vsl',
  referrer: 'https://instagram.com',
  utmSource: 'instagram',
  utmMedium: 'paid',
  utmCampaign: 'vsl',
  utmContent: '',
  utmTerm: '',
}

describe('API de prospectos', () => {
  beforeEach(async () => {
    await resetDbForTests()
  })

  it('registra un prospecto válido', async () => {
    const app = await createApp()
    const response = await request(app).post('/api/leads').send(payload)
    expect(response.status).toBe(201)
    expect(response.body.ok).toBe(true)
    expect(response.body.id).toBeTruthy()
    expect(response.body.schedulingEnabled).toBe(false)
  })

  it('rechaza datos inválidos', async () => {
    const app = await createApp()
    const response = await request(app).post('/api/leads').send({ ...payload, email: 'mal' })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeTruthy()
  })

  it('protege la exportación Excel', async () => {
    const app = await createApp()
    const response = await request(app).get('/api/leads/export')
    expect(response.status).toBe(401)
  })

  it('genera un Excel autenticado con una fila por prospecto', async () => {
    const app = await createApp()
    await request(app).post('/api/leads').send(payload)
    await request(app).post('/api/leads').send({ ...payload, email: 'otra@example.com', phone: '91111111111' })

    const agent = request.agent(app)
    const login = await agent
      .post('/api/admin/login')
      .send({ email: 'admin@example.com', password: 'test-admin-password' })
    expect(login.status).toBe(200)

    const exported = await agent.get('/api/leads/export')
    expect(exported.status).toBe(200)
    expect(exported.headers['content-type']).toContain('spreadsheetml')
    expect(exported.headers['content-disposition']).toContain('prospectos-trading-exponencial.xlsx')
    const size = Number(exported.headers['content-length'] ?? 0)
    expect(size).toBeGreaterThan(100)
  })

  it('funciona con CALENDLY_ENABLED=false', async () => {
    const app = await createApp()
    const status = await request(app).get('/api/calendly/status')
    expect(status.body.enabled).toBe(false)
    const created = await request(app).post('/api/leads').send(payload)
    expect(created.status).toBe(201)
  })
})
