import type { HomeType, Listing, ListingsProvider, ListingsQuery } from './types'

const HOST = 'real-estate-zillow-com.p.rapidapi.com'
const MAX_PAGES = 3 // ~41 listings/page; the pipeline then haversine-filters to the shul radius

function mapHomeType(v: unknown): HomeType | undefined {
  const s = String(v ?? '').toUpperCase()
  if (s.includes('CONDO')) return 'condo'
  if (s.includes('TOWN')) return 'townhome'
  if (s.includes('APARTMENT')) return 'apartment'
  if (s.includes('MULTI')) return 'multi-family'
  if (s.includes('SINGLE') || s.includes('HOUSE')) return 'house'
  return v ? 'other' : undefined
}

interface RawListing {
  zpid?: string | number
  latLong?: { latitude?: number; longitude?: number }
  unformattedPrice?: number
  beds?: number
  baths?: number
  area?: number
  address?: string
  imgSrc?: string
  detailUrl?: string
  hdpData?: { homeInfo?: { homeType?: string } }
  zestimate?: number | string
}

/**
 * "Real Estate Zillow.com" (RapidAPI, host real-estate-zillow-com.p.rapidapi.com).
 * Endpoints: /v1/search/sale, /v1/search/rent (location-string based, returns listings with latLong).
 * The search pipeline passes the metro as `locationHint`, and its haversine filter trims to the
 * true walk radius of the shul(s). Filters are applied client-side (defensive).
 */
export class RealEstateZillowProvider implements ListingsProvider {
  readonly name = 'real-estate-zillow'
  constructor(private apiKey: string) {}

  async search(q: ListingsQuery): Promise<Listing[]> {
    const location = q.locationHint
    if (!location) return []
    const endpoint = q.listingType === 'rent' ? 'rent' : 'sale'
    const out: Listing[] = []

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `https://${HOST}/v1/search/${endpoint}?location_or_rid=${encodeURIComponent(location)}&page=${page}`
      const res = await fetch(url, {
        headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': this.apiKey },
      })
      if (!res.ok) break
      const json = (await res.json()) as { data?: { listings?: RawListing[]; count?: number } }
      const listings = json.data?.listings ?? []
      for (const r of listings) {
        const lat = r.latLong?.latitude
        const lng = r.latLong?.longitude
        if (lat == null || lng == null || typeof r.unformattedPrice !== 'number') continue
        out.push({
          id: String(r.zpid ?? `${lat},${lng}`),
          provider: this.name,
          lat,
          lng,
          price: r.unformattedPrice,
          listingType: q.listingType,
          beds: r.beds,
          baths: r.baths,
          sqft: r.area,
          homeType: mapHomeType(r.hdpData?.homeInfo?.homeType),
          address: r.address,
          photo: r.imgSrc,
          url: r.detailUrl,
          zestimate: typeof r.zestimate === 'number' ? r.zestimate : undefined,
        })
      }
      const count = json.data?.count
      if (listings.length < 40 || (count != null && out.length >= count)) break
    }

    return out.filter(
      (l) =>
        (q.priceMin == null || l.price >= q.priceMin) &&
        (q.priceMax == null || l.price <= q.priceMax) &&
        (q.bedsMin == null || (l.beds ?? 0) >= q.bedsMin) &&
        (q.bathsMin == null || (l.baths ?? 0) >= q.bathsMin) &&
        (q.homeType == null || l.homeType === q.homeType),
    )
  }
}
