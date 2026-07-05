/**
 * Pure, deterministic aggregation over logged searches.
 *
 * `aggregateSearches` takes raw search rows and rolls them up into the shape the
 * admin analytics dashboard renders. It performs no I/O and reads no globals other
 * than the optional `now` argument (which defaults to `Date.now()` only so the API
 * can call it with a single argument) — pass a fixed `now` in tests for determinism.
 */

/** One logged search. `timestamp` is epoch milliseconds. Mirrors the `searches` Firestore doc. */
export interface SearchRow {
  timestamp: number
  metro: string | null
  mode: 'specific' | 'any' | null
  shulId: string | null
  denominationFilter: string | null
  /** Search radius in meters. */
  radius: number
  listingType: 'buy' | 'rent'
  priceMin: number | null
  priceMax: number | null
  beds: number | null
  resultCount: number
  zeroResults: boolean
  sessionId: string | null
}

export interface MetroCount {
  metro: string
  count: number
}

export interface ShulCount {
  shulId: string
  count: number
}

export interface RadiusCount {
  radiusMeters: number
  count: number
}

export interface DailyCount {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string
  count: number
}

export interface Analytics {
  total: number
  zeroResults: number
  /** Fraction in [0, 1]; `0` when there are no searches. */
  zeroResultRate: number
  byMetro: MetroCount[]
  byShul: ShulCount[]
  byRadius: RadiusCount[]
  byListingType: { buy: number; rent: number }
  byMode: { specific: number; any: number }
  daily: DailyCount[]
}

const DAY_MS = 86_400_000
const DAILY_WINDOW = 14

/** UTC calendar day (`YYYY-MM-DD`) for an epoch-ms timestamp. */
function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Midnight (UTC) at the start of the day containing `ms`, as epoch ms. */
function startOfUtcDay(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** Increment `map[key]`, treating missing keys as 0. */
function bump<K>(map: Map<K, number>, key: K): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

/**
 * Roll raw search rows up into dashboard-ready analytics.
 *
 * @param rows  Logged searches (any order).
 * @param now   End of the 14-day daily window, epoch ms (defaults to `Date.now()`).
 */
export function aggregateSearches(rows: SearchRow[], now: number = Date.now()): Analytics {
  const total = rows.length
  let zeroResults = 0
  let buy = 0
  let rent = 0
  let specific = 0
  let any = 0

  const metroCounts = new Map<string, number>()
  const shulCounts = new Map<string, number>()
  const radiusCounts = new Map<number, number>()
  const dayCounts = new Map<string, number>()

  for (const row of rows) {
    if (row.zeroResults) zeroResults++
    if (row.listingType === 'buy') buy++
    else if (row.listingType === 'rent') rent++
    if (row.mode === 'specific') specific++
    else if (row.mode === 'any') any++

    if (row.metro) bump(metroCounts, row.metro)
    if (row.shulId) bump(shulCounts, row.shulId)
    if (typeof row.radius === 'number' && Number.isFinite(row.radius)) bump(radiusCounts, row.radius)
    bump(dayCounts, utcDay(row.timestamp))
  }

  const byMetro: MetroCount[] = [...metroCounts.entries()]
    .map(([metro, count]) => ({ metro, count }))
    .sort((a, b) => b.count - a.count || a.metro.localeCompare(b.metro))

  const byShul: ShulCount[] = [...shulCounts.entries()]
    .map(([shulId, count]) => ({ shulId, count }))
    .sort((a, b) => b.count - a.count || a.shulId.localeCompare(b.shulId))
    .slice(0, 10)

  // Ascending radius reads naturally as a distribution (1mi, 2mi, 3mi …).
  const byRadius: RadiusCount[] = [...radiusCounts.entries()]
    .map(([radiusMeters, count]) => ({ radiusMeters, count }))
    .sort((a, b) => a.radiusMeters - b.radiusMeters)

  // Last 14 UTC days ending on the day containing `now`, zero-filled.
  const endDay = startOfUtcDay(now)
  const daily: DailyCount[] = []
  for (let i = DAILY_WINDOW - 1; i >= 0; i--) {
    const date = utcDay(endDay - i * DAY_MS)
    daily.push({ date, count: dayCounts.get(date) ?? 0 })
  }

  return {
    total,
    zeroResults,
    zeroResultRate: total > 0 ? zeroResults / total : 0,
    byMetro,
    byShul,
    byRadius,
    byListingType: { buy, rent },
    byMode: { specific, any },
    daily,
  }
}
