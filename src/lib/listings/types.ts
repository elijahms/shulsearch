export type ListingType = 'buy' | 'rent'
export type HomeType = 'house' | 'condo' | 'townhome' | 'apartment' | 'multi-family' | 'other'

/** A normalized home/apartment listing (provider-agnostic). */
export interface Listing {
  id: string
  provider: string
  lat: number
  lng: number
  price: number
  listingType: ListingType
  beds?: number
  baths?: number
  sqft?: number
  homeType?: HomeType
  address?: string
  photo?: string
  url?: string
  zestimate?: number
}

export interface ListingBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface ListingsQuery {
  bounds: ListingBounds
  listingType: ListingType
  priceMin?: number
  priceMax?: number
  bedsMin?: number
  bathsMin?: number
  homeType?: HomeType
  /** Human location string ("City, ST") for location-based providers (bounds-based providers ignore it). */
  locationHint?: string
  /** Metro id (e.g. "brooklyn-ny") — keys the per-metro listings cache. */
  metroId?: string
}

/** Swappable listings source. All provider quirks live behind this one interface. */
export interface ListingsProvider {
  readonly name: string
  search(query: ListingsQuery): Promise<Listing[]>
}
