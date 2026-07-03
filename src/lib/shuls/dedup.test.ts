import { describe, it, expect } from 'vitest'
import { dedupDecision, type DedupCandidate } from './dedup'

const at = (name: string, lat: number, lng: number, extra: Partial<DedupCandidate> = {}): DedupCandidate => ({
  name,
  lat,
  lng,
  ...extra,
})

describe('dedupDecision', () => {
  it('merges records that share a Wikidata id, even far apart', () => {
    expect(
      dedupDecision(at('A', 1, 1, { wikidataId: 'Q123' }), at('B', 50, 50, { wikidataId: 'Q123' })),
    ).toBe('merge')
  })

  it('merges same-place transliteration variants within the geoblock', () => {
    expect(
      dedupDecision(at('Congregation Beth Israel', 40.901, -74.01), at('Bais Yisroel', 40.9011, -74.0101)),
    ).toBe('merge')
  })

  it('keeps distinct adjacent shuls with different names', () => {
    expect(
      dedupDecision(at('Chabad House', 40.9, -74.0), at('Young Israel', 40.9001, -74.0)),
    ).toBe('distinct')
  })

  it('flags partial-overlap names within the geoblock for review', () => {
    expect(
      dedupDecision(at('Young Israel', 40.9, -74.0), at('Young Israel of Teaneck', 40.9001, -74.0)),
    ).toBe('review')
  })

  it('treats the same name far apart as distinct (geoblock)', () => {
    expect(dedupDecision(at('Beth Israel', 40.9, -74.0), at('Beth Israel', 41.0, -74.0))).toBe('distinct')
  })

  it('merges on a shared website domain within the geoblock', () => {
    expect(
      dedupDecision(
        at('The Shul', 40.9, -74.0, { website: 'https://www.example.org/a' }),
        at('Kehilas Example', 40.9001, -74.0, { website: 'http://example.org' }),
      ),
    ).toBe('merge')
  })
})
