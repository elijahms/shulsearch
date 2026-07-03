/** Dev smoke: live-fetch one metro's shuls from OSM and run them through the denomination pass. */
import { getMetro } from './metros'
import { fetchOsmShuls } from './osm'
import { inferDenomination } from '../../lib/shuls/denomination'

async function main() {
  const id = process.argv[2] ?? 'teaneck-bergen-nj'
  const metro = getMetro(id)
  if (!metro) throw new Error(`unknown metro ${id}`)
  const raw = await fetchOsmShuls(metro.bbox)
  console.log(`\nOSM returned ${raw.length} shuls for ${metro.name}\n`)
  for (const s of raw.slice(0, 20)) {
    const d = inferDenomination(s.name, s.tags)
    const denom = `${d.category}${d.subtype ? '/' + d.subtype : ''} (${d.confidence})`
    console.log(`  • ${s.name.padEnd(42)} ${denom.padEnd(28)} (${s.lat.toFixed(4)}, ${s.lng.toFixed(4)})`)
  }
  const needsReview = raw.filter((s) => inferDenomination(s.name, s.tags).confidence === 'low').length
  console.log(`\n${needsReview}/${raw.length} would be flagged needsReview (low-confidence denomination)\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
