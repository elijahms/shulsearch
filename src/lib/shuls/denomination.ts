import type { Denomination } from './schema'

/** Normalize a raw OSM `denomination` tag value into our enum (the explicit, highest-confidence signal). */
function fromOsmTag(value: string): Denomination | null {
  const v = value.toLowerCase()
  if (/hasid|chassid|chabad|lubavitch/.test(v))
    return { category: 'Orthodox', subtype: 'Chassidish', source: 'osm', confidence: 'high' }
  if (/modern.?orthodox/.test(v))
    return { category: 'Orthodox', subtype: 'Modern Orthodox', source: 'osm', confidence: 'high' }
  if (/ultra.?orthodox|haredi|yeshiv/.test(v))
    return { category: 'Orthodox', subtype: 'Yeshivish', source: 'osm', confidence: 'high' }
  if (/orthodox/.test(v)) return { category: 'Orthodox', source: 'osm', confidence: 'high' }
  if (/conservative|masorti/.test(v))
    return { category: 'Conservative', source: 'osm', confidence: 'high' }
  if (/reform|progressive|liberal/.test(v))
    return { category: 'Reform', source: 'osm', confidence: 'high' }
  if (/reconstructionist/.test(v))
    return { category: 'Reconstructionist', source: 'osm', confidence: 'high' }
  return null
}

/** Name-based heuristics, ordered strongest → weakest. */
function fromName(name: string): Denomination | null {
  const n = name.toLowerCase()
  if (/chabad|lubavitch/.test(n))
    return { category: 'Orthodox', subtype: 'Chabad', source: 'name-heuristic', confidence: 'high' }
  if (/young israel/.test(n))
    return {
      category: 'Orthodox',
      subtype: 'Modern Orthodox',
      source: 'name-heuristic',
      confidence: 'high',
    }
  if (/reconstructionist/.test(n))
    return { category: 'Reconstructionist', source: 'name-heuristic', confidence: 'high' }
  if (/\breform\b/.test(n)) return { category: 'Reform', source: 'name-heuristic', confidence: 'high' }
  if (/\bconservative\b|masorti/.test(n))
    return { category: 'Conservative', source: 'name-heuristic', confidence: 'high' }
  if (/sephard|sfard|mizrah|edot|persian|syrian|bukharian|iranian/.test(n))
    return {
      category: 'Orthodox',
      subtype: 'Sephardic',
      source: 'name-heuristic',
      confidence: 'medium',
    }
  if (/yeshiv|kollel|beis medrash|bais medrash|beit midrash|khal|kehila|shtiebel|nusach/.test(n))
    return { category: 'Orthodox', subtype: 'Yeshivish', source: 'name-heuristic', confidence: 'medium' }
  // "Temple" alone leans Reform/Conservative — weak signal.
  if (/\btemple\b/.test(n)) return { category: 'Reform', source: 'name-heuristic', confidence: 'low' }
  return null
}

/**
 * Infer denomination from an explicit OSM `denomination` tag (preferred) or the name.
 * Falls back to a best-guess (Orthodox — the modal denomination in the target metros) with
 * LOW confidence, which the caller flags as `needsReview` for admin curation.
 */
export function inferDenomination(name: string, osmTags?: Record<string, string>): Denomination {
  if (osmTags?.denomination) {
    const fromTag = fromOsmTag(osmTags.denomination)
    if (fromTag) return fromTag
  }
  const fromNm = fromName(name)
  if (fromNm) return fromNm
  return { category: 'Orthodox', source: 'name-heuristic', confidence: 'low' }
}
