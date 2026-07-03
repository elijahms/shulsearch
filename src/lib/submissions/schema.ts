import { z } from 'zod'
import { DenominationCategory, DenominationSubtype } from '../shuls/schema'

export const SubmissionType = z.enum(['new', 'edit', 'dispute'])
export const SubmissionStatus = z.enum(['pending', 'approved', 'rejected'])

/** Proposed shul fields. All optional (edits/disputes touch a subset; a "new" form fills most). */
export const ShulPayload = z.object({
  name: z.string().min(1).max(200).optional(),
  denominationCategory: DenominationCategory.optional(),
  denominationSubtype: DenominationSubtype.optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  metro: z.string().max(120).optional(),
  state: z.string().max(40).optional(),
  zip: z.string().max(20).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  website: z.string().max(300).optional(),
  phone: z.string().max(40).optional(),
})
export type ShulPayloadT = z.infer<typeof ShulPayload>

/** A community submission (add / edit / dispute), moderated by an admin before it affects `shuls`. */
export const SubmissionSchema = z.object({
  type: SubmissionType,
  targetShulId: z.string().max(200).optional(), // required for edit/dispute
  payload: ShulPayload,
  note: z.string().max(2000).optional(),
  submitterEmail: z.union([z.string().email(), z.literal('')]).optional(),
  status: SubmissionStatus.default('pending'),
})
export type Submission = z.infer<typeof SubmissionSchema>

export const SubmissionTypes = SubmissionType.options
