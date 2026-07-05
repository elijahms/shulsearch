import { afterEach, describe, expect, it, vi } from 'vitest'
import { RealEstateZillowProvider } from './real-estate-zillow'
import type { ListingBounds } from './types'

const bounds: ListingBounds = { north: 40.92, south: 40.85, east: -74.0, west: -74.05 }

/** A single listing in the exact shape the live API returns (host real-estate-zillow-com). */
function rawListing(over: Record<string, unknown> = {}) {
  return {
    zpid: '38031060',
    latLong: { latitude: 40.8855, longitude: -74.02494 },
    unformattedPrice: 399000,
    beds: 2,
    baths: 2,
    area: 3001,
    address: '605 Linden Ave, Teaneck Twp., NJ 07666',
    imgSrc: 'https://photos.zillowstatic.com/fp/x-p_e.jpg',
    detailUrl: 'https://www.zillow.com/homedetails/605-Linden-Ave/38031060_zpid/',
    hdpData: { homeInfo: { homeType: 'SINGLE_FAMILY' } },
    ...over,
  }
}

function mockFetch(listings: unknown[], count = listings.length) {
  return vi.fn(async (_url: string, _opts: { headers: Record<string, string> }) =>
    new Response(JSON.stringify({ description: 'OK', status: 200, data: { listings, count } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

afterEach(() => vi.restoreAllMocks())

describe('RealEstateZillowProvider', () => {
  it('normalizes the API shape into Listings', async () => {
    vi.stubGlobal('fetch', mockFetch([rawListing()]))
    const p = new RealEstateZillowProvider('test-key')
    const rows = await p.search({ bounds, listingType: 'buy', locationHint: 'Teaneck, NJ' })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: '38031060',
      provider: 'real-estate-zillow',
      lat: 40.8855,
      lng: -74.02494,
      price: 399000,
      listingType: 'buy',
      beds: 2,
      baths: 2,
      sqft: 3001,
      homeType: 'house',
    })
    expect(rows[0].url).toContain('zillow.com')
  })

  it('hits /sale for buy and /rent for rent, sending the key + host headers', async () => {
    const fetchMock = mockFetch([rawListing()])
    vi.stubGlobal('fetch', fetchMock)
    const p = new RealEstateZillowProvider('secret-key')

    await p.search({ bounds, listingType: 'buy', locationHint: 'Teaneck, NJ' })
    expect(fetchMock.mock.calls[0][0]).toContain('/v1/search/sale')
    expect(fetchMock.mock.calls[0][0]).toContain('location_or_rid=Teaneck%2C%20NJ')
    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers['x-rapidapi-key']).toBe('secret-key')
    expect(headers['x-rapidapi-host']).toBe('real-estate-zillow-com.p.rapidapi.com')

    fetchMock.mockClear()
    await p.search({ bounds, listingType: 'rent', locationHint: 'Teaneck, NJ' })
    expect(fetchMock.mock.calls[0][0]).toContain('/v1/search/rent')
  })

  it('returns nothing without a locationHint (this API is location-string based)', async () => {
    const fetchMock = mockFetch([rawListing()])
    vi.stubGlobal('fetch', fetchMock)
    const p = new RealEstateZillowProvider('k')
    const rows = await p.search({ bounds, listingType: 'buy' })
    expect(rows).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('applies price/beds filters and drops listings missing coordinates', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        rawListing({ zpid: '1', unformattedPrice: 300000, beds: 2 }),
        rawListing({ zpid: '2', unformattedPrice: 900000, beds: 4 }),
        rawListing({ zpid: '3', latLong: undefined }), // no coords -> dropped
      ]),
    )
    const p = new RealEstateZillowProvider('k')
    const rows = await p.search({
      bounds,
      listingType: 'buy',
      locationHint: 'Teaneck, NJ',
      priceMin: 500000,
      bedsMin: 3,
    })
    expect(rows.map((r) => r.id)).toEqual(['2'])
  })

  it('maps homeType variants', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        rawListing({ zpid: 'c', hdpData: { homeInfo: { homeType: 'CONDO' } } }),
        rawListing({ zpid: 't', hdpData: { homeInfo: { homeType: 'TOWNHOUSE' } } }),
        rawListing({ zpid: 'm', hdpData: { homeInfo: { homeType: 'MULTI_FAMILY' } } }),
      ]),
    )
    const p = new RealEstateZillowProvider('k')
    const rows = await p.search({ bounds, listingType: 'buy', locationHint: 'Teaneck, NJ' })
    expect(rows.map((r) => r.homeType)).toEqual(['condo', 'townhome', 'multi-family'])
  })
})
