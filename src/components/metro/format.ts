/** Formatting helpers shared across the metro showcase components. */

/** `$950,000` — whole-dollar USD. */
export const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

/** `600,000` — grouped integer. */
export const num = (n: number) => Math.round(n).toLocaleString('en-US')

/** `2.24%` — a decimal rate rendered as a percentage. */
export const pct = (d: number, digits = 2) => `${(d * 100).toFixed(digits)}%`

/** A decimal income-tax rate, or `None` when the state levies none. */
export const rateOrNone = (d: number, digits = 2) => (d > 0 ? pct(d, digits) : 'None')

/** Text color that reads on a themed hero background. */
export const heroTextColor = (t: 'light' | 'dark') => (t === 'light' ? '#ffffff' : '#0f172a')

/** Full state names for the launch metros (hero eyebrow). Falls back to the abbreviation. */
const STATE_NAMES: Record<string, string> = {
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  FL: 'Florida',
  GA: 'Georgia',
  IL: 'Illinois',
  MA: 'Massachusetts',
  MD: 'Maryland',
  MI: 'Michigan',
  MO: 'Missouri',
  NJ: 'New Jersey',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  PA: 'Pennsylvania',
  TN: 'Tennessee',
  TX: 'Texas',
}
export const stateName = (abbr: string) => STATE_NAMES[abbr] ?? abbr

/**
 * `675000` → `{ value: '$675', unit: 'k' }` — compact figures for the at-a-glance row,
 * with the magnitude split out so it can be typeset as a small muted unit.
 */
export function compactParts(n: number, prefix = ''): { value: string; unit: string | null } {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return { value: `${prefix}${m >= 10 ? Math.round(m) : Math.round(m * 10) / 10}`, unit: 'M' }
  }
  if (n >= 1_000) return { value: `${prefix}${Math.round(n / 1_000)}`, unit: 'k' }
  return { value: `${prefix}${n}`, unit: null }
}
