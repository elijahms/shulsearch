import { describe, it, expect, afterEach, vi } from 'vitest'
import { isAdminEmail } from './client'

describe('isAdminEmail', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns false when no allowlist is set', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', '')
    expect(isAdminEmail('someone@example.com')).toBe(false)
  })

  it('returns false for null / undefined / empty email', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'admin@example.com')
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail('')).toBe(false)
  })

  it('matches an allowlisted email case-insensitively and trims whitespace', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'Admin@Example.com, second@example.com')
    expect(isAdminEmail('admin@example.com')).toBe(true)
    expect(isAdminEmail('  ADMIN@EXAMPLE.COM  ')).toBe(true)
    expect(isAdminEmail('second@example.com')).toBe(true)
  })

  it('rejects an email not on the allowlist', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'admin@example.com')
    expect(isAdminEmail('intruder@example.com')).toBe(false)
  })
})
