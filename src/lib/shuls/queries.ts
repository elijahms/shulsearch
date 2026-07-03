import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseApp } from '../firebase/client'
import type { Shul } from './schema'

export type ShulDoc = Shul & { id: string }

/** Fetch all shuls in a metro from the client (public read). */
export async function getShulsByMetro(metro: string): Promise<ShulDoc[]> {
  const db = getFirestore(getFirebaseApp())
  const snap = await getDocs(query(collection(db, 'shuls'), where('metro', '==', metro)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Shul) }))
}
