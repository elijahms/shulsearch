import { describe, it, expect } from 'vitest'
import { SubmissionSchema } from '@/lib/submissions/schema'
import { cleanPayload } from '@/lib/submissions/client'
import {
  buildDisputeSubmission,
  buildNewSubmission,
  emptyDisputeValues,
  emptyNewValues,
} from './build'

describe('cleanPayload', () => {
  it('drops empty/undefined fields and trims strings', () => {
    expect(
      cleanPayload({ name: '  Beth El  ', city: '', address: undefined, phone: '212-555-0100' }),
    ).toEqual({ name: 'Beth El', phone: '212-555-0100' })
  })
})

describe('buildNewSubmission', () => {
  it('requires a name', () => {
    const r = buildNewSubmission({ ...emptyNewValues, name: '   ' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.name).toBeTruthy()
  })

  it('rejects an invalid email', () => {
    const r = buildNewSubmission({ ...emptyNewValues, name: 'X', submitterEmail: 'not-an-email' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.submitterEmail).toBeTruthy()
  })

  it('maps values to a valid "new" Submission', () => {
    const r = buildNewSubmission({
      ...emptyNewValues,
      name: 'Congregation Beth Shalom',
      metro: 'teaneck-bergen-nj',
      denominationCategory: 'Orthodox',
      denominationSubtype: 'Modern Orthodox',
      website: 'https://example.com',
      note: 'Founded 1998',
      submitterEmail: 'me@example.com',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.submission.type).toBe('new')
      expect(r.submission.payload.name).toBe('Congregation Beth Shalom')
      expect(r.submission.payload.metro).toBe('teaneck-bergen-nj')
      expect(r.submission.payload.denominationCategory).toBe('Orthodox')
      // empty fields must not leak into the payload
      expect('city' in r.submission.payload).toBe(false)
      expect(SubmissionSchema.safeParse(r.submission).success).toBe(true)
    }
  })

  it('ignores an unknown denomination value', () => {
    const r = buildNewSubmission({ ...emptyNewValues, name: 'X', denominationCategory: 'Bogus' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.submission.payload.denominationCategory).toBeUndefined()
  })
})

describe('buildDisputeSubmission', () => {
  it('requires a target shul and a note', () => {
    const r = buildDisputeSubmission({ ...emptyDisputeValues })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.targetShulId).toBeTruthy()
      expect(r.errors.note).toBeTruthy()
    }
  })

  it('builds a valid "dispute" Submission with corrected fields', () => {
    const r = buildDisputeSubmission({
      ...emptyDisputeValues,
      targetShulId: 'shul-123',
      note: 'Wrong address',
      address: '1 Main St',
      website: 'https://fixed.example.com',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.submission.type).toBe('dispute')
      expect(r.submission.targetShulId).toBe('shul-123')
      expect(r.submission.note).toBe('Wrong address')
      expect(r.submission.payload.address).toBe('1 Main St')
      expect(SubmissionSchema.safeParse(r.submission).success).toBe(true)
    }
  })
})
