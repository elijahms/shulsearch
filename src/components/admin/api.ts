'use client'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase/client'
import { getIdToken } from '@/lib/auth/client'
import type { Shul } from '@/lib/shuls/schema'
import type { Submission } from '@/lib/submissions/schema'

/** A submission doc as returned by the admin API (Timestamps serialized to ISO strings). */
export type AdminSubmission = Submission & {
  id: string
  createdAt?: string
  reviewedBy?: string
  reviewedAt?: string
}

export type ShulWithId = Shul & { id: string }

/** Fetch with the current user's Firebase ID token attached as a bearer credential. */
export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getIdToken()
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
}

/** Direct client read of a public shul doc (rules allow read for anyone) — used for edit diffs. */
export async function getShulById(id: string): Promise<ShulWithId | null> {
  const db = getFirestore(getFirebaseApp())
  const snap = await getDoc(doc(db, 'shuls', id))
  return snap.exists() ? { id: snap.id, ...(snap.data() as Shul) } : null
}
