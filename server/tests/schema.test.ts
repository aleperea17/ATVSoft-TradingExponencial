import { describe, expect, it } from 'vitest'
import { leadInputSchema } from '../schemas/lead.schema.ts'

const validLead = {
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
  comments: '',
  consent: true as const,
  website: '',
  sourceUrl: 'http://localhost:5173/?utm_source=instagram',
  referrer: '',
  utmSource: 'instagram',
  utmMedium: 'paid',
  utmCampaign: 'vsl',
  utmContent: '',
  utmTerm: '',
}

describe('leadInputSchema', () => {
  it('acepta un prospecto válido y normaliza el WhatsApp', () => {
    const parsed = leadInputSchema.parse(validLead)
    expect(parsed.whatsapp).toBe('+5491123456789')
    expect(parsed.email).toBe('ana@example.com')
    expect(parsed.fullName).toBe('Ana Pérez')
  })

  it('rechaza email inválido', () => {
    const parsed = leadInputSchema.safeParse({ ...validLead, email: 'no-es-email' })
    expect(parsed.success).toBe(false)
  })

  it('rechaza consentimiento ausente', () => {
    const parsed = leadInputSchema.safeParse({ ...validLead, consent: false })
    expect(parsed.success).toBe(false)
  })

  it('rechaza honeypot completado', () => {
    const parsed = leadInputSchema.safeParse({ ...validLead, website: 'https://spam.test' })
    expect(parsed.success).toBe(false)
  })

  it('rechaza campos desconocidos', () => {
    const parsed = leadInputSchema.safeParse({ ...validLead, extra: 'no' })
    expect(parsed.success).toBe(false)
  })
})
