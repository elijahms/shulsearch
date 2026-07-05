import type { Metro } from '@/lib/metros'
import type { MetroFacts } from '@/lib/metros/facts'
import type { MetroTheme } from '@/lib/metros/theme'
import { usd, num, pct, heroTextColor } from './format'

export interface MetroHeroProps {
  metro: Metro
  theme: MetroTheme
  facts?: MetroFacts
  /** Live shul count, or `null` while loading. */
  shulCount: number | null
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-heading text-xl font-semibold leading-none md:text-2xl">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-widest opacity-75">{label}</div>
    </div>
  )
}

/**
 * The default, fully theme-driven hero. Every metro uses this until a styling
 * agent registers a bespoke override in `./heroes`. All visuals come from `theme`,
 * so restyling a community means editing its `MetroTheme` — not this component.
 */
export function MetroHero({ metro, theme, facts, shulCount }: MetroHeroProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: theme.heroBackground, color: heroTextColor(theme.heroText) }}
    >
      {theme.pattern && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: theme.pattern }}
          aria-hidden
        />
      )}
      <div className="relative mx-auto w-full max-w-5xl px-6 py-14 md:py-20">
        <span className="block text-5xl md:text-6xl" aria-hidden>
          {theme.motif}
        </span>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] opacity-80">{metro.state}</p>
        <h1 className="mt-1 font-heading text-4xl font-bold tracking-tight md:text-5xl">{metro.name}</h1>
        <p className="mt-4 max-w-xl text-lg opacity-90">{theme.tagline}</p>

        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5 md:gap-x-10">
          {facts && <HeroStat label="Jewish pop." value={`~${num(facts.jewishPopulation)}`} />}
          <HeroStat label={shulCount === 1 ? 'Shul' : 'Shuls'} value={shulCount == null ? '…' : String(shulCount)} />
          {facts && <HeroStat label="Median home" value={usd(facts.medianHomeValue)} />}
          {facts && <HeroStat label="Property tax" value={pct(facts.effectivePropertyTaxRate)} />}
        </div>
      </div>
    </section>
  )
}
