import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { upsertShuls } from '@/lib/shuls/repo'
import type { Shul } from '@/lib/shuls/schema'
import { ShulPayload, type Submission } from '@/lib/submissions/schema'
import { buildNewShul, buildShulUpdate } from '../../_lib/apply'

export const runtime = 'nodejs'

const Body = z.object({
  action: z.enum(['approve', 'reject']),
  edits: ShulPayload.optional(),
  reviewNote: z.string().max(2000).optional(),
})

/** POST /api/admin/submissions/[id] — approve or reject a pending submission (admin only). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response
  const { email } = guard
  const { id } = await params

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request', issues: parsed.error.issues }, { status: 400 })
  }
  const { action, edits, reviewNote } = parsed.data

  const db = getAdminDb()
  const subRef = db.collection('submissions').doc(id)
  const subSnap = await subRef.get()
  if (!subSnap.exists) return NextResponse.json({ error: 'submission not found' }, { status: 404 })
  const submission = subSnap.data() as Submission
  if (submission.status !== 'pending') {
    return NextResponse.json({ error: 'submission already reviewed' }, { status: 409 })
  }

  if (action === 'reject') {
    await subRef.update({
      status: 'rejected',
      reviewedBy: email,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewNote: reviewNote ?? null,
    })
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // action === 'approve'
  try {
    if (submission.type === 'new') {
      const shul = await buildNewShul(submission.payload, edits)
      await upsertShuls(db, [shul])
    } else {
      // edit / dispute → apply provided fields to the target shul
      const targetId = submission.targetShulId
      if (!targetId) {
        return NextResponse.json({ error: 'submission missing targetShulId' }, { status: 400 })
      }
      const targetRef = db.collection('shuls').doc(targetId)
      const targetSnap = await targetRef.get()
      if (!targetSnap.exists) {
        return NextResponse.json({ error: 'target shul not found' }, { status: 404 })
      }
      const existing = targetSnap.data() as Shul
      const update = buildShulUpdate(submission.payload, edits, existing)
      await targetRef.update({ ...update, updatedAt: FieldValue.serverTimestamp() })
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'approval failed' },
      { status: 400 },
    )
  }

  await subRef.update({
    status: 'approved',
    reviewedBy: email,
    reviewedAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ ok: true, status: 'approved' })
}
