import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { serialize } from '../_lib/serialize'

export const runtime = 'nodejs'

/** GET /api/admin/submissions — all pending submissions (admin only). */
export async function GET(req: Request) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response

  const snap = await getAdminDb().collection('submissions').where('status', '==', 'pending').get()
  const submissions = snap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) }))
  return NextResponse.json(submissions)
}
