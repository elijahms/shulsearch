import 'server-only'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { Listing, ListingType } from './types'

/** One doc per metro+type holds that metro's full (unfiltered) listing superset. */
export const LISTINGS_CACHE = 'listingsCache'

export function listingsCacheDocId(metroId: string, listingType: ListingType): string {
  return `${metroId}__${listingType}`
}

export interface CachedMetroListings {
  listings: Listing[]
  /** epoch ms of the last successful refresh, or 0 if unknown. */
  fetchedAt: number
}

/** Overwrite a metro+type's cached listing superset. Called by the daily refresh cron. */
export async function writeMetroListings(
  db: Firestore,
  metroId: string,
  listingType: ListingType,
  listings: Listing[],
): Promise<void> {
  await db
    .collection(LISTINGS_CACHE)
    .doc(listingsCacheDocId(metroId, listingType))
    .set({
      metroId,
      listingType,
      count: listings.length, // denormalized for Firestore-console inspection only
      listings,
      fetchedAt: FieldValue.serverTimestamp(),
    })
}

/** Read a metro+type's cached listings, or null if the metro was never warmed. */
export async function readMetroListings(
  db: Firestore,
  metroId: string,
  listingType: ListingType,
): Promise<CachedMetroListings | null> {
  const snap = await db.collection(LISTINGS_CACHE).doc(listingsCacheDocId(metroId, listingType)).get()
  if (!snap.exists) return null
  const data = snap.data() as {
    listings?: Listing[]
    fetchedAt?: { toMillis?: () => number }
  }
  return {
    listings: data.listings ?? [],
    fetchedAt: data.fetchedAt?.toMillis?.() ?? 0,
  }
}
