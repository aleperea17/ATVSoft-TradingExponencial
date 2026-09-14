import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { questionnaireFields, questionnaireSteps, STORAGE_KEY } from '../config/questionnaire.ts'
import { submitLead, type LeadPayload } from '../services/leads.ts'

export type Answers = {
  fullName: string
  email: string
  countryCode: string
  phone: string
  country: string
  city: string
  experience: string
  currentSituation: string
  goal: string
  mainProblem: string
  capital: string
  willingToInvest: string
  preferredTime: string
  comments: string
  consent: boolean
  website: string
}

const emptyAnswers: Answers = {
  fullName: '',
  email: '',
  countryCode: '+54',
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

function readDraft(): { step: number; answers: Answers } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { step?: number; answers?: Partial<Answers> }
    return {
      step: Number(parsed.step) || 0,
      answers: { ...emptyAnswers, ...parsed.answers },
    }
  } catch {
    return null
  }
}

function isFilled(answers: Answers): boolean {
  return Object.entries(answers).some(([key, value]) => {
    if (key === 'website' || key === 'countryCode') return false
    if (typeof value === 'boolean') return value
    return String(value).trim().length > 0
  })
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateField(id: string, answers: Answers): string | null {
  const field = questionnaireFields.find((item) => item.id === id)
  if (!field) return null
  if (id === 'whatsapp') {
    if (!answers.countryCode.trim()) return 'El código de país es obligatorio'
    if (!answers.phone.trim()) return 'El WhatsApp es obligatorio'
    if (!/^\d{6,15}$/.test(answers.phone.replace(/\D/g, ''))) return 'Ingresa un número de WhatsApp válido'
    return null
  }
  if (id === 'consent') {
    return answers.consent ? null : 'Debes aceptar el consentimiento para continuar'
  }
  const value = String(answers[id as keyof Answers] ?? '').trim()
  if (field.required && !value) return `${field.label} es obligatorio`
  if (id === 'email' && value && !emailRegex.test(value)) return 'Ingresa un correo válido'
  if (field.maxLength && value.length > field.maxLength) return 'El texto es demasiado largo'
  return null
}

export function useQuestionnaire() {
  const draft = readDraft()
  const [step, setStep] = useState(draft?.step ?? 0)
  const [answers, setAnswers] = useState<Answers>(draft?.answers ?? emptyAnswers)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const submittingRef = useRef(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (submittedRef.current) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers }))
  }, [step, answers])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (submittedRef.current || !isFilled(answers)) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [answers])

  const current = questionnaireSteps[step]
  const isLast = step === questionnaireSteps.length - 1

  const update = useCallback((patch: Partial<Answers>) => {
    setAnswers((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key]
      if ('phone' in patch || 'countryCode' in patch) delete next.whatsapp
      return next
    })
  }, [])

  const validateStep = useCallback(() => {
    const nextErrors: Record<string, string> = {}
    for (const fieldId of current.fields) {
      const message = validateField(fieldId, answers)
      if (message) nextErrors[fieldId] = message
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [answers, current.fields])

  const next = useCallback(() => {
    if (!validateStep()) return false
    setStep((value) => Math.min(value + 1, questionnaireSteps.length - 1))
    return true
  }, [validateStep])

  const prev = useCallback(() => {
    setErrors({})
    setStep((value) => Math.max(value - 1, 0))
  }, [])

  const submit = useCallback(
    async (meta: Omit<LeadPayload, keyof Answers> & Partial<Pick<LeadPayload, 'sourceUrl' | 'referrer' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent' | 'utmTerm'>>) => {
      if (submittingRef.current) return { ok: false as const }
      if (!validateStep()) return { ok: false as const }
      submittingRef.current = true
      setSubmitting(true)
      setSubmitError('')
      try {
        const payload: LeadPayload = {
          ...answers,
          website: answers.website,
          sourceUrl: meta.sourceUrl ?? '',
          referrer: meta.referrer ?? '',
          utmSource: meta.utmSource ?? '',
          utmMedium: meta.utmMedium ?? '',
          utmCampaign: meta.utmCampaign ?? '',
          utmContent: meta.utmContent ?? '',
          utmTerm: meta.utmTerm ?? '',
        }
        const result = await submitLead(payload)
        submittedRef.current = true
        localStorage.removeItem(STORAGE_KEY)
        return { ok: true as const, id: result.id }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar la solicitud')
        return { ok: false as const }
      } finally {
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [answers, validateStep],
  )

  const hasUnsaved = useMemo(() => !submittedRef.current && isFilled(answers), [answers])

  return {
    step,
    current,
    isLast,
    total: questionnaireSteps.length,
    answers,
    errors,
    submitting,
    submitError,
    hasUnsaved,
    update,
    next,
    prev,
    submit,
    validateField,
  }
}
