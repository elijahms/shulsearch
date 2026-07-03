import { describe, it, expect } from 'vitest'
import { parseOverpass, fetchOsmShuls, buildOverpassQuery, type OverpassElement } from './osm'

const elements: OverpassElement[] = [
  {
    type: 'node',
    id: 1,
    lat: 40.9,
    lon: -74.01,
    tags: {
      name: 'Congregation Beth Sholom',
      religion: 'jewish',
      amenity: 'place_of_worship',
      denomination: 'conservative',
      wikidata: 'Q123',
      website: 'https://bethsholom.org',
    },
  },
  { type: 'way', id: 2, center: { lat: 40.91, lon: -74.02 }, tags: { name: 'Young Israel of Teaneck', building: 'synagogue' } },
  { type: 'node', id: 3, lat: 40.92, lon: -74.0, tags: { religion: 'jewish', amenity: 'grave_yard', name: 'Old Cemetery' } },
  { type: 'node', id: 4, lat: 40.93, lon: -74.0, tags: { amenity: 'place_of_worship', religion: 'jewish' } },
]

describe('parseOverpass', () => {
  it('keeps named shuls with coords, extracts wikidata/website, skips cemeteries + nameless', () => {
    const r = parseOverpass(elements)
    expect(r).toHaveLength(2)
    expect(r[0].name).toBe('Congregation Beth Sholom')
    expect(r[0].wikidataId).toBe('Q123')
    expect(r[0].tags?.denomination).toBe('conservative')
    expect(r[1].lat).toBe(40.91) // from `center`
    expect(r[1].sourceId).toBe('way/2')
  })
})

describe('buildOverpassQuery', () => {
  it('includes both selectors and the bbox in (s,w,n,e) order', () => {
    const q = buildOverpassQuery([40.84, -74.12, 40.96, -73.94])
    expect(q).toContain('"religion"="jewish"')
    expect(q).toContain('"building"="synagogue"')
    expect(q).toContain('(40.84,-74.12,40.96,-73.94)')
  })
})

describe('fetchOsmShuls', () => {
  const resp = (body: string, ok = true, status = 200) =>
    ({ ok, status, text: async () => body }) as Response

  it('parses a JSON response', async () => {
    const fake = async () => resp(JSON.stringify({ elements }))
    const r = await fetchOsmShuls([0, 0, 1, 1], fake)
    expect(r).toHaveLength(2)
  })

  it('throws on the HTTP-200 HTML busy error', async () => {
    const fake = async () => resp('<html>The server is probably too busy</html>')
    await expect(fetchOsmShuls([0, 0, 1, 1], fake)).rejects.toThrow(/Overpass/)
  })
})
