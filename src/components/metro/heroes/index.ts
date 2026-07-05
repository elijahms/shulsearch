import type { ComponentType } from 'react'
import type { MetroHeroProps } from '../metro-hero'

/**
 * Seam for bespoke, per-metro hero components.
 *
 * By default every metro renders the shared theme-driven <MetroHero/>. A styling
 * agent who wants a fully custom hero for one community can:
 *   1. create `src/components/metro/heroes/<id>.tsx` exporting a component that
 *      accepts `MetroHeroProps`, and
 *   2. register it here, e.g. `'miami-boca-fl': MiamiHero`.
 *
 * The showcase (`metro-showcase.tsx`) renders `HERO_OVERRIDES[id] ?? MetroHero`,
 * so an unlisted metro simply falls back to the themed default. Most metros will
 * never need an override — filling in `METRO_THEMES` is usually enough.
 */
export const HERO_OVERRIDES: Partial<Record<string, ComponentType<MetroHeroProps>>> = {}
