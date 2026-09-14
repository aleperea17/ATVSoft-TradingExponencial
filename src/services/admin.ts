export type AdminLead = {
  id: string
  created_at: string
  full_name: string
  email: string
  whatsapp: string
  country: string
  city: string
  experience: string
  current_situation: string
  goal: string
  main_problem: string
  capital: string
  willing_to_invest: string
  preferred_time: string
  comments: string
  consent: number
  contact_status: string
  source_url: string
  referrer: string
  user_agent: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
}

async function parseJson(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>
}

export async function adminLogin(email: string, password: string): Promise<void> {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJson(response)
  if (!response.ok) throw new Error(String(data.error || 'No se pudo iniciar sesión'))
}

export async function adminLogout(): Promise<void> {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const response = await fetch('/api/admin/me', { credentials: 'include' })
  if (!response.ok) return null
  return (await response.json()) as { email: string }
}

export async function fetchLeads(params: { search?: string; status?: string; sort?: string }): Promise<AdminLead[]> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.sort) query.set('sort', params.sort)
  const response = await fetch(`/api/admin/leads?${query.toString()}`, { credentials: 'include' })
  if (!response.ok) throw new Error('No se pudieron cargar los prospectos')
  const data = (await response.json()) as { leads: AdminLead[] }
  return data.leads
}

export async function updateLeadStatus(id: string, contactStatus: string): Promise<AdminLead> {
  const response = await fetch(`/api/admin/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ contactStatus }),
  })
  if (!response.ok) throw new Error('No se pudo actualizar el estado')
  const data = (await response.json()) as { lead: AdminLead }
  return data.lead
}

export async function downloadLeadsExcel(): Promise<void> {
  const response = await fetch('/api/leads/export', { credentials: 'include' })
  if (!response.ok) throw new Error('No se pudo descargar el archivo')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'prospectos-trading-exponencial.xlsx'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
