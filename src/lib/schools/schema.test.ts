import { describe, it, expect } from 'vitest'
import { SchoolSchema } from './schema'

const base = {
  name: 'Yeshivat Noam',
  denomination: { category: 'Orthodox', subtype: 'Modern Orthodox', source: 'name-heuristic', confidence: 'medium' },
  schoolType: 'day-school',
  gender: 'coed',
  metro: 'teaneck-bergen-nj',
  lat: 40.9,
  lng: -74.02,
  geohash: 'dr5xxxxxxx',
  source: 'nces',
}

describe('SchoolSchema', () => {
  it('parses a valid school and defaults status to active', () => {
    const s = SchoolSchema.parse(base)
    expect(s.status).toBe('active')
    expect(s.gender).toBe('coed')
  })
  it('accepts optional grade band + enrollment + ncesId', () => {
    const s = SchoolSchema.parse({ ...base, gradeLow: 'PK', gradeHigh: '8', enrollment: 240, ncesId: 'A9902811' })
    expect(s.gradeHigh).toBe('8')
  })
  it('rejects an invalid schoolType', () => {
    expect(() => SchoolSchema.parse({ ...base, schoolType: 'college' })).toThrow()
  })
  it('rejects a bad grade level', () => {
    expect(() => SchoolSchema.parse({ ...base, gradeLow: '13' })).toThrow()
  })
})
