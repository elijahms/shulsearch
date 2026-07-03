import type { RawShul } from './types'
import { USER_AGENT } from './osm'

const WDQS = 'https://query.wikidata.org/sparql'

/** SPARQL box query for synagogues (Q34627). Corners are Point(lon lat). */
export function buildSparql(sw: [number, number], ne: [number, number]): string {
  return `SELECT ?item ?itemLabel ?coord WHERE {
  SERVICE wikibase:box {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:cornerSouthWest "Point(${sw[0]} ${sw[1]})"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerNorthEast "Point(${ne[0]} ${ne[1]})"^^geo:wktLiteral .
  }
  ?item wdt:P31/wdt:P279* wd:Q34627 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`
}

interface Binding {
  item: { value: string }
  itemLabel?: { value: string }
  coord: { value: string }
}

const qidOf = (uri: string) => uri.replace('http://www.wikidata.org/entity/', '')

/** Parse SPARQL bindings; coord is WKT `Point(lon lat)` — longitude first. */
export function parseWikidata(bindings: Binding[]): RawShul[] {
  const out: RawShul[] = []
  for (const b of bindings) {
    const m = /Point\(\s*([-\d.eE]+)\s+([-\d.eE]+)\s*\)/.exec(b.coord.value)
    if (!m) continue
    const lon = parseFloat(m[1])
    const lat = parseFloat(m[2])
    const qid = qidOf(b.item.value)
    const name = b.itemLabel?.value
    if (!name || name === qid) continue // unlabeled entity → skip
    out.push({ source: 'wikidata', sourceId: qid, name, lat, lng: lon, wikidataId: qid })
  }
  return out
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>

/** bbox is Overpass order [s,w,n,e]; Wikidata box corners are [lon,lat]. */
export async function fetchWikidataShuls(
  bbox: [number, number, number, number],
  fetchImpl: FetchLike = fetch,
): Promise<RawShul[]> {
  const [s, w, n, e] = bbox
  const url = `${WDQS}?query=${encodeURIComponent(buildSparql([w, s], [e, n]))}`
  const res = await fetchImpl(url, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT },
  })
  if (res.status === 429) throw new Error(`WDQS throttled; Retry-After=${res.headers.get('Retry-After')}`)
  const text = await res.text()
  if (!res.ok) throw new Error(`WDQS ${res.status}: ${text.slice(0, 200)}`)
  const data = JSON.parse(text) as { results: { bindings: Binding[] } }
  return parseWikidata(data.results.bindings ?? [])
}
