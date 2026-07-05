import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { DenominationCategory, DenominationSubtype, type Denomination } from '@/lib/shuls/schema'
import { SchoolType, Gender } from '@/lib/schools/schema'

export const runtime = 'nodejs'

const Body = z.object({
  schoolType: SchoolType,
  gender: Gender,
  denominationCategory: DenominationCategory,
  denominationSubtype: DenominationSubtype.optional(),
})

/** POST /api/admin/schools/[id] — set curated fields, clear needsReview, stamp verifiedAt. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response
  const { id } = await params

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request', issues: parsed.error.issues }, { status: 400 })
  }
  const db = getAdminDb()
  const ref = db.collection('schools').doc(id)
  if (!(await ref.get()).exists) return NextResponse.json({ error: 'school not found' }, { status: 404 })

  const denomination: Denomination = {
    category: parsed.data.denominationCategory,
    source: 'admin',
    confidence: 'high',
  }
  if (parsed.data.denominationSubtype) denomination.subtype = parsed.data.denominationSubtype

  await ref.update({
    schoolType: parsed.data.schoolType,
    gender: parsed.data.gender,
    denomination,
    needsReview: false,
    verifiedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ ok: true })
}
