import { z } from 'zod'

/** Denomination is a first-class filter — see spec §4 (Denomination = Core filter). */
export const DenominationCategory = z.enum([
  'Orthodox',
  'Conservative',
  'Reform',
  'Reconstructionist',
  'Nondenominational',
])
export const DenominationSubtype = z.enum([
  'Modern Orthodox',
  'Yeshivish',
  'Chassidish',
  'Sephardic',
  'Chabad',
])
export const Nusach = z.enum(['Ashkenaz', 'Sefard', 'Edot HaMizrach'])
/** Where the denomination value came from (provenance for the filter's reliability). */
export const DenominationSource = z.enum(['osm', 'name-heuristic', 'movement-directory', 'admin'])
export const Confidence = z.enum(['high', 'medium', 'low'])
/** Provenance of the stored record. Google is never a durable source (ToS: place_id only). */
export const RecordSource = z.enum(['osm', 'wikidata', 'user', 'admin'])
export const ShulStatus = z.enum(['active', 'archived'])

export const DenominationSchema = z.object({
  category: DenominationCategory,
  subtype: DenominationSubtype.optional(),
  nusach: Nusach.optional(),
  source: DenominationSource,
  confidence: Confidence,
})

/**
 * Core Shul document data (id + createdAt/updatedAt are managed by the repo/Firestore).
 * Durable fields come from OSM (ODbL) + Wikidata (CC0) + curation; googlePlaceId is the only
 * Google-sourced value we persist.
 */
export const ShulSchema = z.object({
  name: z.string().min(1),
  denomination: DenominationSchema,
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
  flags: z
    .object({ eruv: z.boolean().optional(), dailyMinyan: z.boolean().optional() })
    .optional(),
  googlePlaceId: z.string().optional(),
  source: RecordSource,
  status: ShulStatus.default('active'),
  needsReview: z.boolean().optional(),
})

export type Shul = z.infer<typeof ShulSchema>
export type Denomination = z.infer<typeof DenominationSchema>
export type DenominationCategoryT = z.infer<typeof DenominationCategory>
export type DenominationSubtypeT = z.infer<typeof DenominationSubtype>
