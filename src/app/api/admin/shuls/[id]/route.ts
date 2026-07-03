import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { DenominationCategory, DenominationSubtype, type Denomination } from '@/lib/shuls/schema'

export const runtime = 'nodejs'

const Body = z.object({
  denominationCategory: DenominationCategory,
  denominationSubtype: DenominationSubtype.optional(),
})

/**
 * POST /api/admin/shuls/[id] — set a curated denomination and clear the needsReview flag.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response
  const { id } = await params

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request', issues: parsed.error.issues }, { status: 400 })
  }

  const db = getAdminDb()
  const ref = db.collection('shuls').doc(id)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: 'shul not found' }, { status: 404 })

  const denomination: Denomination = {
    category: parsed.data.denominationCategory,
    source: 'admin',
    confidence: 'high',
  }
  if (parsed.data.denominationSubtype) denomination.subtype = parsed.data.denominationSubtype

  await ref.update({
    denomination,
    needsReview: false,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ ok: true })
}
