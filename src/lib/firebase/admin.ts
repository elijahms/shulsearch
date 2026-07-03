import 'server-only'
import { getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

export function getAdminApp(): App {
  // On App Hosting, ADC + FIREBASE_CONFIG make this zero-arg. Locally, the emulator
  // env vars (FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST) + a projectId suffice.
  const existing = getApps()[0]
  if (existing) return existing
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    'demo-shulsearch'
  return initializeApp({ projectId })
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}
