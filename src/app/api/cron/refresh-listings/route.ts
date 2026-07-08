import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { writeMetroListings } from '@/lib/listings/cache'
import { getOriginListingsProvider } from '@/lib/listings/provider'
import type { ListingBounds, ListingType } from '@/lib/listings/types'
import { METROS, metroSearchLocation, type Metro } from '@/lib/metros'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LISTING_TYPES: ListingType[] = ['buy', 'rent']
// How many metro pulls run at once. Small enough to stay within RapidAPI rate limits;
// 48 jobs / 5 ≈ 10 waves × a few seconds each stays well inside Cloud Run's default
// 300s request timeout (App Hosting exposes no timeout knob in runConfig).
const CONCURRENCY = 5

interface JobResult {
  metro: string
  type: ListingType
  count: number
  ok: boolean
  error?: string
}

/**
 * Daily listings refresh. Pulls every metro × {buy, rent} from the origin provider
 * (RapidAPI) and writes each unfiltered superset into the Firestore listings cache,
 * so user searches read from cache instead of hitting RapidAPI per request.
 *
 * Triggered by Google Cloud Scheduler (App Hosting has no built-in cron), which
 * sends `Authorization: Bearer <CRON_SECRET>`. Fails closed: no CRON_SECRET in the
 * environment means no refresh — never an open endpoint that can burn RapidAPI quota.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  // Never warm the shared cache from the mock: a keyless run (missed secret grant,
  // staging misconfig) would otherwise overwrite every metro with fabricated homes.
  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ ok: false, error: 'RAPIDAPI_KEY not configured; refusing to cache mock data' }, { status: 503 })
  }

  const origin = getOriginListingsProvider()
  const db = getAdminDb()

  const jobs = METROS.flatMap((metro) => LISTING_TYPES.map((type) => ({ metro, type })))
  const results: JobResult[] = []

  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async ({ metro, type }) => {
        try {
          const listings = await origin.search({
            bounds: boundsOf(metro),
            listingType: type,
            locationHint: metroSearchLocation(metro),
            metroId: metro.id,
          })
          // Skip empty pulls so a transient upstream failure can't wipe good cache.
          // (Mid-pagination failures throw in the provider, so a partial page-1
          // result can't land here and overwrite a fuller superset.)
          if (listings.length > 0) {
            await writeMetroListings(db, metro.id, type, listings)
          }
          results.push({ metro: metro.id, type, count: listings.length, ok: true })
        } catch (e) {
          results.push({ metro: metro.id, type, count: 0, ok: false, error: (e as Error).message })
        }
      }),
    )
  }

  const failures = results.filter((r) => !r.ok)
  if (failures.length > 0) {
    console.error(`refresh-listings: ${failures.length}/${jobs.length} jobs failed`, failures)
  }
  // Total failure -> non-2xx so Cloud Scheduler's retry/alerting policies fire.
  // Partial failures still 200: the succeeded writes are durable and idempotent,
  // and a full retry would re-bill every metro for a single flaky one.
  const status = failures.length === jobs.length ? 502 : 200
  return NextResponse.json(
    {
      ok: failures.length === 0,
      refreshedAt: new Date().toISOString(),
      jobs: jobs.length,
      totalListings: results.reduce((n, r) => n + r.count, 0),
      failures,
      results,
    },
    { status },
  )
}

/** metros.ts bbox is [south, west, north, east]; ListingBounds is {north,south,east,west}. */
function boundsOf(metro: Metro): ListingBounds {
  const [south, west, north, east] = metro.bbox
  return { north, south, east, west }
}
