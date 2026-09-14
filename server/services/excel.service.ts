import ExcelJS from 'exceljs'
import type { LeadRecord } from '../database/db.ts'

const COLUMNS = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Fecha y hora', key: 'created_at', width: 22 },
  { header: 'Nombre y apellido', key: 'full_name', width: 28 },
  { header: 'Email', key: 'email', width: 32 },
  { header: 'WhatsApp', key: 'whatsapp', width: 20 },
  { header: 'País', key: 'country', width: 18 },
  { header: 'Ciudad', key: 'city', width: 18 },
  { header: 'Experiencia', key: 'experience', width: 24 },
  { header: 'Situación actual', key: 'current_situation', width: 24 },
  { header: 'Objetivo', key: 'goal', width: 40 },
  { header: 'Problema principal', key: 'main_problem', width: 40 },
  { header: 'Capital disponible', key: 'capital', width: 28 },
  { header: 'Disposición para invertir', key: 'willing_to_invest', width: 28 },
  { header: 'Horario preferido', key: 'preferred_time', width: 20 },
  { header: 'Comentarios', key: 'comments', width: 40 },
  { header: 'Consentimiento', key: 'consent', width: 16 },
  { header: 'Estado del contacto', key: 'contact_status', width: 20 },
  { header: 'URL de origen', key: 'source_url', width: 40 },
  { header: 'Referrer', key: 'referrer', width: 32 },
  { header: 'UTM source', key: 'utm_source', width: 18 },
  { header: 'UTM medium', key: 'utm_medium', width: 18 },
  { header: 'UTM campaign', key: 'utm_campaign', width: 22 },
  { header: 'UTM content', key: 'utm_content', width: 18 },
  { header: 'UTM term', key: 'utm_term', width: 18 },
] as const

function parseLaRiojaDate(value: string): Date {
  const iso = value.includes('T') ? value : value.replace(' ', 'T')
  return new Date(`${iso}-03:00`)
}

export async function buildLeadsWorkbook(leads: LeadRecord[]): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Trading Exponencial'
  const sheet = workbook.addWorksheet('Prospectos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = COLUMNS.map((column) => ({ ...column }))
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLUMNS.length },
  }

  const header = sheet.getRow(1)
  header.font = { bold: true }
  header.commit()

  for (const lead of leads) {
    const row = sheet.addRow({
      id: lead.id,
      created_at: parseLaRiojaDate(lead.created_at),
      full_name: lead.full_name,
      email: lead.email,
      whatsapp: lead.whatsapp,
      country: lead.country,
      city: lead.city,
      experience: lead.experience,
      current_situation: lead.current_situation,
      goal: lead.goal,
      main_problem: lead.main_problem,
      capital: lead.capital,
      willing_to_invest: lead.willing_to_invest,
      preferred_time: lead.preferred_time,
      comments: lead.comments,
      consent: lead.consent ? 'Sí' : 'No',
      contact_status: lead.contact_status,
      source_url: lead.source_url,
      referrer: lead.referrer,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      utm_term: lead.utm_term,
    })

    row.getCell('created_at').numFmt = 'yyyy-mm-dd hh:mm:ss'
    row.getCell('whatsapp').numFmt = '@'
    row.getCell('goal').alignment = { wrapText: true, vertical: 'top' }
    row.getCell('main_problem').alignment = { wrapText: true, vertical: 'top' }
    row.getCell('comments').alignment = { wrapText: true, vertical: 'top' }
  }

  return workbook
}
