import type { HomeType, Listing, ListingsProvider, ListingsQuery } from './types'

const HOME_TYPES: HomeType[] = ['house', 'condo', 'townhome', 'apartment', 'multi-family']

/** Deterministic fake listings within the query bounds — lets the whole search work with no API key. */
export class MockListingsProvider implements ListingsProvider {
  readonly name = 'mock'

  async search(q: ListingsQuery): Promise<Listing[]> {
    const { bounds } = q
    // Seed the PRNG from the bounds so the same area returns stable results.
    let seed = Math.abs(Math.floor((bounds.north * 7 + bounds.west * 13 + bounds.east * 17) * 1e4)) % 2147483647 || 1
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const isRent = q.listingType === 'rent'
    const out: Listing[] = []
    for (let i = 0; i < 80; i++) {
      const lat = bounds.south + rnd() * (bounds.north - bounds.south)
      const lng = bounds.west + rnd() * (bounds.east - bounds.west)
      const price = isRent ? 1400 + Math.floor(rnd() * 6000) : 350_000 + Math.floor(rnd() * 2_400_000)
      out.push({
        id: `mock-${i}`,
        provider: 'mock',
        lat,
        lng,
        price,
        listingType: q.listingType,
        beds: 1 + Math.floor(rnd() * 5),
        baths: 1 + Math.floor(rnd() * 3),
        sqft: 700 + Math.floor(rnd() * 3200),
        homeType: HOME_TYPES[Math.floor(rnd() * HOME_TYPES.length)],
        address: `${100 + i} Sample St`,
        url: '#',
      })
    }
    return out.filter(
      (l) =>
        (q.priceMin == null || l.price >= q.priceMin) &&
        (q.priceMax == null || l.price <= q.priceMax) &&
        (q.bedsMin == null || (l.beds ?? 0) >= q.bedsMin) &&
        (q.bathsMin == null || (l.baths ?? 0) >= q.bathsMin) &&
        (q.homeType == null || l.homeType === q.homeType),
    )
  }
}
