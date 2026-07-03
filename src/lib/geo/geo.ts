import { geohashForLocation, distanceBetween } from 'geofire-common'

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Great-circle distance in METERS between two points.
 * (geofire's distanceBetween returns kilometers — the classic footgun — so we ×1000.)
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  return distanceBetween([a.lat, a.lng], [b.lat, b.lng]) * 1000
}

/** geofire-compatible precision-10 geohash for a coordinate (stored on each shul doc). */
export function geohashOf(lat: number, lng: number): string {
  return geohashForLocation([lat, lng])
}
