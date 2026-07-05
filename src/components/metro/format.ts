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
