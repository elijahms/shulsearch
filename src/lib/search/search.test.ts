import { describe, it, expect } from 'vitest'
import { searchHomes } from './search'

const shul = { id: 's1', name: 'Test Shul', lat: 40.9, lng: -74.0 }

describe('searchHomes (mock provider)', () => {
  it('returns only listings within the radius, sorted by distance', async () => {
    const res = await searchHomes({ shuls: [shul], radiusMeters: 800, listingType: 'buy' })
    expect(res.provider).toBe('mock')
    expect(res.items.length).toBeGreaterThan(0)
    for (const it of res.items) {
      expect(it.distanceMeters).toBeLessThanOrEqual(800)
      expect(it.nearestShulId).toBe('s1')
    }
    const dists = res.items.map((i) => i.distanceMeters)
    expect(dists).toEqual([...dists].sort((a, b) => a - b))
  })

  it('caps results at maxResults', async () => {
    const res = await searchHomes({ shuls: [shul], radiusMeters: 5000, listingType: 'rent', maxResults: 5 })
    expect(res.items.length).toBeLessThanOrEqual(5)
  })

  it('any-shul mode picks the nearest of several shuls', async () => {
    const shuls = [shul, { id: 's2', name: 'Second', lat: 40.95, lng: -73.95 }]
    const res = await searchHomes({ shuls, radiusMeters: 1500, listingType: 'buy' })
    for (const it of res.items) {
      expect(['s1', 's2']).toContain(it.nearestShulId)
    }
  })
})
