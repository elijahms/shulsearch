/** A launch metro and its bounding box. Client-safe (pure data, no server imports). */
export interface Metro {
  id: string
  name: string
  state: string
  /** 1 = established large community, 2 = growing/mid-size community. */
  tier: 1 | 2
  /** [south, west, north, east] = [minLat, minLng, maxLat, maxLng] (Overpass order). */
  bbox: [number, number, number, number]
}

/** Tier-1 established communities (spec §7). */
const TIER1: Metro[] = [
  { id: 'brooklyn-ny', name: 'Brooklyn', state: 'NY', tier: 1, bbox: [40.57, -74.05, 40.74, -73.83] },
  { id: 'queens-ny', name: 'Queens', state: 'NY', tier: 1, bbox: [40.55, -73.87, 40.8, -73.7] },
  { id: 'five-towns-ny', name: 'Five Towns / Nassau', state: 'NY', tier: 1, bbox: [40.58, -73.78, 40.66, -73.66] },
  { id: 'teaneck-bergen-nj', name: 'Teaneck / Bergen', state: 'NJ', tier: 1, bbox: [40.84, -74.12, 40.96, -73.94] },
  { id: 'lakewood-nj', name: 'Lakewood', state: 'NJ', tier: 1, bbox: [40.03, -74.27, 40.14, -74.13] },
  { id: 'passaic-nj', name: 'Passaic / Clifton', state: 'NJ', tier: 1, bbox: [40.82, -74.17, 40.89, -74.08] },
  { id: 'monsey-ny', name: 'Monsey', state: 'NY', tier: 1, bbox: [41.08, -74.12, 41.18, -74.0] },
  { id: 'baltimore-md', name: 'Baltimore / Pikesville', state: 'MD', tier: 1, bbox: [39.33, -76.78, 39.43, -76.66] },
  { id: 'los-angeles-ca', name: 'Los Angeles', state: 'CA', tier: 1, bbox: [34.02, -118.44, 34.2, -118.28] },
  { id: 'miami-boca-fl', name: 'Miami / Boca Raton', state: 'FL', tier: 1, bbox: [25.73, -80.22, 26.42, -80.04] },
  { id: 'chicago-il', name: 'Chicago / West Rogers Park', state: 'IL', tier: 1, bbox: [41.96, -87.74, 42.03, -87.66] },
]

/** Tier-2 growing / mid-size communities. */
const TIER2: Metro[] = [
  { id: 'dallas-tx', name: 'Dallas', state: 'TX', tier: 2, bbox: [32.83, -96.88, 32.97, -96.72] },
  { id: 'houston-tx', name: 'Houston (Meyerland)', state: 'TX', tier: 2, bbox: [29.64, -95.52, 29.75, -95.39] },
  { id: 'atlanta-ga', name: 'Atlanta (Toco Hills)', state: 'GA', tier: 2, bbox: [33.79, -84.37, 33.88, -84.26] },
  { id: 'phoenix-az', name: 'Phoenix / Scottsdale', state: 'AZ', tier: 2, bbox: [33.46, -112.0, 33.62, -111.86] },
  { id: 'denver-co', name: 'Denver', state: 'CO', tier: 2, bbox: [39.6, -105.06, 39.73, -104.88] },
  { id: 'cleveland-oh', name: 'Cleveland (Beachwood)', state: 'OH', tier: 2, bbox: [41.44, -81.56, 41.53, -81.44] },
  { id: 'detroit-mi', name: 'Detroit (Oak Park)', state: 'MI', tier: 2, bbox: [42.43, -83.32, 42.53, -83.18] },
  { id: 'boston-ma', name: 'Boston (Brookline / Newton)', state: 'MA', tier: 2, bbox: [42.29, -71.27, 42.37, -71.09] },
  { id: 'philadelphia-pa', name: 'Philadelphia', state: 'PA', tier: 2, bbox: [39.94, -75.28, 40.11, -75.02] },
  { id: 'silver-spring-md', name: 'Silver Spring / Kemp Mill', state: 'MD', tier: 2, bbox: [39.0, -77.07, 39.09, -76.96] },
  { id: 'st-louis-mo', name: 'St. Louis (University City)', state: 'MO', tier: 2, bbox: [38.63, -90.37, 38.71, -90.26] },
  { id: 'memphis-tn', name: 'Memphis', state: 'TN', tier: 2, bbox: [35.09, -89.92, 35.17, -89.8] },
  { id: 'las-vegas-nv', name: 'Las Vegas (Summerlin)', state: 'NV', tier: 2, bbox: [36.09, -115.34, 36.21, -115.18] },
]

export const METROS: Metro[] = [...TIER1, ...TIER2]

export function getMetro(id: string): Metro | undefined {
  return METROS.find((m) => m.id === id)
}

/** Center point of a metro's bbox (for map initial view). */
export function metroCenter(m: Metro): { lat: number; lng: number } {
  const [s, w, n, e] = m.bbox
  return { lat: (s + n) / 2, lng: (w + e) / 2 }
}
