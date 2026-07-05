/**
 * Seed the `schools` collection from the NCES PSS public-use CSV.
 * Filters Jewish schools (ORIENT==18), assigns each to a metro by lat/lng, infers
 * schoolType/gender/hashkafa from the name, and upserts (idempotent via nces- doc id).
 *
 * Usage:  tsx src/scripts/seed-schools/index.ts [metroId]   (omit to seed all metros)
 * Emulator: set FIRESTORE_EMULATOR_HOST. Real Firestore: needs ADC + GOOGLE_CLOUD_PROJECT.
 */
import type { Firestore } from 'firebase-admin/firestore'
import { getMetro, metroForPoint } from '../../lib/metros'
import { geohashOf } from '../../lib/geo/geo'
import { getSeedDb } from '../seed/firestore'
import { parseJewishSchools } from '../../lib/schools/nces'
import { inferSchoolClassification } from '../../lib/schools/classify'
import { upsertSchools, countSchools } from '../../lib/schools/repo'
import type { School } from '../../lib/schools/schema'
import { loadNcesCsv } from './nces-download'

async function main() {
  const onlyMetro = process.argv[2] // optional metro id filter
  if (onlyMetro && !getMetro(onlyMetro)) throw new Error(`Unknown metro: ${onlyMetro}`)
  const target = process.env.FIRESTORE_EMULATOR_HOST ? 'EMULATOR' : 'REAL Firestore'
  console.log(`Seeding schools → ${target}${onlyMetro ? ` (metro ${onlyMetro})` : ''}`)

  const records = parseJewishSchools(await loadNcesCsv())
  console.log(`Parsed ${records.length} Jewish schools from NCES.`)

  const perMetro: Record<string, number> = {}
  const schools: School[] = []
  for (const r of records) {
    const metro = metroForPoint(r.lat, r.lng)
    if (!metro) continue
    if (onlyMetro && metro !== onlyMetro) continue
    const c = inferSchoolClassification(r.name, { level: r.level, gradeHigh: r.gradeHigh })
    schools.push({
      name: r.name,
      denomination: c.denomination,
      schoolType: c.schoolType,
      gender: c.gender,
      gradeLow: r.gradeLow,
      gradeHigh: r.gradeHigh,
      enrollment: r.enrollment,
      address: r.address,
      city: r.city,
      metro,
      state: r.state,
      zip: r.zip,
      lat: r.lat,
      lng: r.lng,
      geohash: geohashOf(r.lat, r.lng),
      ncesId: r.ncesId,
      source: 'nces',
      status: 'active',
      ...(c.needsReview ? { needsReview: true } : {}),
    })
    perMetro[metro] = (perMetro[metro] ?? 0) + 1
  }

  const db: Firestore = getSeedDb()
  const written = await upsertSchools(db, schools)
  console.log(`Upserted ${written} schools.`)
  console.log('Per metro:', Object.entries(perMetro).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '))
  const flagged = schools.filter((s) => s.needsReview).length
  console.log(`needsReview: ${flagged}/${schools.length} (${Math.round((flagged / schools.length) * 100)}%)`)
  console.log(`Total schools in Firestore: ${await countSchools(db)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
