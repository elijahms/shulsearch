import { describe, it, expect, beforeAll } from 'vitest'
import { getAdminDb } from '@/lib/firebase/admin'

describe('admin Firestore against emulator', () => {
  beforeAll(() => {
    // firebase emulators:exec injects FIRESTORE_EMULATOR_HOST automatically.
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBeTruthy()
  })

  it('writes and reads a document', async () => {
    const db = getAdminDb()
    const ref = db.collection('_smoke').doc('t1')
    await ref.set({ hello: 'world' })
    const snap = await ref.get()
    expect(snap.data()).toEqual({ hello: 'world' })
  })
})
