import 'server-only'
import { ShulSchema, type Shul, type Denomination } from '@/lib/shuls/schema'
import type { ShulPayloadT } from '@/lib/submissions/schema'
import { geohashOf } from '@/lib/geo/geo'

/** Merge an incoming payload with admin edits (edits win, ignoring undefined). */
export function mergePayload(payload: ShulPayloadT, edits?: Partial<ShulPayloadT>): ShulPayloadT {
  const out: ShulPayloadT = { ...payload }
  if (edits) {
    for (const [k, v] of Object.entries(edits)) {
      if (v !== undefined) (out as Record<string, unknown>)[k] = v
    }
  }
  return out
}

/** Geocode an address to lat/lng via Google Geocoding. Returns null if unavailable. */
export async function geocodeAddress(parts: {
  address?: string
  city?: string
  state?: string
  zip?: string
}): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  const query = [parts.address, parts.city, parts.state, parts.zip].filter(Boolean).join(', ')
  if (!key || !query) return null
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      results?: { geometry?: { location?: { lat: number; lng: number } } }[]
    }
    const loc = data.results?.[0]?.geometry?.location
    return loc ? { lat: loc.lat, lng: loc.lng } : null
  } catch {
    return null
  }
}

function denominationFrom(payload: ShulPayloadT): Denomination {
  if (!payload.denominationCategory) {
    throw new Error('denominationCategory is required to approve a new shul')
  }
  return {
    category: payload.denominationCategory,
    subtype: payload.denominationSubtype,
    source: 'admin',
    confidence: 'high',
  }
}

/**
 * Build a validated `Shul` from a "new" submission payload (+ admin edits).
 * Geocodes when lat/lng are missing but an address is present. Throws on invalid input.
 */
export async function buildNewShul(payload: ShulPayloadT, edits?: Partial<ShulPayloadT>): Promise<Shul> {
  const p = mergePayload(payload, edits)
  if (!p.name) throw new Error('name is required')
  if (!p.metro) throw new Error('metro is required')

  let lat = p.lat
  let lng = p.lng
  if ((lat === undefined || lng === undefined) && p.address) {
    const geo = await geocodeAddress(p)
    if (!geo) throw new Error('Could not geocode address; provide lat/lng or a valid address')
    lat = geo.lat
    lng = geo.lng
  }
  if (lat === undefined || lng === undefined) {
    throw new Error('lat/lng required (no address to geocode)')
  }

  const shul: Shul = {
    name: p.name,
    denomination: denominationFrom(p),
    address: p.address,
    city: p.city,
    metro: p.metro,
    state: p.state,
    zip: p.zip,
    lat,
    lng,
    geohash: geohashOf(lat, lng),
    phone: p.phone,
    website: p.website,
    source: 'admin',
    status: 'active',
  }
  return ShulSchema.parse(shul)
}

/**
 * Build a partial Firestore update for an existing shul from an edit/dispute payload (+edits).
 * Only fields present in the payload are written. Recomputes geohash if lat/lng change and
 * merges denomination against the existing record when only a subset is provided.
 */
export function buildShulUpdate(
  payload: ShulPayloadT,
  edits: Partial<ShulPayloadT> | undefined,
  existing: Partial<Shul> | undefined,
): Record<string, unknown> {
  const p = mergePayload(payload, edits)
  const update: Record<string, unknown> = {}

  const scalar: (keyof ShulPayloadT)[] = [
    'name',
    'address',
    'city',
    'metro',
    'state',
    'zip',
    'phone',
    'website',
  ]
  for (const key of scalar) {
    if (p[key] !== undefined) update[key] = p[key]
  }

  if (p.lat !== undefined) update.lat = p.lat
  if (p.lng !== undefined) update.lng = p.lng
  const newLat = p.lat ?? existing?.lat
  const newLng = p.lng ?? existing?.lng
  if ((p.lat !== undefined || p.lng !== undefined) && newLat !== undefined && newLng !== undefined) {
    update.geohash = geohashOf(newLat, newLng)
  }

  if (p.denominationCategory !== undefined || p.denominationSubtype !== undefined) {
    const category = p.denominationCategory ?? existing?.denomination?.category
    if (category) {
      update.denomination = {
        category,
        subtype: p.denominationSubtype ?? existing?.denomination?.subtype,
        source: 'admin',
        confidence: 'high',
      } satisfies Denomination
    }
  }

  return update
}
