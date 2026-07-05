import { z } from 'zod'
import { DenominationSchema } from '../shuls/schema'

/** Institutional character. Distinct from the numeric grade band. */
export const SchoolType = z.enum([
  'preschool',
  'elementary',
  'day-school',
  'high-school',
  'yeshiva-boys',
  'yeshiva-girls',
  'cheder',
  'seminary',
  'other',
])
export const Gender = z.enum(['boys', 'girls', 'coed'])
export const GradeLevel = z.enum(['PK', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
/** Provenance of the stored record. NCES PSS is the durable primary source. */
export const SchoolRecordSource = z.enum(['nces', 'user', 'admin'])
export const SchoolStatus = z.enum(['active', 'archived'])

/**
 * Core School document data (id + createdAt/updatedAt are managed by the repo/Firestore).
 * `denomination` reuses the shul Denomination object as the hashkafa slot so schools and shuls
 * share the denomination filter vocabulary. NCES has no gender/coed field — gender is name-inferred.
 */
export const SchoolSchema = z.object({
  name: z.string().min(1),
  denomination: DenominationSchema,
  schoolType: SchoolType,
  gender: Gender,
  gradeLow: GradeLevel.optional(),
  gradeHigh: GradeLevel.optional(),
  enrollment: z.number().int().nonnegative().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  metro: z.string().min(1),
  state: z.string().optional(),
  zip: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  geohash: z.string().min(1),
  phone: z.string().optional(),
  website: z.string().optional(),
  /** Stable NCES id (PPIN) for reconciliation against future NCES refreshes. */
  ncesId: z.string().optional(),
  source: SchoolRecordSource,
  status: SchoolStatus.default('active'),
  needsReview: z.boolean().optional(),
  /** ISO 8601 timestamp set when an admin verifies the record (clears needsReview). */
  verifiedAt: z.string().optional(),
})

export type School = z.infer<typeof SchoolSchema>
export type SchoolTypeT = z.infer<typeof SchoolType>
export type GenderT = z.infer<typeof Gender>
export type GradeLevelT = z.infer<typeof GradeLevel>
