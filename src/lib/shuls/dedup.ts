import { haversineMeters } from '../geo/geo'
import { nameTokens, diceCoefficient } from './normalize'

export type DedupDecision = 'merge' | 'review' | 'distinct'

export interface DedupCandidate {
  name: string
  lat: number
  lng: number
  wikidataId?: string
  address?: string
  website?: string
  phone?: string
}

const GEOBLOCK_M = 150 // OSM/Wikidata/Google place the same shul a few–100m apart
const MERGE_SCORE = 0.85
const REVIEW_SCORE = 0.6

function domain(url?: string): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

function phone10(p?: string): string | undefined {
  const d = p?.replace(/\D/g, '')
  return d && d.length >= 7 ? d.slice(-10) : undefined
}

/**
 * Decide whether two candidate records are the same shul.
 * Order: shared Wikidata id (strongest) → geoblock gate → shared contact/site → fuzzy name.
 * 'review' means an admin should confirm the merge (borderline name overlap).
 */
export function dedupDecision(a: DedupCandidate, b: DedupCandidate): DedupDecision {
  if (a.wikidataId && b.wikidataId && a.wikidataId === b.wikidataId) return 'merge'

  const dist = haversineMeters({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng })
  if (dist > GEOBLOCK_M) return 'distinct'

  const da = domain(a.website)
  if (da && da === domain(b.website)) return 'merge'

  const pa = phone10(a.phone)
  if (pa && pa === phone10(b.phone)) return 'merge'

  const score = diceCoefficient(nameTokens(a.name), nameTokens(b.name))
  if (score >= MERGE_SCORE) return 'merge'
  if (score >= REVIEW_SCORE) return 'review'
  return 'distinct'
}
