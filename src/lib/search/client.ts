import type { HomeType, ListingType } from '../listings/types'
import type { SearchResult, ShulPoint } from './types'

export interface HomeSearchRequest {
  shuls: ShulPoint[]
  radiusMeters: number
  listingType: ListingType
  priceMin?: number
  priceMax?: number
  bedsMin?: number
  bathsMin?: number
  homeType?: HomeType
  metro?: string
  mode?: 'specific' | 'any'
  denominationFilter?: string
  sessionId?: string
}

/** POST a home search to the server API (keeps provider + Maps keys server-side). */
export async function searchHomesClient(req: HomeSearchRequest): Promise<SearchResult> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`search failed: ${res.status}`)
  return (await res.json()) as SearchResult
}
