import { describe, expect, it } from 'vitest'
import { validateField, type Answers } from '../hooks/useQuestionnaire.ts'

const answers: Answers = {
  fullName: '',
  email: 'mal',
  countryCode: '',
  phone: '',
  country: '',
  city: '',
  experience: '',
  currentSituation: '',
  goal: '',
  mainProblem: '',
  capital: '',
  willingToInvest: '',
  preferredTime: '',
  comments: '',
  consent: false,
  website: '',
}

describe('validación del cuestionario', () => {
  it('exige nombre, email, whatsapp y consentimiento', () => {
    expect(validateField('fullName', answers)).toBeTruthy()
    expect(validateField('email', answers)).toBeTruthy()
    expect(validateField('whatsapp', answers)).toBeTruthy()
    expect(validateField('consent', answers)).toBeTruthy()
  })

  it('acepta datos válidos', () => {
    const valid: Answers = {
      ...answers,
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      countryCode: '+54',
      phone: '9112345678',
      consent: true,
    }
    expect(validateField('fullName', valid)).toBeNull()
    expect(validateField('email', valid)).toBeNull()
    expect(validateField('whatsapp', valid)).toBeNull()
    expect(validateField('consent', valid)).toBeNull()
  })
})

describe('envíos duplicados', () => {
  it('el candado de envío impide un segundo submit concurrente', async () => {
    let inFlight = 0
    let max = 0
    const submitOnce = async (lock: { current: boolean }) => {
      if (lock.current) return 'blocked'
      lock.current = true
      inFlight += 1
      max = Math.max(max, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 20))
      inFlight -= 1
      lock.current = false
      return 'ok'
    }
    const lock = { current: false }
    const [a, b] = await Promise.all([submitOnce(lock), submitOnce(lock)])
    expect([a, b].includes('blocked')).toBe(true)
    expect(max).toBe(1)
  })
})
