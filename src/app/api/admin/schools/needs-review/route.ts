import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { serialize } from '../../_lib/serialize'

export const runtime = 'nodejs'

/** GET /api/admin/schools/needs-review — schools flagged needsReview==true (admin only). */
export async function GET(req: Request) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response
  const snap = await getAdminDb().collection('schools').where('needsReview', '==', true).limit(100).get()
  return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) })))
}
