import type { Denomination, DenominationCategoryT, DenominationSubtypeT } from './schema'

// Hex (not CSS vars) so the same value works for DOM badges AND Google Maps markers.
const CATEGORY_HEX: Record<DenominationCategoryT, string> = {
  Orthodox: '#23407a',
  Conservative: '#5a6b7a',
  Reform: '#b5623f',
  Reconstructionist: '#7a7a3a',
  Nondenominational: '#8a8577',
}

const SUBTYPE_HEX: Partial<Record<DenominationSubtypeT, string>> = {
  'Modern Orthodox': '#2f6690',
  Yeshivish: '#4a3b6b',
  Chassidish: '#6b2b3a',
  Chabad: '#1f7a5a',
  Sephardic: '#b0894f',
}

/** Marker/badge color: subtype-specific when known, else the category color. */
export function denominationColorHex(d: Denomination): string {
  return (d.subtype && SUBTYPE_HEX[d.subtype]) || CATEGORY_HEX[d.category]
}

/** Human label: the most specific known level. */
export function denominationLabel(d: Denomination): string {
  return d.subtype ?? d.category
}
