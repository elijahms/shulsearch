/** A raw candidate record from any source, before dedup/normalization into a Shul. */
export interface RawShul {
  source: 'osm' | 'wikidata' | 'google'
  /** Stable id within the source (OSM `type/id`, Wikidata QID, Google place_id). */
  sourceId: string
  name: string
  lat: number
  lng: number
  /** Cross-source join key (OSM `wikidata` tag / Wikidata QID). */
  wikidataId?: string
  address?: string
  website?: string
  phone?: string
  /** Raw source tags (e.g. OSM `denomination`) used for denomination inference. */
  tags?: Record<string, string>
  /** Google place_id (the only Google-sourced value we may persist). */
  googlePlaceId?: string
}
