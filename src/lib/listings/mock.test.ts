import { describe, it, expect } from 'vitest'
import { MockListingsProvider } from './mock'
import type { ListingBounds } from './types'

const bounds: ListingBounds = { north: 40.92, south: 40.9, east: -74.0, west: -74.02 }

describe('MockListingsProvider', () => {
  const p = new MockListingsProvider()

  it('returns listings inside the bounds with the right type', async () => {
    const rows = await p.search({ bounds, listingType: 'buy' })
    expect(rows.length).toBeGreaterThan(0)
    for (const l of rows) {
      expect(l.lat).toBeGreaterThanOrEqual(bounds.south)
      expect(l.lat).toBeLessThanOrEqual(bounds.north)
      expect(l.lng).toBeGreaterThanOrEqual(bounds.west)
      expect(l.lng).toBeLessThanOrEqual(bounds.east)
      expect(l.listingType).toBe('buy')
    }
  })

  it('is deterministic for the same bounds', async () => {
    const a = await p.search({ bounds, listingType: 'buy' })
    const b = await p.search({ bounds, listingType: 'buy' })
    expect(a.map((l) => `${l.id}:${l.price}`)).toEqual(b.map((l) => `${l.id}:${l.price}`))
  })

  it('respects price + beds filters', async () => {
    const rows = await p.search({ bounds, listingType: 'buy', priceMin: 1_000_000, bedsMin: 3 })
    for (const l of rows) {
      expect(l.price).toBeGreaterThanOrEqual(1_000_000)
      expect(l.beds ?? 0).toBeGreaterThanOrEqual(3)
    }
  })
})
