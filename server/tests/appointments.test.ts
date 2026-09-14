import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { env } from '../config/env.ts'
import { resetDbForTests } from '../database/db.ts'
import { confirmationCopy } from '../services/appointments.service.ts'

describe('API de appointments', () => {
  beforeEach(() => {
    resetDbForTests()
    env.POST_APPOINTMENT_DEMO = false
    env.CALENDLY_ENABLED = false
  })

  it('no confirma una reserva falsa cuando Calendly está desactivado', async () => {
    const app = createApp()
    const response = await request(app).post('/api/appointments/video-completed').send({})
    expect(response.status).toBe(200)
    expect(response.body.display).toBe('video_completed')
    expect(response.body.demo).toBe(false)
    expect(response.body.title).toMatch(/video completado/i)
    expect(response.body.title).not.toMatch(/llamada está confirmada/i)
    expect(response.body.email).toBeUndefined()
    expect(response.body.full_name).toBeUndefined()
  })

  it('evita registros duplicados para la misma referencia', async () => {
    const app = createApp()
    const first = await request(app).post('/api/appointments/video-completed').send({})
    const reference = first.body.publicReference as string
    const second = await request(app).post('/api/appointments/video-completed').send({ publicReference: reference })
    expect(second.status).toBe(200)
    expect(second.body.publicReference).toBe(reference)
    expect(second.body.videoCompleted).toBe(true)

    const status = await request(app).get(`/api/appointments/${reference}/status`)
    expect(status.status).toBe(200)
    expect(status.body.publicReference).toBe(reference)
    expect(JSON.stringify(status.body)).not.toMatch(/@/)
  })

  it('rechaza una referencia inexistente', async () => {
    const app = createApp()
    const response = await request(app)
      .post('/api/appointments/video-completed')
      .send({ publicReference: 'token-que-no-existe-123456' })
    expect(response.status).toBe(404)
  })

  it('permite el modo demo para la transición visual', async () => {
    env.POST_APPOINTMENT_DEMO = true
    const app = createApp()
    const response = await request(app).post('/api/appointments/video-completed').send({})
    expect(response.body.display).toBe('demo')
    expect(response.body.demo).toBe(true)
    expect(response.body.title).toMatch(/llamada está confirmada/i)
    env.POST_APPOINTMENT_DEMO = false
  })
})

describe('copys de confirmación', () => {
  it('distingue video completado, demo y reserva real', () => {
    expect(confirmationCopy('video_completed').title).toMatch(/video completado/i)
    expect(confirmationCopy('demo').title).toMatch(/llamada está confirmada/i)
    expect(confirmationCopy('confirmed').title).toMatch(/llamada está confirmada/i)
    expect(confirmationCopy('pending').title).toMatch(/todavía no está confirmada/i)
  })
})
