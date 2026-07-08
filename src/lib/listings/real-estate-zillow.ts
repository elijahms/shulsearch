import { applyListingFilters } from './filters'
import type { HomeType, Listing, ListingsProvider, ListingsQuery } from './types'

const HOST = 'real-estate-zillow-com.p.rapidapi.com'
const MAX_PAGES = 3 // ~41 listings/page; the pipeline then haversine-filters to the shul radius

/** Retry/backoff for RapidAPI throttling (429/503). Overridable in tests. */
export interface RetryOptions {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  sleep?: (ms: number) => Promise<void>
}
const RETRYABLE = new Set([429, 503])
const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

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
  constructor(
    private apiKey: string,
    private retry: RetryOptions = {},
  ) {}

  /** GET a page, retrying with exponential backoff on RapidAPI throttling (429/503). */
  private async fetchPage(url: string): Promise<Response> {
    const retries = this.retry.retries ?? 4
    const base = this.retry.baseDelayMs ?? 1000
    const maxDelay = this.retry.maxDelayMs ?? 8000
    const sleep = this.retry.sleep ?? defaultSleep
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, {
        headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': this.apiKey },
      })
      if (!RETRYABLE.has(res.status) || attempt >= retries) return res
      // Honor Retry-After when present, else exponential backoff.
      const retryAfter = Number(res.headers.get('retry-after'))
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(base * 2 ** attempt, maxDelay)
      await sleep(wait)
    }
  }

  async search(q: ListingsQuery): Promise<Listing[]> {
    const location = q.locationHint
    if (!location) return []
    const endpoint = q.listingType === 'rent' ? 'rent' : 'sale'
    const out: Listing[] = []

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `https://${HOST}/v1/search/${endpoint}?location_or_rid=${encodeURIComponent(location)}&page=${page}`
      const res = await this.fetchPage(url)
      // Throw rather than return a truncated page-1 superset: the refresh cron must
      // treat a partial pull as a failed job (keeping the previous full cache doc),
      // not silently overwrite it with a third of the listings. Retries are already
      // exhausted here, so a lingering 429 is a real, escalated failure.
      if (!res.ok) throw new Error(`real-estate-zillow ${endpoint} p${page}: HTTP ${res.status}`)
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

    return applyListingFilters(out, q)
  }
}
