import { describe, it, expect } from 'vitest'
import { schoolDocId } from './repo'

describe('schoolDocId', () => {
  it('uses the stable nces- prefix when ncesId is present', () => {
    expect(schoolDocId({ ncesId: 'A9902811', geohash: 'dr5xxxxxxx', name: 'Yeshiva Ner Torah' })).toBe('nces-A9902811')
  })
  it('falls back to geohash + name slug without an ncesId', () => {
    expect(schoolDocId({ geohash: 'dr5regw123', name: 'Yeshiva Ner Torah' })).toMatch(/^dr5regw1-/)
  })
})
