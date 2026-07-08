import 'server-only'
import type { Firestore } from 'firebase-admin/firestore'
import { readMetroListings } from './cache'
import { applyListingFilters } from './filters'
import type { Listing, ListingsProvider, ListingsQuery } from './types'

/**
 * A cache entry older than this is treated as a miss (fall through to the live
 * origin) — bounds how stale served listings can get if the refresh cron breaks.
 * 48h tolerates one missed daily run without a cost spike.
 */
export const MAX_CACHE_AGE_MS = 48 * 60 * 60 * 1000

/**
 * Serves listings from the per-metro Firestore cache (warmed daily by the refresh
 * cron) instead of hitting the origin provider on every search. On a cache miss —
 * a metro not yet warmed, a stale entry, or a query with no metroId — it falls back
 * to the origin so search always returns fresh results. The cache holds the
 * unfiltered metro superset; user filters (price/beds/baths/homeType) are applied
 * here at read time, which is why one cached pull can serve every filter combination.
 */
export class CachedListingsProvider implements ListingsProvider {
  constructor(
    private origin: ListingsProvider,
    private getDb: () => Firestore,
    private now: () => number = Date.now,
  ) {}

  get name(): string {
    return this.origin.name
  }

  async search(q: ListingsQuery): Promise<Listing[]> {
    if (q.metroId) {
      const cached = await readMetroListings(this.getDb(), q.metroId, q.listingType).catch((e) => {
        // Fall through to the origin, but leave a trail: a Firestore outage must be
        // distinguishable from a cold metro in the logs.
        console.error(`listings cache read failed for ${q.metroId}/${q.listingType}`, e)
        return null
      })
      const fresh = cached && this.now() - cached.fetchedAt <= MAX_CACHE_AGE_MS
      if (fresh && cached.listings.length > 0) {
        return applyListingFilters(cached.listings, q)
      }
    }
    return this.origin.search(q)
  }
}
