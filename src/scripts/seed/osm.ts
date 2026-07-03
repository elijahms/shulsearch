import type { RawShul } from './types'

const OVERPASS = 'https://overpass-api.de/api/interpreter'
export const USER_AGENT =
  'ShulSearch/1.0 (https://shulsearch--shulsearch-app.us-east4.hosted.app; github.com/elijahms/shulsearch)'

export interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

/** Canonical Overpass QL for Jewish houses of worship in a bbox (union of two selectors). */
export function buildOverpassQuery([s, w, n, e]: [number, number, number, number]): string {
  return `[out:json][timeout:60];
(
  nwr["amenity"="place_of_worship"]["religion"="jewish"](${s},${w},${n},${e});
  nwr["building"="synagogue"](${s},${w},${n},${e});
);
out center tags;`
}

const coordsOf = (el: OverpassElement): { lat: number; lon: number } | null =>
  el.lat != null && el.lon != null ? { lat: el.lat, lon: el.lon } : (el.center ?? null)

/** Parse Overpass elements into RawShul records (only those with a name + coordinates). */
export function parseOverpass(elements: OverpassElement[]): RawShul[] {
  const out: RawShul[] = []
  for (const el of elements) {
    const tags = el.tags ?? {}
    const name = tags.name ?? tags['name:en']
    const c = coordsOf(el)
    if (!name || !c) continue
    // Skip cemeteries/graveyards that also carry religion=jewish.
    if (tags.amenity === 'grave_yard' || tags.landuse === 'cemetery') continue
    out.push({
      source: 'osm',
      sourceId: `${el.type}/${el.id}`,
      name,
      lat: c.lat,
      lng: c.lon,
      wikidataId: tags.wikidata,
      website: tags.website ?? tags['contact:website'],
      phone: tags.phone ?? tags['contact:phone'],
      address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
        .filter(Boolean)
        .join(' ') || undefined,
      tags,
    })
  }
  return out
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>

/** Fetch Jewish houses of worship from Overpass for a bbox. Guards the HTTP-200-HTML busy error. */
export async function fetchOsmShuls(
  bbox: [number, number, number, number],
  fetchImpl: FetchLike = fetch,
): Promise<RawShul[]> {
  const res = await fetchImpl(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({ data: buildOverpassQuery(bbox) }).toString(),
  })
  const text = await res.text()
  // Overpass returns HTTP 200 with an HTML/XML body when overloaded — sniff before parsing.
  if (!res.ok || !text.trimStart().startsWith('{')) {
    throw new Error(`Overpass ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = JSON.parse(text) as { elements: OverpassElement[] }
  return parseOverpass(data.elements ?? [])
}
