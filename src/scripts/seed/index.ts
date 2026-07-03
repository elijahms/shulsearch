/**
 * Seed orchestrator. Per metro: fetch OSM (+ Wikidata) → merge/dedup → denomination → upsert.
 * Targets the emulator when FIRESTORE_EMULATOR_HOST is set, else real Firestore (needs ADC).
 *
 * Usage:  tsx src/scripts/seed/index.ts [metroId]   (omit metroId to seed all launch metros)
 */
import type { Firestore } from 'firebase-admin/firestore'
import { METROS, getMetro, type Metro } from './metros'
import { fetchOsmShuls } from './osm'
import { fetchWikidataShuls } from './wikidata'
import { mergeToShuls } from './merge'
import { getSeedDb } from './firestore'
import { upsertShuls, countShuls } from '../../lib/shuls/repo'
import type { RawShul } from './types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Retry transient public-infra failures (Overpass 429/504, WDQS throttling) with backoff. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 4000): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) await sleep(baseMs * (i + 1))
    }
  }
  throw lastErr
}

async function seedMetro(db: Firestore, metro: Metro) {
  const raws: RawShul[] = []
  try {
    raws.push(...(await withRetry(() => fetchOsmShuls(metro.bbox))))
  } catch (e) {
    console.warn(`  ! OSM failed for ${metro.name}: ${String(e).slice(0, 120)}`)
  }
  await sleep(2000) // be polite to public infrastructure
  try {
    raws.push(...(await withRetry(() => fetchWikidataShuls(metro.bbox))))
  } catch (e) {
    console.warn(`  ! Wikidata failed for ${metro.name}: ${String(e).slice(0, 120)}`)
  }
  const shuls = mergeToShuls(raws, metro.id, metro.state)
  const written = await upsertShuls(db, shuls)
  const review = shuls.filter((s) => s.needsReview).length
  console.log(
    `  ${metro.name.padEnd(28)} raw=${String(raws.length).padStart(3)}  unique=${String(shuls.length).padStart(3)}  written=${written}  needsReview=${review}`,
  )
  return { unique: shuls.length, review }
}

async function main() {
  const arg = process.argv[2]
  const metros = arg ? [getMetro(arg)].filter((m): m is Metro => !!m) : METROS
  if (metros.length === 0) throw new Error(`unknown metro: ${arg}`)
  const target = process.env.FIRESTORE_EMULATOR_HOST ? 'EMULATOR' : 'REAL Firestore'
  console.log(`\nSeeding ${metros.length} metro(s) → ${target}\n`)

  const db = getSeedDb()
  let total = 0
  let totalReview = 0
  for (const m of metros) {
    const r = await seedMetro(db, m)
    total += r.unique
    totalReview += r.review
    await sleep(1500)
  }
  const inDb = await countShuls(db)
  console.log(`\nDone. ${total} unique shuls this run; ${totalReview} needsReview; ${inDb} total in collection.\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
