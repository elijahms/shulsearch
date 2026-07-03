/** A launch metro and its bounding box. Client-safe (pure data, no server imports). */
export interface Metro {
  id: string
  name: string
  state: string
  /** [south, west, north, east] = [minLat, minLng, maxLat, maxLng] (Overpass order). */
  bbox: [number, number, number, number]
}

/** ~11 launch metros (spec §7). BBoxes are approximate; admin curation refines coverage. */
export const METROS: Metro[] = [
  { id: 'brooklyn-ny', name: 'Brooklyn', state: 'NY', bbox: [40.57, -74.05, 40.74, -73.83] },
  { id: 'queens-ny', name: 'Queens', state: 'NY', bbox: [40.55, -73.87, 40.8, -73.7] },
  { id: 'five-towns-ny', name: 'Five Towns / Nassau', state: 'NY', bbox: [40.58, -73.78, 40.66, -73.66] },
  { id: 'teaneck-bergen-nj', name: 'Teaneck / Bergen', state: 'NJ', bbox: [40.84, -74.12, 40.96, -73.94] },
  { id: 'lakewood-nj', name: 'Lakewood', state: 'NJ', bbox: [40.03, -74.27, 40.14, -74.13] },
  { id: 'passaic-nj', name: 'Passaic / Clifton', state: 'NJ', bbox: [40.82, -74.17, 40.89, -74.08] },
  { id: 'monsey-ny', name: 'Monsey', state: 'NY', bbox: [41.08, -74.12, 41.18, -74.0] },
  { id: 'baltimore-md', name: 'Baltimore / Pikesville', state: 'MD', bbox: [39.33, -76.78, 39.43, -76.66] },
  { id: 'los-angeles-ca', name: 'Los Angeles', state: 'CA', bbox: [34.02, -118.44, 34.2, -118.28] },
  { id: 'miami-boca-fl', name: 'Miami / Boca Raton', state: 'FL', bbox: [25.73, -80.22, 26.42, -80.04] },
  { id: 'chicago-il', name: 'Chicago / West Rogers Park', state: 'IL', bbox: [41.96, -87.74, 42.03, -87.66] },
]

export function getMetro(id: string): Metro | undefined {
  return METROS.find((m) => m.id === id)
}

/** Center point of a metro's bbox (for map initial view). */
export function metroCenter(m: Metro): { lat: number; lng: number } {
  const [s, w, n, e] = m.bbox
  return { lat: (s + n) / 2, lng: (w + e) / 2 }
}
