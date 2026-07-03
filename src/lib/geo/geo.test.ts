import { describe, it, expect } from 'vitest'
import { haversineMeters, geohashOf } from './geo'

describe('haversineMeters', () => {
  it('is ~0 for identical points', () => {
    expect(haversineMeters({ lat: 40.9, lng: -74 }, { lat: 40.9, lng: -74 })).toBeLessThan(1)
  })

  it('approximates a known short distance (~1.11 km per 0.01° latitude)', () => {
    const d = haversineMeters({ lat: 40.9, lng: -74 }, { lat: 40.91, lng: -74 })
    expect(d).toBeGreaterThan(1050)
    expect(d).toBeLessThan(1170)
  })

  it('NYC → LA is ~3,940 km', () => {
    const d = haversineMeters({ lat: 40.7128, lng: -74.006 }, { lat: 34.0522, lng: -118.2437 })
    expect(d).toBeGreaterThan(3_900_000)
    expect(d).toBeLessThan(3_980_000)
  })
})

describe('geohashOf', () => {
  it('returns a precision-10 geohash in the NY/NJ region', () => {
    const gh = geohashOf(40.9, -74.0)
    expect(gh).toHaveLength(10)
    expect(gh.startsWith('dr')).toBe(true)
  })
})
