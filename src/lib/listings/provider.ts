import 'server-only'
import { getAdminDb } from '../firebase/admin'
import { CachedListingsProvider } from './cached'
import { MockListingsProvider } from './mock'
import { RealEstateZillowProvider } from './real-estate-zillow'
import type { ListingsProvider } from './types'

let cached: ListingsProvider | null = null

/**
 * The origin (live) data source — hits the Zillow RapidAPI adapter when RAPIDAPI_KEY
 * is set, otherwise the mock. Used by the refresh cron to (re)populate the cache;
 * it deliberately does NOT read the cache.
 */
export function getOriginListingsProvider(): ListingsProvider {
  const key = process.env.RAPIDAPI_KEY
  return key ? new RealEstateZillowProvider(key) : new MockListingsProvider()
}

/**
 * The read-path provider used by search. With a real API key it is cache-backed
 * (per-metro Firestore cache, warmed daily) and falls back to the live origin on a
 * cache miss. Without a key it is the mock, so the whole search works end-to-end
 * before a key exists.
 */
export function getListingsProvider(): ListingsProvider {
  if (cached) return cached
  const origin = getOriginListingsProvider()
  // Only wrap a real origin: mock mode has no key, no cron, and nothing to cache.
  cached = process.env.RAPIDAPI_KEY ? new CachedListingsProvider(origin, getAdminDb) : origin
  return cached
}
