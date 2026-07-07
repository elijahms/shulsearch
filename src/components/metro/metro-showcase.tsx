'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getMetro } from '@/lib/metros'
import { getMetroFacts, type MetroFacts } from '@/lib/metros/facts'
import { metroTheme } from '@/lib/metros/theme'
import { getShulsByMetro, type ShulDoc } from '@/lib/shuls/queries'
import { MetroHero } from './metro-hero'
import { SchoolsSection } from './schools-section'
import { SectionHead } from './section-head'
import { StatCard } from './stat-card'
import { usd, num } from './format'

/** One denomination slice of the community's shuls (derived from live data). */
interface DenomSlice {
  label: string
  count: number
  share: number
}

/** `Modern Orthodox` → `var(--denom-modern-orthodox)` — palette lives in globals.css. */
const denomColor = (label: string) => `var(--denom-${label.toLowerCase().replace(/\s+/g, '-')})`

/** "Teaneck / Bergen" → "Teaneck", "Houston (Meyerland)" → "Houston" (for prose). */
const shortName = (name: string) => name.split(/[/(]/)[0].trim()

export function MetroShowcase({ id }: { id: string }) {
  const metro = getMetro(id)
  const facts = getMetroFacts(id)
  const theme = metroTheme(id)
  const [shuls, setShuls] = useState<ShulDoc[] | null>(null)

  useEffect(() => {
    let alive = true
    // Reset to the loading state whenever the metro changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShuls(null)
    if (!metro) return
    getShulsByMetro(id)
      .then((rows) => {
        if (alive) setShuls(rows)
      })
      .catch(() => {
        if (alive) setShuls([])
      })
    return () => {
      alive = false
    }
  }, [id, metro])

  const shulCount = shuls == null ? null : shuls.length

  // Real denomination spread of this community's shuls (most specific known level).
  const spread = useMemo<DenomSlice[]>(() => {
    if (!shuls || shuls.length === 0) return []
    const counts = new Map<string, number>()
    for (const s of shuls) {
      const label = s.denomination.subtype ?? s.denomination.category
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, share: count / shuls.length }))
  }, [shuls])

  // Graceful fallback for an unknown metro id.
  if (!metro) {
    return (
      <div className="grid h-full place-items-center overflow-y-auto bg-background px-6 py-16 text-center">
        <div className="max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            ShulSearch
          </p>
          <h1 className="mt-5 font-serif text-3xl font-light tracking-[-0.01em]">
            Community not found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We don&apos;t have a community page for “{id}”.
          </p>
          <Link
            href="/metro"
            className="mt-6 inline-block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Browse all communities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* The metro's single identity mark: a 2px accent bar. */}
      <div className="h-0.5" style={{ backgroundColor: theme.accent }} aria-hidden />

      <div className="mx-auto w-full max-w-[960px] px-6 pb-28 sm:px-10 lg:px-14">
        <div className="ql-fade ql-d1 pt-7">
          <Link
            href="/metro"
            className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← All communities
          </Link>
        </div>

        <MetroHero metro={metro} theme={theme} facts={facts} shulCount={shulCount} />

        <div className="ql-fade ql-d5">
          {facts ? (
            <CostSection facts={facts} />
          ) : (
            <section className="mt-16 border border-border bg-card px-8 py-12 text-center md:mt-24">
              <p className="font-serif text-2xl font-light tracking-[-0.01em]">
                Community details coming soon
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                We don&apos;t have curated cost, tax, and population data for {metro.name} yet —
                but you can still search homes near its shuls.
              </p>
            </section>
          )}

          <SchoolsSection metroId={id} accent={theme.accent} />

          {(facts || spread.length > 0) && (
            <CommunitySection facts={facts} shulCount={shulCount} spread={spread} />
          )}

          {/* CTA */}
          <div className="mt-20 flex flex-wrap items-end justify-between gap-x-10 gap-y-8 border-t border-foreground/90 pt-9 md:mt-28">
            <p className="max-w-[20ch] font-serif text-[clamp(1.5rem,3.2vw,2.1rem)] font-light leading-[1.12] tracking-[-0.02em]">
              See homes within a walk of a {shortName(metro.name)} shul.
            </p>
            <Link
              href="/"
              className="shrink-0 rounded-[2px] px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: theme.accent }}
            >
              Search homes
              <span aria-hidden className="ml-2">
                →
              </span>
            </Link>
          </div>

          {/* Sources */}
          <footer className="mt-16">
            <p className="text-[10px] uppercase leading-[1.9] tracking-[0.1em] text-muted-foreground">
              Figures — Shuls: ShulSearch community database · Jewish schools: NCES Private
              School Universe Survey
              {facts && (
                <>
                  {' '}
                  · Jewish population: {facts.jewishPopSource} · {facts.sourceNote}
                </>
              )}
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

/** One cell of the hairline cost lattice — a borderless StatCard on the page ground. */
function CostCell({
  label,
  value,
  unit,
  sub,
}: {
  label: string
  value: string
  unit?: string
  sub?: string
}) {
  return (
    <StatCard
      className="border-0 bg-background md:p-6"
      label={label}
      value={
        <>
          {value}
          {unit && (
            <span className="ml-0.5 text-xs font-medium tracking-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </>
      }
      sub={sub}
    />
  )
}

function CostSection({ facts }: { facts: MetroFacts }) {
  const annualBill = facts.medianHomeValue * facts.effectivePropertyTaxRate
  const incomeTax = facts.stateIncomeTaxTopRate
  return (
    <section className="mt-16 md:mt-24">
      <SectionHead title="Cost & taxes" note={`Approx. ${facts.asOf}`} />

      <div className="mt-7 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3">
        <CostCell
          label="Median home value"
          value={usd(facts.medianHomeValue)}
          sub="Community-area median"
        />
        <CostCell
          label="Median rent"
          value={usd(facts.medianRent)}
          unit="/mo"
          sub="Typical asking rent"
        />
        <CostCell
          label="Property tax"
          value={(facts.effectivePropertyTaxRate * 100).toFixed(2)}
          unit="%"
          sub={`≈ ${usd(annualBill)}/yr on the median home`}
        />
        <CostCell
          label="Cost of living"
          value={String(facts.costOfLivingIndex)}
          sub="Index · U.S. average = 100"
        />
        <CostCell
          label="State income tax"
          value={incomeTax > 0 ? (incomeTax * 100).toFixed(2) : 'None'}
          unit={incomeTax > 0 ? '%' : undefined}
          sub={
            facts.localIncomeTaxNote ??
            (incomeTax > 0 ? 'Top marginal rate' : 'No state income tax')
          }
        />
        <CostCell
          label="Sales tax"
          value={(facts.salesTaxRate * 100).toFixed(2)}
          unit="%"
          sub="Combined state + local"
        />
      </div>

      <p className="mt-6 max-w-[60ch] font-serif text-[1.05rem] font-light italic leading-normal text-foreground/70">
        {facts.typicalPropertyTaxNote}
      </p>
    </section>
  )
}

function CommRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border pb-3.5">
      <span className="text-[15px] text-foreground/70">{k}</span>
      <span className="text-[15px] tabular-nums">{v}</span>
    </div>
  )
}

function CommunitySection({
  facts,
  shulCount,
  spread,
}: {
  facts?: MetroFacts
  shulCount: number | null
  spread: DenomSlice[]
}) {
  return (
    <section className="mt-16 md:mt-24">
      <SectionHead title="Community" note="At a glance" />

      <div className="mt-7 grid gap-x-12 gap-y-5 sm:grid-cols-2">
        {facts && <CommRow k="Jewish population" v={`≈ ${num(facts.jewishPopulation)}`} />}
        <CommRow k="Shuls on ShulSearch" v={shulCount == null ? '…' : num(shulCount)} />
      </div>

      {spread.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Shul denominations
          </p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full">
            {spread.map((s) => (
              <span
                key={s.label}
                className="h-full"
                style={{ width: `${s.share * 100}%`, backgroundColor: denomColor(s.label) }}
              />
            ))}
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2">
            {spread.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-2 text-[0.8rem] text-foreground/70"
              >
                <span
                  className="size-2 rounded-[2px]"
                  style={{ backgroundColor: denomColor(s.label) }}
                  aria-hidden
                />
                {s.label} {Math.round(s.share * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
