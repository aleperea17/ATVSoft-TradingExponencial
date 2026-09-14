import { describe, expect, it } from 'vitest'
import { clampSeek, gatedStorageKey } from '../hooks/useGatedVideo.ts'

describe('restricción de adelantamiento', () => {
  it('no permite adelantar más allá de lo visto', () => {
    expect(clampSeek(40, 12)).toBe(12)
    expect(clampSeek(12.6, 12)).toBe(12)
  })

  it('permite retroceder y tolerar buffering', () => {
    expect(clampSeek(8, 12)).toBe(8)
    expect(clampSeek(12.3, 12, 0.45)).toBe(12.3)
  })

  it('usa una clave específica de /post-agenda', () => {
    expect(gatedStorageKey('anon')).toBe('te-post-agenda:anon')
    expect(gatedStorageKey('abc')).toContain('te-post-agenda')
  })
})
