import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseApp } from '../firebase/client'
import type { School } from './schema'

export type SchoolDoc = School & { id: string }

/** Fetch all schools in a metro from the client (public read). */
export async function getSchoolsByMetro(metro: string): Promise<SchoolDoc[]> {
  const db = getFirestore(getFirebaseApp())
  const snap = await getDocs(query(collection(db, 'schools'), where('metro', '==', metro)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as School) }))
}
