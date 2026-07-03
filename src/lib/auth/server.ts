import 'server-only'
import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminApp } from '@/lib/firebase/admin'

/** Server-side admin allowlist from ADMIN_EMAILS (comma-separated, case-insensitive). */
function adminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Verify the request carries a valid Firebase ID token for an allowlisted admin.
 * Reads `Authorization: Bearer <idToken>`; returns the verified email, or throws.
 */
export async function verifyAdmin(req: Request): Promise<string> {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) throw new Error('Missing bearer token')
  const token = match[1].trim()

  const decoded = await getAuth(getAdminApp()).verifyIdToken(token)
  const email = decoded.email?.toLowerCase()
  if (!email) throw new Error('Token has no email')
  if (!adminAllowlist().includes(email)) throw new Error('Not an admin')
  return email
}

export type AdminGuardResult = { email: string } | { response: NextResponse }

/**
 * Route helper: returns `{ email }` for an authorized admin, or `{ response }`
 * holding a 401 to return directly. Usage:
 *   const guard = await adminGuard(req)
 *   if ('response' in guard) return guard.response
 */
export async function adminGuard(req: Request): Promise<AdminGuardResult> {
  try {
    const email = await verifyAdmin(req)
    return { email }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unauthorized'
    return { response: NextResponse.json({ error: message }, { status: 401 }) }
  }
}
