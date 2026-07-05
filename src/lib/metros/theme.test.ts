import { describe, it, expect } from 'vitest'
import { metroTheme, DEFAULT_THEME, METRO_THEMES } from './theme'

describe('metroTheme', () => {
  it('falls back to DEFAULT_THEME for an unknown id', () => {
    expect(metroTheme('not-a-metro')).toBe(DEFAULT_THEME)
  })

  it('returns the metro-specific theme when one is defined', () => {
    const entries = Object.entries(METRO_THEMES)
    expect(entries.length).toBeGreaterThan(0)
    for (const [id, theme] of entries) {
      expect(metroTheme(id)).toBe(theme)
    }
  })

  it('DEFAULT_THEME satisfies the full contract', () => {
    expect(DEFAULT_THEME.accent).toMatch(/^#/)
    expect(DEFAULT_THEME.accentSoft).toMatch(/^#/)
    expect(DEFAULT_THEME.heroBackground.length).toBeGreaterThan(0)
    expect(['light', 'dark']).toContain(DEFAULT_THEME.heroText)
    expect(DEFAULT_THEME.motif.length).toBeGreaterThan(0)
    expect(DEFAULT_THEME.tagline.length).toBeGreaterThan(0)
  })
})
