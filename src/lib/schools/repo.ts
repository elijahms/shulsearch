import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { normalizeName } from '../shuls/normalize'
import type { School } from './schema'

export const SCHOOLS = 'schools'

/** Deterministic doc id: stable NCES id when present, else geohash prefix + name slug. */
export function schoolDocId(school: Pick<School, 'geohash' | 'name'> & { ncesId?: string }): string {
  if (school.ncesId) return `nces-${school.ncesId}`
  const slug = normalizeName(school.name).replace(/\s+/g, '-') || 'school'
  return `${school.geohash.slice(0, 8)}-${slug}`.slice(0, 120)
}

/** Bulk-upsert schools (merge). Deterministic doc id makes re-seeds idempotent. */
export async function upsertSchools(db: Firestore, schools: School[]): Promise<number> {
  if (schools.length === 0) return 0
  const writer = db.bulkWriter()
  let failed = 0
  writer.onWriteError((error) => {
    if (error.failedAttempts < 5) return true
    failed++
    return false
  })
  for (const school of schools) {
    const ref = db.collection(SCHOOLS).doc(schoolDocId(school))
    void writer
      .set(
        ref,
        { ...school, updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      .catch(() => {})
  }
  await writer.close()
  if (failed > 0) throw new Error(`${failed}/${schools.length} writes failed`)
  return schools.length
}

export async function queryByMetro(db: Firestore, metro: string): Promise<School[]> {
  const snap = await db.collection(SCHOOLS).where('metro', '==', metro).get()
  return snap.docs.map((d) => d.data() as School)
}

export async function countSchools(db: Firestore): Promise<number> {
  const snap = await db.collection(SCHOOLS).count().get()
  return snap.data().count
}
