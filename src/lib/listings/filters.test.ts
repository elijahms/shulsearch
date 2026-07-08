import { describe, expect, it } from 'vitest'
import { applyListingFilters } from './filters'
import type { Listing, ListingsQuery } from './types'

function listing(over: Partial<Listing> = {}): Listing {
  return {
    id: 'x',
    provider: 'test',
    lat: 40.9,
    lng: -74.0,
    price: 500_000,
    listingType: 'buy',
    beds: 3,
    baths: 2,
    homeType: 'house',
    ...over,
  }
}

const base: ListingsQuery = {
  bounds: { north: 41, south: 40, east: -73, west: -75 },
  listingType: 'buy',
}

describe('applyListingFilters', () => {
  it('returns everything when no filters are set', () => {
    const rows = [listing({ id: 'a' }), listing({ id: 'b', price: 9_000_000 })]
    expect(applyListingFilters(rows, base).map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('filters by price range, beds, baths, and homeType together', () => {
    const rows = [
      listing({ id: 'lo', price: 300_000, beds: 4 }),
      listing({ id: 'hit', price: 700_000, beds: 4, baths: 3, homeType: 'house' }),
      listing({ id: 'fewbeds', price: 700_000, beds: 2 }),
      listing({ id: 'condo', price: 700_000, beds: 4, homeType: 'condo' }),
    ]
    const q: ListingsQuery = { ...base, priceMin: 500_000, bedsMin: 3, bathsMin: 3, homeType: 'house' }
    expect(applyListingFilters(rows, q).map((r) => r.id)).toEqual(['hit'])
  })

  it('treats missing beds/baths as 0 so a min filter excludes them', () => {
    const rows = [listing({ id: 'nobeds', beds: undefined }), listing({ id: 'ok', beds: 3 })]
    expect(applyListingFilters(rows, { ...base, bedsMin: 1 }).map((r) => r.id)).toEqual(['ok'])
  })
})
