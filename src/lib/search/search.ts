import 'server-only'
import { haversineMeters } from '../geo/geo'
import { boundingBox, boundsAround } from '../geo/bbox'
import { getListingsProvider } from '../listings/provider'
import type { HomeType, Listing, ListingType } from '../listings/types'
import { walkingTimes } from '../routes/walk'

export interface ShulPoint {
  id: string
  name: string
  lat: number
  lng: number
}

export interface SearchParams {
  /** One shul (specific mode) or many (any-shul mode, already denomination-filtered by the client). */
  shuls: ShulPoint[]
  radiusMeters: number
  listingType: ListingType
  priceMin?: number
  priceMax?: number
  bedsMin?: number
  bathsMin?: number
  homeType?: HomeType
  maxResults?: number
}

export interface SearchResultItem extends Listing {
  /** Straight-line meters to the nearest qualifying shul. */
  distanceMeters: number
  nearestShulId: string
  nearestShulName: string
  walkMeters?: number
  walkSeconds?: number
}

export interface SearchResult {
  items: SearchResultItem[]
  total: number
  provider: string
}

/** Core search: listings within a walk radius of a shul (or any of several shuls). */
export async function searchHomes(params: SearchParams): Promise<SearchResult> {
  const { shuls, radiusMeters } = params
  if (shuls.length === 0) return { items: [], total: 0, provider: 'none' }
  const cap = params.maxResults ?? 20
  const provider = getListingsProvider()

  const bounds =
    shuls.length === 1 ? boundingBox(shuls[0], radiusMeters) : boundsAround(shuls, radiusMeters)

  const listings = await provider.search({
    bounds,
    listingType: params.listingType,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    bedsMin: params.bedsMin,
    bathsMin: params.bathsMin,
    homeType: params.homeType,
  })

  // Keep listings within the true circle radius of the nearest shul.
  const within: SearchResultItem[] = []
  for (const l of listings) {
    let best = Infinity
    let bestShul = shuls[0]
    for (const s of shuls) {
      const d = haversineMeters({ lat: l.lat, lng: l.lng }, { lat: s.lat, lng: s.lng })
      if (d < best) {
        best = d
        bestShul = s
      }
    }
    if (best <= radiusMeters) {
      within.push({ ...l, distanceMeters: best, nearestShulId: bestShul.id, nearestShulName: bestShul.name })
    }
  }
  within.sort((a, b) => a.distanceMeters - b.distanceMeters)
  const shown = within.slice(0, cap)
  await annotateWalkTimes(shown, shuls)
  return { items: shown, total: within.length, provider: provider.name }
}

/** One Routes call per shul-origin (its nearby listings as destinations). */
async function annotateWalkTimes(items: SearchResultItem[], shuls: ShulPoint[]): Promise<void> {
  const byShul = new Map<string, SearchResultItem[]>()
  for (const it of items) {
    const arr = byShul.get(it.nearestShulId) ?? []
    arr.push(it)
    byShul.set(it.nearestShulId, arr)
  }
  await Promise.all(
    [...byShul.entries()].map(async ([shulId, its]) => {
      const shul = shuls.find((s) => s.id === shulId)
      if (!shul) return
      const results = await walkingTimes(shul, its.map((it) => ({ lat: it.lat, lng: it.lng })))
      its.forEach((it, i) => {
        const w = results.get(i)
        if (w) {
          it.walkMeters = w.meters
          it.walkSeconds = w.seconds
        }
      })
    }),
  )
}
