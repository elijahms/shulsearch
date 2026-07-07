import { Fragment } from 'react'
import type { Metro } from '@/lib/metros'
import type { MetroFacts } from '@/lib/metros/facts'
import type { MetroTheme } from '@/lib/metros/theme'
import { compactParts, num, stateName } from './format'

export interface MetroHeroProps {
  metro: Metro
  theme: MetroTheme
  facts?: MetroFacts
  /** Live shul count, or `null` while loading. */
  shulCount: number | null
}

/** Renders "A / B" names as "A & B" with an italic, softened serif ampersand. */
function AmpName({ text }: { text: string }) {
  const parts = text.split(/\s*\/\s*/)
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={`${part}-${i}`}>
          {i > 0 && (
            <>
              {' '}
              <span className="italic text-foreground/60">&amp;</span>{' '}
            </>
          )}
          {part}
        </Fragment>
      ))}
    </>
  )
}

/** One at-a-glance figure: small-caps label over a large light-serif tabular number. */
function Glance({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit?: string | null
  accent?: string
}) {
  return (
    <div className="border-border py-6 pr-5 max-md:border-b max-md:odd:border-r max-md:even:pl-5 md:py-7 md:[&:not(:first-child)]:pl-6 md:[&:not(:last-child)]:border-r">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd
        className="mt-3 font-serif text-[clamp(1.9rem,3.4vw,2.5rem)] leading-none tracking-[-0.02em] tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-[0.5em] tracking-normal text-muted-foreground">{unit}</span>
        )}
      </dd>
    </div>
  )
}

/**
 * The Quiet Luxe hero — no gradients, no motif emoji. A small-caps eyebrow with a
 * single accent dot, a large light serif metro name, an italic serif tagline, the
 * community lede, and a hairline at-a-glance stat row. The metro's identity comes
 * only from `theme.accent` (dot + live shul figure).
 */
export function MetroHero({ metro, theme, facts, shulCount }: MetroHeroProps) {
  // "Boston (Brookline / Newton)" → main "Boston", softened qualifier "(Brookline & Newton)".
  const m = metro.name.match(/^(.*?)\s*\((.*)\)$/)
  const main = m ? m[1] : metro.name
  const qualifier = m ? m[2] : null
  const pop = facts ? compactParts(facts.jewishPopulation) : null
  const home = facts ? compactParts(facts.medianHomeValue, '$') : null

  return (
    <header className="pt-10 md:pt-16">
      <p className="ql-fade ql-d1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span
          className="mr-2.5 inline-block size-[5px] -translate-y-px rounded-full align-middle"
          style={{ backgroundColor: theme.accent }}
          aria-hidden
        />
        {metro.tier === 1 ? 'Established community' : 'Growing community'} ·{' '}
        {stateName(metro.state)}
      </p>

      <h1 className="ql-fade ql-d2 mt-6 text-balance font-serif text-[clamp(3rem,8.5vw,5.5rem)] font-light leading-[0.98] tracking-[-0.025em]">
        <AmpName text={main} />
        {qualifier && (
          <span className="italic text-foreground/55">
            {' ('}
            <AmpName text={qualifier} />
            {')'}
          </span>
        )}
      </h1>

      <p className="ql-fade ql-d2 mt-7 max-w-[34ch] font-serif text-[clamp(1.15rem,2.4vw,1.5rem)] font-light italic leading-[1.4] text-foreground/70">
        {theme.tagline}
      </p>

      {facts && (
        <p className="ql-fade ql-d3 mt-9 max-w-[56ch] text-[1.02rem] leading-[1.62] text-foreground/70">
          {facts.blurb}
        </p>
      )}

      <dl className="ql-fade ql-d4 mt-11 grid grid-cols-2 border-t border-input md:mt-16 md:grid-cols-4">
        <Glance
          label={shulCount === 1 ? 'Shul' : 'Shuls'}
          value={shulCount == null ? '…' : num(shulCount)}
          accent={theme.accent}
        />
        {pop && <Glance label="Jewish pop." value={pop.value} unit={pop.unit} />}
        {home && <Glance label="Median home" value={home.value} unit={home.unit} />}
        {facts && <Glance label="Cost of living" value={String(facts.costOfLivingIndex)} />}
      </dl>
    </header>
  )
}
