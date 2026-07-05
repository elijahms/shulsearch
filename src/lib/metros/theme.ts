/**
 * Per-metro visual theme contract. Client-safe (pure data).
 *
 * This is THE seam that per-metro styling agents fill in. The showcase pages
 * (`/metro` and `/metro/[id]`) render entirely off `metroTheme(id)`, so an agent
 * can restyle a whole community by editing only its entry in `METRO_THEMES` —
 * no page/component changes required. Keep theming to colors / gradients / motif /
 * tagline so it stays zero-config (no per-metro font loading).
 */

export interface MetroTheme {
  /** Primary emphasis color (hex). Used for accented numbers, the CTA, highlights. */
  accent: string
  /** A soft tint / muted background (hex) — e.g. a ~12% wash of the accent. */
  accentSoft: string
  /** Any CSS `background` value rendered behind the hero (gradient, pattern, etc.). */
  heroBackground: string
  /** Which text color reads on the hero background. */
  heroText: 'light' | 'dark'
  /** A single emoji capturing the community's vibe. */
  motif: string
  /** Short, evocative tagline shown on cards and the hero. */
  tagline: string
  /** Optional CSS `background-image` for a subtle section texture (rendered low-opacity). */
  pattern?: string
}

/**
 * Clean, tasteful neutral default so EVERY metro looks good before it is
 * individually styled. Tekhelet-leaning accent over a soft indigo gradient hero.
 */
export const DEFAULT_THEME: MetroTheme = {
  accent: '#3a53b3',
  accentSoft: '#eef1fb',
  heroBackground: 'linear-gradient(135deg, #1e2a5e 0%, #3a53b3 55%, #6d86d6 100%)',
  heroText: 'light',
  motif: '🕍',
  tagline: 'A place to call home, within a walk of shul.',
}

/**
 * Metro-specific overrides. Intentionally near-empty — dedicated styling agents
 * fill this in one metro at a time. The two entries below only demonstrate the
 * shape; anything not listed falls back to DEFAULT_THEME.
 */
export const METRO_THEMES: Partial<Record<string, MetroTheme>> = {
  'miami-boca-fl': {
    accent: '#0e9aa7',
    accentSoft: '#e4f6f7',
    heroBackground: 'linear-gradient(120deg, #06b6d4 0%, #22d3ee 40%, #fb7185 100%)',
    heroText: 'light',
    motif: '🌴',
    tagline: 'Sunshine, ocean breezes, and shul around the corner.',
    pattern:
      'repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 14px)',
  },
  'brooklyn-ny': {
    accent: '#c2410c',
    accentSoft: '#fdece2',
    heroBackground: 'linear-gradient(135deg, #0b0b0f 0%, #1c1c24 55%, #2c2c38 100%)',
    heroText: 'light',
    motif: '🌉',
    tagline: 'Big-city energy, the deepest roots of any community.',
  },
}

/** Resolve a metro's theme, falling back to the tasteful neutral default. */
export function metroTheme(id: string): MetroTheme {
  return METRO_THEMES[id] ?? DEFAULT_THEME
}
