import { describe, it, expect } from 'vitest'
import { ShulSchema } from './schema'

const base = {
  name: 'Congregation Kesher Israel',
  denomination: {
    category: 'Orthodox',
    subtype: 'Modern Orthodox',
    source: 'name-heuristic',
    confidence: 'high',
  },
  metro: 'teaneck-bergen-nj',
  lat: 40.9,
  lng: -74.01,
  geohash: 'dr5r7',
  source: 'osm',
}

describe('ShulSchema', () => {
  it('accepts a valid shul and defaults status to active', () => {
    const r = ShulSchema.parse(base)
    expect(r.status).toBe('active')
    expect(r.denomination.category).toBe('Orthodox')
    expect(r.denomination.subtype).toBe('Modern Orthodox')
  })

  it('rejects an unknown denomination category', () => {
    expect(() =>
      ShulSchema.parse({ ...base, denomination: { ...base.denomination, category: 'Catholic' } }),
    ).toThrow()
  })

  it('rejects out-of-range latitude', () => {
    expect(() => ShulSchema.parse({ ...base, lat: 200 })).toThrow()
  })

  it('requires a non-empty name and geohash', () => {
    expect(() => ShulSchema.parse({ ...base, name: '' })).toThrow()
    expect(() => ShulSchema.parse({ ...base, geohash: '' })).toThrow()
  })
})
