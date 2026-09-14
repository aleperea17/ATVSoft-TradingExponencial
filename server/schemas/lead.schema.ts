import { z } from 'zod'
import { CONTACT_STATUSES } from '../config/env.ts'
import { LEAD_LIMITS } from '../config/constants.ts'

const phoneRegex = /^\+[1-9]\d{7,14}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const requiredText = (max: number, message = 'Este campo es obligatorio') =>
  z
    .string({ error: message })
    .transform(clean)
    .refine((value) => value.length > 0, message)
    .refine((value) => value.length <= max, 'El texto es demasiado largo')

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => clean(value ?? ''))
    .refine((value) => value.length <= max, 'El texto es demasiado largo')

export const leadInputSchema = z
  .strictObject({
    fullName: requiredText(LEAD_LIMITS.fullName, 'El nombre es obligatorio'),
    email: z
      .string({ error: 'El correo es obligatorio' })
      .transform((value) => value.replace(/\s+/g, '').trim().toLowerCase())
      .refine((value) => value.length > 0, 'El correo es obligatorio')
      .refine((value) => value.length <= LEAD_LIMITS.email, 'El correo es demasiado largo')
      .refine((value) => emailRegex.test(value), 'Ingresa un correo válido'),
    countryCode: requiredText(LEAD_LIMITS.countryCode, 'El código de país es obligatorio'),
    phone: z
      .string({ error: 'El WhatsApp es obligatorio' })
      .transform((value) => value.replace(/[^\d]/g, ''))
      .refine((value) => value.length >= 6, 'Ingresa un número de WhatsApp válido')
      .refine((value) => value.length <= LEAD_LIMITS.phone, 'El número es demasiado largo'),
    country: requiredText(LEAD_LIMITS.country, 'El país es obligatorio'),
    city: requiredText(LEAD_LIMITS.city, 'La ciudad es obligatoria'),
    experience: requiredText(LEAD_LIMITS.experience),
    currentSituation: requiredText(LEAD_LIMITS.currentSituation),
    goal: requiredText(LEAD_LIMITS.goal),
    mainProblem: requiredText(LEAD_LIMITS.mainProblem),
    capital: requiredText(LEAD_LIMITS.capital),
    willingToInvest: requiredText(LEAD_LIMITS.willingToInvest),
    preferredTime: requiredText(LEAD_LIMITS.preferredTime),
    comments: optionalText(LEAD_LIMITS.comments),
    consent: z.literal(true, { error: 'Debes aceptar el consentimiento para continuar' }),
    website: z.string().optional(),
    sourceUrl: optionalText(LEAD_LIMITS.sourceUrl),
    referrer: optionalText(LEAD_LIMITS.referrer),
    utmSource: optionalText(LEAD_LIMITS.utm),
    utmMedium: optionalText(LEAD_LIMITS.utm),
    utmCampaign: optionalText(LEAD_LIMITS.utm),
    utmContent: optionalText(LEAD_LIMITS.utm),
    utmTerm: optionalText(LEAD_LIMITS.utm),
  })
  .superRefine((data, ctx) => {
    if (data.website && data.website.trim().length > 0) {
      ctx.addIssue({ code: 'custom', message: 'Solicitud inválida', path: ['website'] })
    }
    const countryDigits = data.countryCode.replace(/[^\d+]/g, '')
    const whatsapp = `${countryDigits.startsWith('+') ? countryDigits : `+${countryDigits}`}${data.phone}`
    if (!phoneRegex.test(whatsapp)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ingresa un WhatsApp válido con código de país',
        path: ['phone'],
      })
    }
  })
  .transform((data) => {
    const countryDigits = data.countryCode.replace(/[^\d+]/g, '')
    const whatsapp = `${countryDigits.startsWith('+') ? countryDigits : `+${countryDigits}`}${data.phone}`
    return { ...data, whatsapp }
  })

export type LeadInput = z.output<typeof leadInputSchema>

export const leadStatusSchema = z.strictObject({
  contactStatus: z.enum(CONTACT_STATUSES),
})

export const loginSchema = z.strictObject({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
})
