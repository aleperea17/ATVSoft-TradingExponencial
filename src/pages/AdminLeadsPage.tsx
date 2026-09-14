import { useEffect, useMemo, useState } from 'react'
import { Download, LogOut, Search } from 'lucide-react'
import { CONTACT_STATUSES } from '../config/status.ts'
import {
  adminLogout,
  downloadLeadsExcel,
  fetchLeads,
  updateLeadStatus,
  type AdminLead,
} from '../services/admin.ts'

const STATUSES = [...CONTACT_STATUSES]

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const [selected, setSelected] = useState<AdminLead | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchLeads({ search, status, sort })
      setLeads(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load()
    }, 200)
    return () => window.clearTimeout(timeout)
  }, [search, status, sort])

  const selectedView = useMemo(() => selected, [selected])

  async function onStatusChange(id: string, contactStatus: string) {
    const updated = await updateLeadStatus(id, contactStatus)
    setLeads((prev) => prev.map((lead) => (lead.id === id ? updated : lead)))
    if (selected?.id === id) setSelected(updated)
  }

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-8 text-white">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-highlight">TRADING EXPONENCIAL</p>
            <h1 className="text-3xl font-bold">Prospectos</h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => downloadLeadsExcel()}
              className="inline-flex items-center gap-2 rounded-xl bg-cobalt px-4 py-2 font-bold"
            >
              <Download className="size-4" /> Excel
            </button>
            <button
              type="button"
              onClick={async () => {
                await adminLogout()
                window.location.href = '/admin/leads'
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2"
            >
              <LogOut className="size-4" /> Salir
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <label className="relative block">
            <Search className="absolute left-3 top-3.5 size-4 text-muted" />
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-10 pr-3"
              placeholder="Buscar por nombre, email o WhatsApp"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-3"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((item) => (
              <option key={item} value={item} className="text-black">
                {item}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-3"
            value={sort}
            onChange={(event) => setSort(event.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Más recientes</option>
            <option value="asc">Más antiguos</option>
          </select>
        </div>

        {error ? <p className="mt-4 text-danger">{error}</p> : null}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>
                    Cargando...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>
                    No hay prospectos todavía.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-white/10">
                    <td className="px-4 py-3 whitespace-nowrap">{lead.created_at}</td>
                    <td className="px-4 py-3">{lead.full_name}</td>
                    <td className="px-4 py-3">{lead.email}</td>
                    <td className="px-4 py-3">{lead.whatsapp}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-white/15 bg-black/40 px-2 py-1"
                        value={lead.contact_status}
                        onChange={(event) => void onStatusChange(lead.id, event.target.value)}
                      >
                        {STATUSES.map((item) => (
                          <option key={item} value={item} className="text-black">
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" className="underline" onClick={() => setSelected(lead)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedView ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#101022] p-6">
            <h2 className="text-2xl font-bold">{selectedView.full_name}</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {Object.entries({
                Fecha: selectedView.created_at,
                Email: selectedView.email,
                WhatsApp: selectedView.whatsapp,
                País: selectedView.country,
                Ciudad: selectedView.city,
                Experiencia: selectedView.experience,
                Situación: selectedView.current_situation,
                Objetivo: selectedView.goal,
                Problema: selectedView.main_problem,
                Capital: selectedView.capital,
                Inversión: selectedView.willing_to_invest,
                Horario: selectedView.preferred_time,
                Comentarios: selectedView.comments || '—',
                Consentimiento: selectedView.consent ? 'Sí' : 'No',
                Estado: selectedView.contact_status,
                Origen: selectedView.source_url || '—',
                Referrer: selectedView.referrer || '—',
                'UTM source': selectedView.utm_source || '—',
                'UTM medium': selectedView.utm_medium || '—',
                'UTM campaign': selectedView.utm_campaign || '—',
              }).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="mt-6 rounded-xl bg-cobalt px-4 py-2" onClick={() => setSelected(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
