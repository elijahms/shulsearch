import { describe, it, expect, beforeEach } from 'vitest'
import { getAdminDb } from '@/lib/firebase/admin'
import { upsertShuls, queryByMetro, countShuls } from '@/lib/shuls/repo'
import type { Shul } from '@/lib/shuls/schema'

const mk = (name: string, metro = 'test-metro'): Shul => ({
  name,
  denomination: { category: 'Orthodox', source: 'osm', confidence: 'high' },
  metro,
  state: 'NJ',
  lat: 40.9,
  lng: -74.0,
  geohash: 'dr5r7abcde',
  source: 'osm',
  status: 'active',
})

describe('shuls repo (emulator)', () => {
  const db = getAdminDb()

  beforeEach(async () => {
    const snap = await db.collection('shuls').get()
    await Promise.all(snap.docs.map((d) => d.ref.delete()))
  })

  it('upserts and queries by metro', async () => {
    await upsertShuls(db, [mk('Beth Israel'), mk('Young Israel', 'other-metro')])
    const teaneck = await queryByMetro(db, 'test-metro')
    expect(teaneck).toHaveLength(1)
    expect(teaneck[0].name).toBe('Beth Israel')
  })

  it('is idempotent on re-run (stable doc id, no duplicates)', async () => {
    await upsertShuls(db, [mk('Beth Israel')])
    await upsertShuls(db, [mk('Beth Israel')])
    expect(await countShuls(db)).toBe(1)
  })
})
