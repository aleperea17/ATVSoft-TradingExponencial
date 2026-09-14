/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { LandingPage } from '../pages/LandingPage.tsx'
import { IngresarButton } from '../components/IngresarButton.tsx'
import { shouldShowCalendar } from '../services/scheduling.ts'

afterEach(() => {
  cleanup()
})

describe('CTAs y UTM', () => {
  it('navega todos los botones QUIERO INGRESAR a /cuestionario preservando UTM', () => {
    render(
      <MemoryRouter initialEntries={['/?utm_source=instagram&utm_medium=paid&utm_campaign=vsl']}>
        <LandingPage />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link', { name: /quiero ingresar/i })
    expect(links.length).toBeGreaterThanOrEqual(3)
    for (const link of links) {
      expect(link.getAttribute('href')).toBe(
        '/cuestionario?utm_source=instagram&utm_medium=paid&utm_campaign=vsl',
      )
    }
    expect(document.body.innerHTML.toLowerCase()).not.toContain('calendly.com')
  })

  it('preserva UTM desde el botón reutilizable', () => {
    render(
      <MemoryRouter initialEntries={['/?utm_source=youtube&utm_term=vsl']}>
        <IngresarButton>QUIERO INGRESAR</IngresarButton>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'QUIERO INGRESAR' }).getAttribute('href')).toBe(
      '/cuestionario?utm_source=youtube&utm_term=vsl',
    )
  })

  it('no muestra calendario si Calendly está desactivado', () => {
    expect(shouldShowCalendar({ enabled: false, provider: 'calendly' })).toBe(false)
  })
})
