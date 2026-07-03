import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('getFirebaseApp', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-shulsearch'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:1:web:abc'
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-shulsearch.firebaseapp.com'
  })

  it('returns a memoized singleton from NEXT_PUBLIC_ config', async () => {
    const { getFirebaseApp } = await import('./client')
    const a = getFirebaseApp()
    const b = getFirebaseApp()
    expect(a).toBe(b)
    expect(a.options.projectId).toBe('demo-shulsearch')
  })
})
