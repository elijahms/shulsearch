import 'server-only'
import type { LatLng } from '../geo/geo'

const ENDPOINT = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'

export interface WalkResult {
  meters: number
  seconds: number
}

interface MatrixRow {
  destinationIndex: number
  distanceMeters?: number
  duration?: string
  condition?: string
}

/**
 * Walking distance/time from one origin to many destinations via the Routes API.
 * Best-effort: returns an empty map if no key is configured or the call fails (walk times are an
 * enhancement, not required). Field mask kept to duration+distance to stay in the cheap tier.
 */
export async function walkingTimes(origin: LatLng, destinations: LatLng[]): Promise<Map<number, WalkResult>> {
  const out = new Map<number, WalkResult>()
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key || destinations.length === 0) return out
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,condition',
      },
      body: JSON.stringify({
        origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
        destinations: destinations.map((d) => ({
          waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
        })),
        travelMode: 'WALK',
      }),
    })
    if (!res.ok) return out
    const rows = (await res.json()) as MatrixRow[]
    for (const row of rows) {
      if (row.condition && row.condition !== 'ROUTE_EXISTS') continue
      out.set(row.destinationIndex, {
        meters: row.distanceMeters ?? 0,
        seconds: row.duration ? parseInt(String(row.duration).replace('s', ''), 10) || 0 : 0,
      })
    }
  } catch {
    // walk times are optional — swallow and return whatever we have
  }
  return out
}
