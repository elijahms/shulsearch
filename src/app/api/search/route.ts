import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'
import { searchHomes } from '@/lib/search/search'
import { getAdminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

const ShulPoint = z.object({ id: z.string(), name: z.string(), lat: z.number(), lng: z.number() })

const Body = z.object({
  shuls: z.array(ShulPoint).min(1).max(500),
  radiusMeters: z.number().min(50).max(10_000),
  listingType: z.enum(['buy', 'rent']),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  bedsMin: z.number().optional(),
  bathsMin: z.number().optional(),
  homeType: z.enum(['house', 'condo', 'townhome', 'apartment', 'multi-family', 'other']).optional(),
  // analytics context (optional)
  metro: z.string().optional(),
  mode: z.enum(['specific', 'any']).optional(),
  denominationFilter: z.string().optional(),
  sessionId: z.string().optional(),
})

type BodyT = z.infer<typeof Body>

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request', issues: parsed.error.issues }, { status: 400 })
  }
  const p = parsed.data
  const result = await searchHomes({
    shuls: p.shuls,
    radiusMeters: p.radiusMeters,
    listingType: p.listingType,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    bedsMin: p.bedsMin,
    bathsMin: p.bathsMin,
    homeType: p.homeType,
  })
  void logSearch(p, result.total)
  return NextResponse.json(result)
}

/** Best-effort analytics write (never blocks or fails the search). */
async function logSearch(p: BodyT, total: number): Promise<void> {
  try {
    await getAdminDb()
      .collection('searches')
      .add({
        timestamp: FieldValue.serverTimestamp(),
        metro: p.metro ?? null,
        mode: p.mode ?? (p.shuls.length === 1 ? 'specific' : 'any'),
        shulId: p.shuls.length === 1 ? p.shuls[0].id : null,
        denominationFilter: p.denominationFilter ?? null,
        radius: p.radiusMeters,
        listingType: p.listingType,
        priceMin: p.priceMin ?? null,
        priceMax: p.priceMax ?? null,
        beds: p.bedsMin ?? null,
        resultCount: total,
        zeroResults: total === 0,
        sessionId: p.sessionId ?? null,
      })
  } catch {
    // analytics is optional
  }
}
