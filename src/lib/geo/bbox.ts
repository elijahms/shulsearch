import type { LatLng } from './geo'
import type { ListingBounds } from '../listings/types'

const METERS_PER_DEG_LAT = 111_320

/** Bounding box of `radiusMeters` around a center point. */
export function boundingBox(center: LatLng, radiusMeters: number): ListingBounds {
  const dLat = radiusMeters / METERS_PER_DEG_LAT
  const dLng = radiusMeters / (METERS_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180))
  return {
    north: center.lat + dLat,
    south: center.lat - dLat,
    east: center.lng + dLng,
    west: center.lng - dLng,
  }
}

/** Bounds covering all points, expanded by radius (for "any shul in the metro" mode). */
export function boundsAround(points: LatLng[], radiusMeters: number): ListingBounds {
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const midLat = (Math.max(...lats) + Math.min(...lats)) / 2
  const dLat = radiusMeters / METERS_PER_DEG_LAT
  const dLng = radiusMeters / (METERS_PER_DEG_LAT * Math.cos((midLat * Math.PI) / 180))
  return {
    north: Math.max(...lats) + dLat,
    south: Math.min(...lats) - dLat,
    east: Math.max(...lngs) + dLng,
    west: Math.min(...lngs) - dLng,
  }
}
