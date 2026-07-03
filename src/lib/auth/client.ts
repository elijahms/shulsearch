'use client'

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { getFirebaseApp } from '@/lib/firebase/client'

export type { User }

function auth() {
  return getAuth(getFirebaseApp())
}

/** Google sign-in via popup. Requires the Google provider enabled in the Firebase console. */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth(), provider)
  return cred.user
}

export async function signOutUser(): Promise<void> {
  await signOut(auth())
}

/** Subscribe to auth-state changes. Returns the unsubscribe function. */
export function onAuthChange(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth(), cb)
}

/** Fresh ID token for the signed-in user (to send as `Authorization: Bearer`), or null. */
export async function getIdToken(): Promise<string | null> {
  const user = auth().currentUser
  return user ? user.getIdToken() : null
}

/** Case-insensitive membership check against NEXT_PUBLIC_ADMIN_EMAILS (comma-separated). */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(email.trim().toLowerCase())
}
