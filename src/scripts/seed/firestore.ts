import { getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Firestore for standalone seed scripts. Deliberately does NOT import `server-only` (so tsx/node
 * can run it). Targets the emulator when FIRESTORE_EMULATOR_HOST is set, else the real project
 * via Application Default Credentials (`gcloud auth application-default login`).
 */
export function getSeedDb(): Firestore {
  const app: App =
    getApps()[0] ??
    initializeApp({
      projectId:
        process.env.GOOGLE_CLOUD_PROJECT ??
        process.env.GCLOUD_PROJECT ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
        'shulsearch-app',
    })
  const db = getFirestore(app)
  try {
    // Optional Shul fields (address, website, subtype…) may be undefined; skip them, don't error.
    db.settings({ ignoreUndefinedProperties: true })
  } catch {
    // settings already applied (getSeedDb called more than once)
  }
  return db
}
