import { describe, it, expect } from 'vitest'
import { normalizeName, nameTokens, diceCoefficient } from './normalize'

describe('normalizeName', () => {
  it('strips generic words + punctuation, lowercases', () => {
    expect(normalizeName('Congregation Beth Israel')).toBe('beth israel')
    expect(normalizeName('The Jewish Center of Teaneck')).toBe('teaneck')
  })

  it('unifies Ashkenazi/Sephardi transliterations so variants match', () => {
    expect(normalizeName('Bais Yisroel')).toBe('beth israel')
    expect(normalizeName('Cong. Beth Yisrael')).toBe('beth israel')
  })

  it('keeps distinctive tokens (e.g. Chabad, place names)', () => {
    expect(normalizeName('Chabad of the Upper West Side')).toBe('chabad upper west side')
  })
})

describe('diceCoefficient', () => {
  it('is 1 for identical token sets and 0 for disjoint', () => {
    expect(diceCoefficient(nameTokens('Beth Israel'), nameTokens('Congregation Beth Israel'))).toBe(1)
    expect(diceCoefficient(nameTokens('Beth Israel'), nameTokens('Chabad Lubavitch'))).toBe(0)
  })

  it('is partial for overlapping-but-different names', () => {
    const s = diceCoefficient(nameTokens('Young Israel'), nameTokens('Young Israel of Teaneck'))
    expect(s).toBeGreaterThan(0.6)
    expect(s).toBeLessThan(1)
  })
})
