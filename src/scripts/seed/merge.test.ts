import { describe, it, expect } from 'vitest'
import { mergeToShuls, dedupeRaw } from './merge'
import type { RawShul } from './types'

const osm = (over: Partial<RawShul>): RawShul => ({
  source: 'osm',
  sourceId: 'node/1',
  name: 'X',
  lat: 40.9,
  lng: -74.0,
  ...over,
})

describe('dedupeRaw', () => {
  it('merges an OSM + Wikidata record for the same place (shared coords)', () => {
    const clusters = dedupeRaw([
      osm({ sourceId: 'node/1', name: 'Congregation Beth Israel', lat: 40.9, lng: -74.0, website: 'https://bi.org' }),
      { source: 'wikidata', sourceId: 'Q9', name: 'Bais Yisroel', lat: 40.9001, lng: -74.0, wikidataId: 'Q9' },
    ])
    expect(clusters).toHaveLength(1)
    expect(clusters[0].record.wikidataId).toBe('Q9') // enriched from wikidata
  })

  it('drops a google-only record with no storable match (ToS)', () => {
    const clusters = dedupeRaw([
      { source: 'google', sourceId: 'ChIJ1', name: 'Some Shul', lat: 41.0, lng: -73.0, googlePlaceId: 'ChIJ1' },
    ])
    expect(clusters).toHaveLength(0)
  })

  it('attaches a google place_id to a matching OSM cluster', () => {
    const clusters = dedupeRaw([
      osm({ name: 'Young Israel', lat: 40.9, lng: -74.0 }),
      { source: 'google', sourceId: 'ChIJ2', name: 'Young Israel', lat: 40.9001, lng: -74.0, googlePlaceId: 'ChIJ2' },
    ])
    expect(clusters).toHaveLength(1)
    expect(clusters[0].record.googlePlaceId).toBe('ChIJ2')
    expect(clusters[0].record.source).toBe('osm')
  })
})

describe('mergeToShuls', () => {
  it('produces Shul docs with geohash, denomination, metro, and needsReview flags', () => {
    const shuls = mergeToShuls(
      [osm({ name: 'Chabad of Teaneck', lat: 40.9, lng: -74.0 }), osm({ sourceId: 'node/2', name: 'Beth Israel', lat: 41.5, lng: -74.5 })],
      'teaneck-bergen-nj',
      'NJ',
    )
    expect(shuls).toHaveLength(2)
    const chabad = shuls.find((s) => s.name === 'Chabad of Teaneck')!
    expect(chabad.denomination.subtype).toBe('Chabad')
    expect(chabad.geohash).toHaveLength(10)
    expect(chabad.metro).toBe('teaneck-bergen-nj')
    expect(chabad.needsReview).toBeUndefined() // high confidence
    const bi = shuls.find((s) => s.name === 'Beth Israel')!
    expect(bi.needsReview).toBe(true) // low-confidence denomination
  })
})
