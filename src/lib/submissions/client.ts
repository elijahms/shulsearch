import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase/client'
import { SubmissionSchema, type Submission, type ShulPayloadT } from '@/lib/submissions/schema'

/**
 * Pure helper: drop `undefined`/empty-string fields and trim string values so we never
 * write blank keys to Firestore. Numbers (lat/lng) pass through untouched.
 */
export function cleanPayload(payload: ShulPayloadT): ShulPayloadT {
  const out: ShulPayloadT = {}
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) continue
      ;(out as Record<string, unknown>)[key] = trimmed
    } else {
      ;(out as Record<string, unknown>)[key] = value
    }
  }
  return out
}

/**
 * Validate a community submission and write it to the public `submissions` collection.
 * Always stored as `status: 'pending'` (the only status Firestore rules allow on create).
 */
export async function submitContribution(data: Submission): Promise<void> {
  const parsed = SubmissionSchema.parse(data)
  const db = getFirestore(getFirebaseApp())
  await addDoc(collection(db, 'submissions'), {
    ...parsed,
    payload: cleanPayload(parsed.payload),
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}
