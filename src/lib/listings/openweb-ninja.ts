import type { HomeType, Listing, ListingsProvider, ListingsQuery } from './types'

const HOST = 'real-time-zillow-data.p.rapidapi.com'

const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined)
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

function normalizeHomeType(v: unknown): HomeType | undefined {
  const s = String(v ?? '').toLowerCase()
  if (s.includes('condo')) return 'condo'
  if (s.includes('town')) return 'townhome'
  if (s.includes('apartment')) return 'apartment'
  if (s.includes('multi')) return 'multi-family'
  if (s.includes('house') || s.includes('single')) return 'house'
  return v ? 'other' : undefined
}

/**
 * OpenWeb Ninja "Real-Time Zillow Data" (RapidAPI) — `/search/coordinates` (native map-bounds).
 *
 * NOTE: the exact bounds param + response field names should be confirmed in the RapidAPI
 * playground when the key is provisioned (research flagged this as the one unverified detail).
 * The search() contract, filtering, and normalization here are correct; only the literal keys
 * below may need a tweak. Until a key exists, the factory uses MockListingsProvider instead.
 */
export class OpenWebNinjaProvider implements ListingsProvider {
  readonly name = 'openweb-ninja-zillow'
  constructor(private apiKey: string) {}

  async search(q: ListingsQuery): Promise<Listing[]> {
    const b = q.bounds
    const params = new URLSearchParams({
      north: String(b.north),
      south: String(b.south),
      east: String(b.east),
      west: String(b.west),
      status: q.listingType === 'rent' ? 'forRent' : 'forSale',
    })
    if (q.priceMin != null) params.set('price_min', String(q.priceMin))
    if (q.priceMax != null) params.set('price_max', String(q.priceMax))
    if (q.bedsMin != null) params.set('beds_min', String(q.bedsMin))
    if (q.bathsMin != null) params.set('baths_min', String(q.bathsMin))

    const res = await fetch(`https://${HOST}/search/coordinates?${params.toString()}`, {
      headers: { 'X-RapidAPI-Key': this.apiKey, 'X-RapidAPI-Host': HOST },
    })
    if (!res.ok) throw new Error(`OpenWebNinja ${res.status}: ${(await res.text()).slice(0, 160)}`)
    const data = (await res.json()) as Record<string, unknown>
    const items = ((data.data as Record<string, unknown>)?.results ??
      data.results ??
      data.data ??
      []) as Record<string, unknown>[]
    return items.map((r) => this.normalize(r)).filter((l): l is Listing => l !== null)
  }

  private normalize(r: Record<string, unknown>): Listing | null {
    const loc = (r.location ?? {}) as Record<string, unknown>
    const lat = num(r.latitude) ?? num(r.lat) ?? num(loc.latitude)
    const lng = num(r.longitude) ?? num(r.lng) ?? num(loc.longitude)
    if (lat == null || lng == null) return null
    const rawStatus = String(r.listingStatus ?? r.status ?? '').toLowerCase()
    const detail = str(r.detailUrl)
    return {
      id: String(r.zpid ?? r.id ?? `${lat},${lng}`),
      provider: this.name,
      lat,
      lng,
      price: num(r.price) ?? (Number(String(r.price ?? '').replace(/[^0-9]/g, '')) || 0),
      listingType: rawStatus.includes('rent') ? 'rent' : 'buy',
      beds: num(r.bedrooms) ?? num(r.beds),
      baths: num(r.bathrooms) ?? num(r.baths),
      sqft: num(r.livingArea) ?? num(r.sqft),
      homeType: normalizeHomeType(r.propertyType ?? r.homeType),
      address: str(r.address) ?? str(r.formattedAddress),
      photo: str(r.imgSrc) ?? str(r.photo),
      url: detail ? `https://www.zillow.com${detail}` : str(r.url),
      zestimate: num(r.zestimate),
    }
  }
}
