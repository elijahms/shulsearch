import { describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase-admin/firestore'
import { CachedListingsProvider, MAX_CACHE_AGE_MS } from './cached'
import { listingsCacheDocId } from './cache'
import type { Listing, ListingsProvider, ListingsQuery } from './types'

function listing(over: Partial<Listing> = {}): Listing {
  return { id: 'x', provider: 'real-estate-zillow', lat: 40.9, lng: -74, price: 500_000, listingType: 'buy', beds: 3, ...over }
}

/** Minimal Firestore stub: collection().doc(id).get() → {exists, data()}. */
function fakeDb(docs: Record<string, unknown>): Firestore {
  return {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => ({ exists: id in docs, data: () => docs[id] }),
      }),
    }),
  } as unknown as Firestore
}

function fakeOrigin(): ListingsProvider {
  return { name: 'real-estate-zillow', search: vi.fn(async () => [listing({ id: 'live' })]) }
}

const query: ListingsQuery = {
  bounds: { north: 41, south: 40, east: -73, west: -75 },
  listingType: 'buy',
  metroId: 'brooklyn-ny',
}

const FETCHED_AT = 1_700_000_000_000
const NOW = FETCHED_AT + 60 * 60 * 1000 // one hour after the refresh

const cachedDoc = {
  listings: [listing({ id: 'cheap', price: 300_000 }), listing({ id: 'rich', price: 900_000 })],
  count: 2,
  fetchedAt: { toMillis: () => FETCHED_AT },
}

describe('CachedListingsProvider', () => {
  it('serves from cache and applies filters, without calling the origin', async () => {
    const origin = fakeOrigin()
    const p = new CachedListingsProvider(
      origin,
      () => fakeDb({ [listingsCacheDocId('brooklyn-ny', 'buy')]: cachedDoc }),
      () => NOW,
    )
    const rows = await p.search({ ...query, priceMin: 500_000 })
    expect(rows.map((r) => r.id)).toEqual(['rich'])
    expect(origin.search).not.toHaveBeenCalled()
  })

  it('treats a cache entry older than MAX_CACHE_AGE_MS as a miss', async () => {
    const origin = fakeOrigin()
    const p = new CachedListingsProvider(
      origin,
      () => fakeDb({ [listingsCacheDocId('brooklyn-ny', 'buy')]: cachedDoc }),
      () => FETCHED_AT + MAX_CACHE_AGE_MS + 1,
    )
    const rows = await p.search(query)
    expect(rows.map((r) => r.id)).toEqual(['live'])
    expect(origin.search).toHaveBeenCalledOnce()
  })

  it('treats an entry with no fetchedAt as stale', async () => {
    const origin = fakeOrigin()
    const doc = { ...cachedDoc, fetchedAt: undefined }
    const p = new CachedListingsProvider(
      origin,
      () => fakeDb({ [listingsCacheDocId('brooklyn-ny', 'buy')]: doc }),
      () => NOW,
    )
    const rows = await p.search(query)
    expect(rows.map((r) => r.id)).toEqual(['live'])
    expect(origin.search).toHaveBeenCalledOnce()
  })

  it('falls back to the origin on a cache miss', async () => {
    const origin = fakeOrigin()
    const p = new CachedListingsProvider(origin, () => fakeDb({}))
    const rows = await p.search(query)
    expect(rows.map((r) => r.id)).toEqual(['live'])
    expect(origin.search).toHaveBeenCalledOnce()
  })

  it('falls back to the origin when the query has no metroId', async () => {
    const origin = fakeOrigin()
    const p = new CachedListingsProvider(
      origin,
      () => fakeDb({ [listingsCacheDocId('brooklyn-ny', 'buy')]: cachedDoc }),
      () => NOW,
    )
    const rows = await p.search({ ...query, metroId: undefined })
    expect(rows.map((r) => r.id)).toEqual(['live'])
    expect(origin.search).toHaveBeenCalledOnce()
  })

  it('reports the origin data-source name', () => {
    expect(new CachedListingsProvider(fakeOrigin(), () => fakeDb({})).name).toBe('real-estate-zillow')
  })
})
