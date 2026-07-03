import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { normalizeName } from './normalize'
import type { Shul } from './schema'

export const SHULS = 'shuls'

/** Deterministic doc id (geohash prefix + name slug) so re-running the seed upserts, not duplicates. */
export function docIdFor(shul: Pick<Shul, 'geohash' | 'name'>): string {
  const slug = normalizeName(shul.name).replace(/\s+/g, '-') || 'shul'
  return `${shul.geohash.slice(0, 8)}-${slug}`.slice(0, 120)
}

/** Bulk-upsert shuls. Sets updatedAt always; createdAt on first write (approximate for seed data). */
export async function upsertShuls(db: Firestore, shuls: Shul[]): Promise<number> {
  if (shuls.length === 0) return 0
  const writer = db.bulkWriter()
  for (const shul of shuls) {
    const ref = db.collection(SHULS).doc(docIdFor(shul))
    writer.set(
      ref,
      { ...shul, updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
  }
  await writer.close()
  return shuls.length
}

export async function queryByMetro(db: Firestore, metro: string): Promise<Shul[]> {
  const snap = await db.collection(SHULS).where('metro', '==', metro).get()
  return snap.docs.map((d) => d.data() as Shul)
}

export async function countShuls(db: Firestore): Promise<number> {
  const snap = await db.collection(SHULS).count().get()
  return snap.data().count
}
