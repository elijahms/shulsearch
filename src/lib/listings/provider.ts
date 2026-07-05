import 'server-only'
import type { ListingsProvider } from './types'
import { MockListingsProvider } from './mock'
import { RealEstateZillowProvider } from './real-estate-zillow'

let cached: ListingsProvider | null = null

/**
 * The active listings provider. Uses the real Zillow adapter (real-estate-zillow-com on RapidAPI)
 * when RAPIDAPI_KEY is configured, otherwise the mock — so the whole search works end-to-end
 * before a key exists.
 */
export function getListingsProvider(): ListingsProvider {
  if (cached) return cached
  const key = process.env.RAPIDAPI_KEY
  cached = key ? new RealEstateZillowProvider(key) : new MockListingsProvider()
  return cached
}
