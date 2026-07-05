import { describe, it, expect } from 'vitest'
import { aggregateSearches, type SearchRow } from './aggregate'

/** Epoch ms for a UTC calendar day (midnight). */
function day(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`)
}

/** Build a SearchRow, overriding a sensible default. */
function row(overrides: Partial<SearchRow> = {}): SearchRow {
  return {
    timestamp: day('2026-07-03'),
    metro: 'teaneck-bergen-nj',
    mode: 'specific',
    shulId: 'shul-a',
    denominationFilter: null,
    radius: 1609,
    listingType: 'buy',
    priceMin: null,
    priceMax: null,
    beds: null,
    resultCount: 3,
    zeroResults: false,
    sessionId: null,
    ...overrides,
  }
}

describe('aggregateSearches', () => {
  it('returns an empty-but-shaped result for no rows', () => {
    const a = aggregateSearches([], day('2026-07-03'))
    expect(a.total).toBe(0)
    expect(a.zeroResults).toBe(0)
    expect(a.zeroResultRate).toBe(0)
    expect(a.byMetro).toEqual([])
    expect(a.byShul).toEqual([])
    expect(a.byRadius).toEqual([])
    expect(a.byListingType).toEqual({ buy: 0, rent: 0 })
    expect(a.byMode).toEqual({ specific: 0, any: 0 })
    expect(a.daily).toHaveLength(14)
    expect(a.daily.every((d) => d.count === 0)).toBe(true)
  })

  it('computes the zero-result rate', () => {
    const rows = [
      row({ zeroResults: false }),
      row({ zeroResults: true }),
      row({ zeroResults: false }),
      row({ zeroResults: true }),
      row({ zeroResults: false }),
    ]
    const a = aggregateSearches(rows, day('2026-07-03'))
    expect(a.total).toBe(5)
    expect(a.zeroResults).toBe(2)
    expect(a.zeroResultRate).toBeCloseTo(0.4, 10)
  })

  it('orders metros and shuls by descending count', () => {
    const rows = [
      row({ metro: 'brooklyn-ny', shulId: 's1' }),
      row({ metro: 'brooklyn-ny', shulId: 's1' }),
      row({ metro: 'brooklyn-ny', shulId: 's2' }),
      row({ metro: 'lakewood-nj', shulId: 's3' }),
      row({ metro: null, shulId: null }), // nulls are ignored
    ]
    const a = aggregateSearches(rows, day('2026-07-03'))
    expect(a.byMetro).toEqual([
      { metro: 'brooklyn-ny', count: 3 },
      { metro: 'lakewood-nj', count: 1 },
    ])
    expect(a.byShul[0]).toEqual({ shulId: 's1', count: 2 })
    expect(a.byShul.map((s) => s.shulId)).not.toContain(null)
  })

  it('caps shuls at the top 10', () => {
    const rows = Array.from({ length: 15 }, (_, i) => row({ shulId: `shul-${i}` }))
    const a = aggregateSearches(rows, day('2026-07-03'))
    expect(a.byShul).toHaveLength(10)
  })

  it('splits listing type and mode', () => {
    const rows = [
      row({ listingType: 'buy', mode: 'specific' }),
      row({ listingType: 'buy', mode: 'any' }),
      row({ listingType: 'rent', mode: 'any' }),
    ]
    const a = aggregateSearches(rows, day('2026-07-03'))
    expect(a.byListingType).toEqual({ buy: 2, rent: 1 })
    expect(a.byMode).toEqual({ specific: 1, any: 2 })
  })

  it('sorts the radius distribution by ascending radius', () => {
    const rows = [row({ radius: 3218 }), row({ radius: 1609 }), row({ radius: 1609 }), row({ radius: 8047 })]
    const a = aggregateSearches(rows, day('2026-07-03'))
    expect(a.byRadius).toEqual([
      { radiusMeters: 1609, count: 2 },
      { radiusMeters: 3218, count: 1 },
      { radiusMeters: 8047, count: 1 },
    ])
  })

  it('buckets into the last 14 UTC days, zero-filled and ending on `now`', () => {
    const rows = [
      row({ timestamp: day('2026-07-03') }),
      row({ timestamp: day('2026-07-03') + 3_600_000 }), // same UTC day, later hour
      row({ timestamp: day('2026-06-30') }),
      row({ timestamp: day('2026-06-01') }), // older than the window -> excluded
    ]
    const a = aggregateSearches(rows, day('2026-07-03'))
    expect(a.daily).toHaveLength(14)
    expect(a.daily[a.daily.length - 1]).toEqual({ date: '2026-07-03', count: 2 })
    expect(a.daily[0].date).toBe('2026-06-20')
    const found = a.daily.find((d) => d.date === '2026-06-30')
    expect(found?.count).toBe(1)
    // The out-of-window row is not represented anywhere in the 14-day series.
    expect(a.daily.reduce((sum, d) => sum + d.count, 0)).toBe(3)
  })
})
