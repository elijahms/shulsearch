import type { HomeType, Listing, ListingType } from '../listings/types'

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
