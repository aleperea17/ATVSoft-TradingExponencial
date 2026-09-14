/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import PostAppointmentPage from '../pages/PostAppointmentPage.tsx'
import { FaqVideoPlayer } from '../components/post-appointment/FaqVideoPlayer.tsx'
import { LandingPage } from '../pages/LandingPage.tsx'

beforeAll(() => {
  class MockObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockObserver,
  })
})

afterEach(() => {
  cleanup()
})

describe('landing post-agenda', () => {
  it('renderiza /post-agenda con el estado pendiente', () => {
    render(
      <MemoryRouter>
        <PostAppointmentPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent?.toLowerCase()).toContain('cancelar tu llamada')
    expect(screen.getByText(/tu llamada no continúa sin este video/i)).toBeTruthy()
    expect(screen.getByText(/paso 1 de 2 pendiente/i)).toBeTruthy()
    expect(screen.queryByText(/tu llamada está confirmada/i)).toBeNull()
    expect(screen.queryByText(/video completado correctamente/i)).toBeNull()
  })

  it('conserva la landing VSL y sus CTA', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    expect(screen.getAllByRole('link', { name: /quiero ingresar/i }).length).toBe(3)
  })
})

describe('videos FAQ', () => {
  it('muestra play inicial y no usa controles nativos', () => {
    const { container } = render(
      <FaqVideoPlayer src="/assets/post-appointment/demo-main.mp4" poster="/x.jpg" title="Pregunta de prueba" />,
    )
    expect(screen.getByRole('button', { name: /reproducir pregunta de prueba/i })).toBeTruthy()
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    expect(video?.hasAttribute('controls')).toBe(false)
    expect(video?.getAttribute('controlslist')).toContain('nodownload')
  })

  it('reanuda si se pausa antes de terminar', () => {
    const { container } = render(
      <FaqVideoPlayer src="/assets/post-appointment/demo-main.mp4" poster="/x.jpg" title="Pregunta de prueba" />,
    )
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    const playSpy = vi.spyOn(video as HTMLVideoElement, 'play').mockResolvedValue(undefined)
    screen.getByRole('button', { name: /reproducir pregunta de prueba/i }).click()
    playSpy.mockClear()
    Object.defineProperty(video, 'ended', { configurable: true, get: () => false })
    video?.dispatchEvent(new Event('pause'))
    expect(playSpy).toHaveBeenCalled()
  })

  it('no reanuda después de ended', () => {
    const { container } = render(
      <FaqVideoPlayer src="/assets/post-appointment/demo-main.mp4" poster="/x.jpg" title="Pregunta de prueba" />,
    )
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    const playSpy = vi.spyOn(video as HTMLVideoElement, 'play').mockResolvedValue(undefined)
    screen.getByRole('button', { name: /reproducir pregunta de prueba/i }).click()
    playSpy.mockClear()
    Object.defineProperty(video, 'ended', { configurable: true, get: () => true })
    video?.dispatchEvent(new Event('pause'))
    expect(playSpy).not.toHaveBeenCalled()
  })
})
