import { describe, it, expect, beforeEach } from 'vitest'
import { getAdminDb } from '@/lib/firebase/admin'
import { LISTINGS_CACHE, readMetroListings, writeMetroListings } from '@/lib/listings/cache'
import { CachedListingsProvider } from '@/lib/listings/cached'
import type { Listing, ListingsProvider, ListingsQuery } from '@/lib/listings/types'

const mk = (over: Partial<Listing> = {}): Listing => ({
  id: 'z1',
  provider: 'real-estate-zillow',
  lat: 40.9,
  lng: -74.0,
  price: 500_000,
  listingType: 'buy',
  beds: 3,
  baths: 2,
  sqft: 1800,
  homeType: 'house',
  address: '1 Test St',
  url: 'https://www.zillow.com/homedetails/1/z1_zpid/',
  ...over,
})

const query: ListingsQuery = {
  bounds: { north: 41, south: 40, east: -73, west: -75 },
  listingType: 'buy',
  metroId: 'test-metro',
}

describe('listings cache (emulator)', () => {
  const db = getAdminDb()

  beforeEach(async () => {
    const snap = await db.collection(LISTINGS_CACHE).get()
    await Promise.all(snap.docs.map((d) => d.ref.delete()))
  })

  it('round-trips a listings superset through Firestore', async () => {
    await writeMetroListings(db, 'test-metro', 'buy', [mk({ id: 'a' }), mk({ id: 'b', beds: undefined })])
    const got = await readMetroListings(db, 'test-metro', 'buy')
    expect(got?.listings.map((l) => l.id).sort()).toEqual(['a', 'b'])
    expect(got?.fetchedAt).toBeGreaterThan(0)
    // undefined optional fields are dropped by Firestore (ignoreUndefinedProperties), not stored as null
    expect(got?.listings.find((l) => l.id === 'b')?.beds).toBeUndefined()
  })

  it('returns null for a never-warmed metro', async () => {
    expect(await readMetroListings(db, 'never-warmed', 'buy')).toBeNull()
  })

  it('CachedListingsProvider serves cached data (filtered) and skips the origin', async () => {
    await writeMetroListings(db, 'test-metro', 'buy', [
      mk({ id: 'cheap', price: 300_000 }),
      mk({ id: 'rich', price: 900_000 }),
    ])
    let originCalls = 0
    const origin: ListingsProvider = {
      name: 'real-estate-zillow',
      search: async () => {
        originCalls++
        return [mk({ id: 'live' })]
      },
    }
    const provider = new CachedListingsProvider(origin, () => db)
    const rows = await provider.search({ ...query, priceMin: 500_000 })
    expect(rows.map((r) => r.id)).toEqual(['rich'])
    expect(originCalls).toBe(0)
  })

  it('CachedListingsProvider falls back to the origin when the metro is cold', async () => {
    let originCalls = 0
    const origin: ListingsProvider = {
      name: 'real-estate-zillow',
      search: async () => {
        originCalls++
        return [mk({ id: 'live' })]
      },
    }
    const provider = new CachedListingsProvider(origin, () => db)
    const rows = await provider.search({ ...query, metroId: 'cold-metro' })
    expect(rows.map((r) => r.id)).toEqual(['live'])
    expect(originCalls).toBe(1)
  })
})
