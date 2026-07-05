import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { serialize } from '../_lib/serialize'
import { aggregateSearches, type Analytics, type SearchRow } from '@/lib/analytics/aggregate'

export const runtime = 'nodejs'

/** Most-recent searches to aggregate. Bounds the read; older searches age out of the daily window anyway. */
const MAX_ROWS = 5000

function toNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function toNullableNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Serialized Firestore timestamp -> epoch ms (serialize() turns Timestamps into ISO strings). */
function toMs(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = Date.parse(v)
    return Number.isNaN(t) ? 0 : t
  }
  return 0
}

/** Map one serialized `searches` doc to a SearchRow, tolerating missing/legacy fields. */
function toSearchRow(data: Record<string, unknown>): SearchRow {
  return {
    timestamp: toMs(data.timestamp),
    metro: typeof data.metro === 'string' ? data.metro : null,
    mode: data.mode === 'specific' || data.mode === 'any' ? data.mode : null,
    shulId: typeof data.shulId === 'string' ? data.shulId : null,
    denominationFilter: typeof data.denominationFilter === 'string' ? data.denominationFilter : null,
    radius: toNumber(data.radius),
    listingType: data.listingType === 'rent' ? 'rent' : 'buy',
    priceMin: toNullableNumber(data.priceMin),
    priceMax: toNullableNumber(data.priceMax),
    beds: toNullableNumber(data.beds),
    resultCount: toNumber(data.resultCount),
    zeroResults: data.zeroResults === true,
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : null,
  }
}

/** GET /api/admin/analytics — aggregated search analytics (admin only). */
export async function GET(req: Request) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response

  try {
    const snap = await getAdminDb()
      .collection('searches')
      .orderBy('timestamp', 'desc')
      .limit(MAX_ROWS)
      .get()
    const rows = snap.docs.map((d) => toSearchRow(serialize(d.data())))
    return NextResponse.json(aggregateSearches(rows))
  } catch {
    // No data / missing index / local perms: degrade to an empty dashboard rather than a 500.
    const empty: Analytics = aggregateSearches([])
    return NextResponse.json(empty)
  }
}
