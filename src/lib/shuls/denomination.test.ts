import { describe, it, expect } from 'vitest'
import { inferDenomination } from './denomination'

describe('inferDenomination', () => {
  it('reads an explicit OSM denomination tag with high confidence', () => {
    const d = inferDenomination('Congregation Beth Israel', { denomination: 'conservative' })
    expect(d.category).toBe('Conservative')
    expect(d.source).toBe('osm')
    expect(d.confidence).toBe('high')
  })

  it('maps Chabad/Lubavitch names to Orthodox/Chabad', () => {
    expect(inferDenomination('Chabad of Teaneck').category).toBe('Orthodox')
    expect(inferDenomination('Chabad of Teaneck').subtype).toBe('Chabad')
    expect(inferDenomination('Lubavitch Center').subtype).toBe('Chabad')
  })

  it('maps Young Israel to Modern Orthodox and Temple/Reform to Reform', () => {
    expect(inferDenomination('Young Israel of Flatbush').subtype).toBe('Modern Orthodox')
    expect(inferDenomination('Temple Emanu-El').category).toBe('Reform')
    expect(inferDenomination('Congregation Rodeph Reform').category).toBe('Reform')
  })

  it('maps Sephardic/Persian names to Orthodox/Sephardic', () => {
    expect(inferDenomination('Sephardic Congregation of Deal').subtype).toBe('Sephardic')
    expect(inferDenomination('Persian Jewish Center').subtype).toBe('Sephardic')
  })

  it('maps yeshiva/kollel names to Orthodox (name-heuristic)', () => {
    const d = inferDenomination('Yeshiva Gedolah Beis Medrash')
    expect(d.category).toBe('Orthodox')
    expect(d.source).toBe('name-heuristic')
  })

  it('falls back to a best-guess with low confidence when nothing matches', () => {
    // "Beth Israel" is common across all movements — no signal, so low confidence.
    const d = inferDenomination('Beth Israel')
    expect(d.confidence).toBe('low')
    // best-guess category is still set (caller flags low-confidence for admin review)
    expect(d.category).toBeTruthy()
  })
})
