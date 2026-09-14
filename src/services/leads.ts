export type LeadPayload = {
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
  sourceUrl: string
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
  utmTerm: string
}

export async function submitLead(payload: LeadPayload): Promise<{ ok: true; id: string }> {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string }
  if (!response.ok || !data.id) {
    throw new Error(data.error || 'No se pudo guardar la solicitud')
  }
  return { ok: true, id: data.id }
}
