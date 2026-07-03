import { describe, it, expect } from 'vitest'
import { mergePayload, buildNewShul, buildShulUpdate } from './apply'
import type { ShulPayloadT } from '@/lib/submissions/schema'
import type { Shul } from '@/lib/shuls/schema'

describe('mergePayload', () => {
  it('lets edits override payload but ignores undefined edits', () => {
    const payload: ShulPayloadT = { name: 'Old', city: 'Teaneck' }
    const merged = mergePayload(payload, { name: 'New', city: undefined })
    expect(merged.name).toBe('New')
    expect(merged.city).toBe('Teaneck')
  })
})

describe('buildNewShul', () => {
  const base: ShulPayloadT = {
    name: 'Congregation Test',
    denominationCategory: 'Orthodox',
    denominationSubtype: 'Modern Orthodox',
    metro: 'teaneck-bergen-nj',
    lat: 40.9,
    lng: -74.02,
  }

  it('builds a valid admin-sourced active shul with a geohash', async () => {
    const shul = await buildNewShul(base)
    expect(shul.source).toBe('admin')
    expect(shul.status).toBe('active')
    expect(shul.denomination).toEqual({
      category: 'Orthodox',
      subtype: 'Modern Orthodox',
      source: 'admin',
      confidence: 'high',
    })
    expect(shul.geohash.length).toBeGreaterThan(0)
  })

  it('applies admin edits over the payload', async () => {
    const shul = await buildNewShul(base, { name: 'Renamed', denominationCategory: 'Conservative' })
    expect(shul.name).toBe('Renamed')
    expect(shul.denomination.category).toBe('Conservative')
  })

  it('throws when denominationCategory is missing', async () => {
    const payload: ShulPayloadT = { name: 'No Denom', metro: 'teaneck-bergen-nj', lat: 40.9, lng: -74.02 }
    await expect(buildNewShul(payload)).rejects.toThrow(/denominationCategory/)
  })

  it('throws when there is no lat/lng and no address to geocode', async () => {
    const payload: ShulPayloadT = {
      name: 'No Coords',
      denominationCategory: 'Orthodox',
      metro: 'teaneck-bergen-nj',
    }
    await expect(buildNewShul(payload)).rejects.toThrow(/lat\/lng/)
  })
})

describe('buildShulUpdate', () => {
  const existing: Partial<Shul> = {
    name: 'Existing',
    lat: 40.9,
    lng: -74.02,
    denomination: { category: 'Orthodox', subtype: 'Modern Orthodox', source: 'osm', confidence: 'low' },
  }

  it('writes only the provided scalar fields', () => {
    const update = buildShulUpdate({ website: 'https://x.org' }, undefined, existing)
    expect(update).toEqual({ website: 'https://x.org' })
  })

  it('recomputes geohash when coordinates change', () => {
    const update = buildShulUpdate({ lat: 41.0, lng: -74.1 }, undefined, existing)
    expect(update.lat).toBe(41.0)
    expect(update.lng).toBe(-74.1)
    expect(typeof update.geohash).toBe('string')
  })

  it('merges a subtype-only denomination change against the existing category', () => {
    const update = buildShulUpdate({ denominationSubtype: 'Yeshivish' }, undefined, existing)
    expect(update.denomination).toEqual({
      category: 'Orthodox',
      subtype: 'Yeshivish',
      source: 'admin',
      confidence: 'high',
    })
  })
})
