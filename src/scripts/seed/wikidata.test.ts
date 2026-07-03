import { describe, it, expect } from 'vitest'
import { parseWikidata, buildSparql, fetchWikidataShuls } from './wikidata'

const bindings = [
  {
    item: { value: 'http://www.wikidata.org/entity/Q6730094' },
    itemLabel: { value: 'Magen David Synagogue' },
    coord: { value: 'Point(-73.9864 40.6151)' },
  },
  // unlabeled → skipped
  { item: { value: 'http://www.wikidata.org/entity/Q999' }, coord: { value: 'Point(-74 40.9)' } },
]

describe('parseWikidata', () => {
  it('parses Point(lon lat) into lat/lng and extracts the QID', () => {
    const r = parseWikidata(bindings as never)
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('Magen David Synagogue')
    expect(r[0].wikidataId).toBe('Q6730094')
    expect(r[0].lat).toBeCloseTo(40.6151)
    expect(r[0].lng).toBeCloseTo(-73.9864) // longitude first in WKT
  })
})

describe('buildSparql', () => {
  it('targets the synagogue class Q34627 with lon-first corners', () => {
    const q = buildSparql([-74.12, 40.84], [-73.94, 40.96])
    expect(q).toContain('wd:Q34627')
    expect(q).toContain('Point(-74.12 40.84)')
  })
})

describe('fetchWikidataShuls', () => {
  it('converts an [s,w,n,e] bbox to lon-first corners and parses results', async () => {
    let capturedUrl = ''
    const fake = async (url: string) => {
      capturedUrl = url
      return { ok: true, status: 200, text: async () => JSON.stringify({ results: { bindings } }) } as Response
    }
    const r = await fetchWikidataShuls([40.84, -74.12, 40.96, -73.94], fake)
    expect(r).toHaveLength(1)
    expect(decodeURIComponent(capturedUrl)).toContain('Point(-74.12 40.84)') // sw = [w,s]
  })
})
