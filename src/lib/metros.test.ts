import { describe, it, expect } from 'vitest'
import { metroForPoint } from './metros'

describe('metroForPoint', () => {
  it('assigns a Teaneck coordinate to teaneck-bergen-nj', () => {
    expect(metroForPoint(40.9057, -74.0201)).toBe('teaneck-bergen-nj')
  })
  it('assigns a Lakewood coordinate to lakewood-nj', () => {
    expect(metroForPoint(40.09, -74.2)).toBe('lakewood-nj')
  })
  it('returns null for a point outside every metro (Birmingham AL)', () => {
    expect(metroForPoint(33.5118, -86.7537)).toBeNull()
  })
})
