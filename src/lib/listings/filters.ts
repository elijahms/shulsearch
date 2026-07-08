import type { Listing, ListingsQuery } from './types'

/**
 * The user-facing filter predicate (price / beds / baths / homeType). Shared by the
 * live provider and the cache read path so that a cached, *unfiltered* metro superset
 * filters identically to a fresh live query. listingType and radius are handled
 * elsewhere (the endpoint choice and the haversine trim, respectively).
 */
export function applyListingFilters(listings: Listing[], q: ListingsQuery): Listing[] {
  return listings.filter(
    (l) =>
      (q.priceMin == null || l.price >= q.priceMin) &&
      (q.priceMax == null || l.price <= q.priceMax) &&
      (q.bedsMin == null || (l.beds ?? 0) >= q.bedsMin) &&
      (q.bathsMin == null || (l.baths ?? 0) >= q.bathsMin) &&
      (q.homeType == null || l.homeType === q.homeType),
  )
}
