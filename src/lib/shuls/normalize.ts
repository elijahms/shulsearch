// Abbreviation expansions (applied before stopword removal).
const ABBREV: [RegExp, string][] = [
  [/\bcong\b\.?/g, 'congregation'],
  [/\bctr\b\.?/g, 'center'],
]

// Transliteration unifications so Ashkenazi/Sephardi spellings of the same name collapse.
const TRANSLIT: [RegExp, string][] = [
  [/\b(beth|beis|bais|beit|bes)\b/g, 'beth'],
  [/\byisr[oa]el\b/g, 'israel'],
  [/\bahava[st]\b/g, 'ahavat'],
  [/\b(shule|shul)\b/g, 'synagogue'],
]

// Generic words that carry no distinguishing signal for dedup.
const STOPWORDS = new Set([
  'synagogue',
  'temple',
  'congregation',
  'jewish',
  'center',
  'the',
  'of',
  'and',
  'a',
])

/** Lowercase, strip diacritics + punctuation, unify transliterations, drop generic stopwords. */
export function normalizeName(raw: string): string {
  let s = raw.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  s = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  for (const [re, rep] of ABBREV) s = s.replace(re, rep)
  for (const [re, rep] of TRANSLIT) s = s.replace(re, rep)
  return s
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(' ')
    .trim()
}

/** Distinct normalized tokens of a name (for set-based similarity). */
export function nameTokens(raw: string): Set<string> {
  return new Set(normalizeName(raw).split(/\s+/).filter(Boolean))
}

/** Sørensen–Dice coefficient over two token sets: 2·|A∩B| / (|A|+|B|). Range [0,1]. */
export function diceCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return (2 * inter) / (a.size + b.size)
}
