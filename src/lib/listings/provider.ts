import 'server-only'
import type { ListingsProvider } from './types'
import { MockListingsProvider } from './mock'
import { OpenWebNinjaProvider } from './openweb-ninja'

let cached: ListingsProvider | null = null

/**
 * The active listings provider. Uses the real Zillow adapter when RAPIDAPI_KEY is configured,
 * otherwise the mock — so the whole search works end-to-end before a key exists.
 */
export function getListingsProvider(): ListingsProvider {
  if (cached) return cached
  const key = process.env.RAPIDAPI_KEY
  cached = key ? new OpenWebNinjaProvider(key) : new MockListingsProvider()
  return cached
}
