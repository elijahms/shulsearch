import type { Submission } from '@/lib/submissions/schema'
import {
  DenominationCategory,
  DenominationSubtype,
  type DenominationCategoryT,
  type DenominationSubtypeT,
} from '@/lib/shuls/schema'
import { cleanPayload } from '@/lib/submissions/client'

/** A single `<Select>` option. */
export interface Opt {
  value: string
  label: string
}
/** A labelled group of options (e.g. metros grouped by tier). */
export interface OptGroup {
  label: string
  options: Opt[]
}

export type FieldErrors = Partial<Record<string, string>>
export type BuildResult =
  | { ok: true; submission: Submission }
  | { ok: false; errors: FieldErrors }

/** Raw string values collected by the "Add a shul" form (all fields are strings). */
export interface NewShulFormValues {
  name: string
  metro: string
  denominationCategory: string
  denominationSubtype: string
  address: string
  city: string
  state: string
  zip: string
  website: string
  phone: string
  note: string
  submitterEmail: string
}

/** Raw string values collected by the "Report / dispute" form. */
export interface DisputeFormValues {
  targetShulId: string
  name: string
  denominationCategory: string
  denominationSubtype: string
  address: string
  website: string
  phone: string
  note: string
  submitterEmail: string
}

export const emptyNewValues: NewShulFormValues = {
  name: '',
  metro: '',
  denominationCategory: '',
  denominationSubtype: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  website: '',
  phone: '',
  note: '',
  submitterEmail: '',
}

export const emptyDisputeValues: DisputeFormValues = {
  targetShulId: '',
  name: '',
  denominationCategory: '',
  denominationSubtype: '',
  address: '',
  website: '',
  phone: '',
  note: '',
  submitterEmail: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function asCategory(value: string): DenominationCategoryT | undefined {
  return (DenominationCategory.options as readonly string[]).includes(value)
    ? (value as DenominationCategoryT)
    : undefined
}

function asSubtype(value: string): DenominationSubtypeT | undefined {
  return (DenominationSubtype.options as readonly string[]).includes(value)
    ? (value as DenominationSubtypeT)
    : undefined
}

/** Map "Add a shul" form values to a valid `Submission`, or return inline field errors. */
export function buildNewSubmission(v: NewShulFormValues): BuildResult {
  const errors: FieldErrors = {}
  const name = v.name.trim()
  if (!name) errors.name = 'Please enter the shul’s name.'
  const submitterEmail = v.submitterEmail.trim()
  if (submitterEmail && !EMAIL_RE.test(submitterEmail)) {
    errors.submitterEmail = 'Enter a valid email address.'
  }
  if (Object.keys(errors).length) return { ok: false, errors }

  const payload = cleanPayload({
    name,
    metro: v.metro,
    denominationCategory: asCategory(v.denominationCategory),
    denominationSubtype: asSubtype(v.denominationSubtype),
    address: v.address,
    city: v.city,
    state: v.state,
    zip: v.zip,
    website: v.website,
    phone: v.phone,
  })

  return {
    ok: true,
    submission: {
      type: 'new',
      payload,
      note: v.note.trim() || undefined,
      submitterEmail: submitterEmail || undefined,
      status: 'pending',
    },
  }
}

/** Map "Report / dispute" form values to a valid `Submission`, or return inline field errors. */
export function buildDisputeSubmission(v: DisputeFormValues): BuildResult {
  const errors: FieldErrors = {}
  if (!v.targetShulId) errors.targetShulId = 'Choose the shul you want to report.'
  const note = v.note.trim()
  if (!note) errors.note = 'Please describe what needs fixing.'
  const submitterEmail = v.submitterEmail.trim()
  if (submitterEmail && !EMAIL_RE.test(submitterEmail)) {
    errors.submitterEmail = 'Enter a valid email address.'
  }
  if (Object.keys(errors).length) return { ok: false, errors }

  const payload = cleanPayload({
    name: v.name,
    denominationCategory: asCategory(v.denominationCategory),
    denominationSubtype: asSubtype(v.denominationSubtype),
    address: v.address,
    website: v.website,
    phone: v.phone,
  })

  return {
    ok: true,
    submission: {
      type: 'dispute',
      targetShulId: v.targetShulId,
      payload,
      note,
      submitterEmail: submitterEmail || undefined,
      status: 'pending',
    },
  }
}
