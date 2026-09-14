import { env } from '../config/env.ts'
import type { AppointmentRecord } from '../database/db.ts'

export type SchedulingProvider = {
  isEnabled(): boolean
  providerName(): string
}

export type BookingValidation = {
  confirmed: boolean
  reason: 'disabled' | 'missing_booking' | 'not_implemented' | 'valid'
}

/**
 * Adaptador de agenda. La API real de Calendly se conectará aquí más adelante:
 * validar reserva, relacionar prospecto, confirmar llamada y procesar webhooks.
 * Mientras CALENDLY_ENABLED=false no se realiza ninguna solicitud externa.
 */
export class CalendlyService implements SchedulingProvider {
  providerName(): string {
    return 'calendly'
  }

  isEnabled(): boolean {
    if (!env.CALENDLY_ENABLED) return false
    if (!env.CALENDLY_API_TOKEN || !env.CALENDLY_EVENT_TYPE_URI) return false
    return true
  }

  getPublicStatus(): { enabled: boolean; provider: string } {
    return {
      enabled: this.isEnabled(),
      provider: this.providerName(),
    }
  }

  resolveConfirmation(record: Pick<AppointmentRecord, 'calendly_event_uri' | 'calendly_invitee_uri'>): BookingValidation {
    if (!this.isEnabled()) {
      return { confirmed: false, reason: 'disabled' }
    }
    if (!record.calendly_event_uri || !record.calendly_invitee_uri) {
      return { confirmed: false, reason: 'missing_booking' }
    }
    return { confirmed: false, reason: 'not_implemented' }
  }

  async validateExistingBooking(_eventUri: string, _inviteeUri: string): Promise<BookingValidation> {
    if (!this.isEnabled()) return { confirmed: false, reason: 'disabled' }
    return { confirmed: false, reason: 'not_implemented' }
  }

  linkLeadToBooking(_leadId: string, _eventUri: string): { ok: false; reason: string } {
    return { ok: false, reason: this.isEnabled() ? 'not_implemented' : 'disabled' }
  }

  processWebhook(_payload: unknown, _signature: string): { ok: false; reason: string } {
    return { ok: false, reason: this.isEnabled() ? 'not_implemented' : 'disabled' }
  }
}

export const calendlyService = new CalendlyService()
