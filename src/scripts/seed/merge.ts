import { geohashOf } from '../../lib/geo/geo'
import { inferDenomination } from '../../lib/shuls/denomination'
import { dedupDecision, type DedupCandidate } from '../../lib/shuls/dedup'
import type { Shul } from '../../lib/shuls/schema'
import type { RawShul } from './types'

interface Cluster {
  record: RawShul
  mergedFrom: RawShul[]
  review: boolean
}

const asCandidate = (r: RawShul): DedupCandidate => ({
  name: r.name,
  lat: r.lat,
  lng: r.lng,
  wikidataId: r.wikidataId,
  website: r.website,
  phone: r.phone,
  address: r.address,
})

/**
 * Cluster raw records into unique shuls (first-wins). Google records only ENRICH an existing
 * cluster with a place_id — they never become a stored primary (ToS: no Google content persisted).
 */
export function dedupeRaw(raws: RawShul[]): Cluster[] {
  // Order storable sources (osm, wikidata) first so google can only attach to them.
  const ordered = [...raws].sort((a, b) => (a.source === 'google' ? 1 : 0) - (b.source === 'google' ? 1 : 0))
  const clusters: Cluster[] = []
  for (const r of ordered) {
    let placed = false
    for (const c of clusters) {
      const decision = dedupDecision(asCandidate(c.record), asCandidate(r))
      if (decision === 'merge' || decision === 'review') {
        c.mergedFrom.push(r)
        if (decision === 'review') c.review = true
        if (r.googlePlaceId) c.record.googlePlaceId ??= r.googlePlaceId
        if (r.wikidataId) c.record.wikidataId ??= r.wikidataId
        if (r.website) c.record.website ??= r.website
        if (r.phone) c.record.phone ??= r.phone
        if (r.address) c.record.address ??= r.address
        if (r.tags) c.record.tags ??= r.tags
        placed = true
        break
      }
    }
    // A google-only record with no storable match is dropped (can't persist Google content).
    if (!placed && r.source !== 'google') clusters.push({ record: { ...r }, mergedFrom: [r], review: false })
  }
  return clusters
}

/** Build final Shul docs for a metro from raw records across sources. */
export function mergeToShuls(raws: RawShul[], metro: string, state: string): Shul[] {
  return dedupeRaw(raws).map(({ record, review }) => {
    const denomination = inferDenomination(record.name, record.tags)
    const needsReview = review || denomination.confidence === 'low'
    return {
      name: record.name,
      denomination,
      metro,
      state,
      lat: record.lat,
      lng: record.lng,
      geohash: geohashOf(record.lat, record.lng),
      address: record.address,
      website: record.website,
      phone: record.phone,
      googlePlaceId: record.googlePlaceId,
      source: record.source === 'google' ? 'osm' : record.source,
      status: 'active' as const,
      ...(needsReview ? { needsReview: true } : {}),
    }
  })
}
