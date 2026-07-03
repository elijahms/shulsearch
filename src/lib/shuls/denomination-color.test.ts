import { describe, it, expect } from 'vitest'
import { denominationColorHex, denominationLabel } from './denomination-color'

describe('denominationColorHex', () => {
  it('uses the subtype color when present', () => {
    expect(denominationColorHex({ category: 'Orthodox', subtype: 'Chabad', source: 'osm', confidence: 'high' })).toBe('#1f7a5a')
  })
  it('falls back to the category color', () => {
    expect(denominationColorHex({ category: 'Reform', source: 'osm', confidence: 'high' })).toBe('#b5623f')
  })
})

describe('denominationLabel', () => {
  it('prefers subtype, else category', () => {
    expect(denominationLabel({ category: 'Orthodox', subtype: 'Sephardic', source: 'osm', confidence: 'high' })).toBe('Sephardic')
    expect(denominationLabel({ category: 'Conservative', source: 'osm', confidence: 'high' })).toBe('Conservative')
  })
})
