import { describe, it, expect } from 'vitest'
import { boundingBox, boundsAround } from './bbox'
import { haversineMeters } from './geo'

describe('boundingBox', () => {
  it('spans roughly 2·radius north-to-south', () => {
    const c = { lat: 40.9, lng: -74.0 }
    const b = boundingBox(c, 800)
    const northSouth = haversineMeters({ lat: b.north, lng: c.lng }, { lat: b.south, lng: c.lng })
    expect(northSouth).toBeGreaterThan(1500)
    expect(northSouth).toBeLessThan(1700)
    expect(b.north).toBeGreaterThan(c.lat)
    expect(b.south).toBeLessThan(c.lat)
  })
})

describe('boundsAround', () => {
  it('covers every point plus the radius margin', () => {
    const pts = [
      { lat: 40.9, lng: -74.02 },
      { lat: 40.95, lng: -73.96 },
    ]
    const b = boundsAround(pts, 500)
    for (const p of pts) {
      expect(p.lat).toBeGreaterThan(b.south)
      expect(p.lat).toBeLessThan(b.north)
      expect(p.lng).toBeGreaterThan(b.west)
      expect(p.lng).toBeLessThan(b.east)
    }
  })
})
