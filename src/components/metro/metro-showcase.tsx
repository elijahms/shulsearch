'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MapPinned, Search } from 'lucide-react'
import { getMetro } from '@/lib/metros'
import { getMetroFacts } from '@/lib/metros/facts'
import { metroTheme } from '@/lib/metros/theme'
import { getShulsByMetro } from '@/lib/shuls/queries'
import { MetroHero } from './metro-hero'
import { HERO_OVERRIDES } from './heroes'
import { StatCard } from './stat-card'
import { usd, num, pct, rateOrNone } from './format'

export function MetroShowcase({ id }: { id: string }) {
  const metro = getMetro(id)
  const facts = getMetroFacts(id)
  const theme = metroTheme(id)
  const [shulCount, setShulCount] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    // Reset to the loading state whenever the metro changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShulCount(null)
    if (!metro) return
    getShulsByMetro(id)
      .then((rows) => {
        if (alive) setShulCount(rows.length)
      })
      .catch(() => {
        if (alive) setShulCount(0)
      })
    return () => {
      alive = false
    }
  }, [id, metro])

  // Graceful fallback for an unknown metro id.
  if (!metro) {
    return (
      <div className="grid h-full place-items-center px-6 py-16 text-center">
        <div className="max-w-sm space-y-3">
          <MapPinned className="mx-auto size-8 text-muted-foreground" />
          <h1 className="font-heading text-xl font-semibold">Community not found</h1>
          <p className="text-sm text-muted-foreground">
            We don&apos;t have a community page for “{id}”.
          </p>
          <Link
            href="/metro"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> Browse all communities
          </Link>
        </div>
      </div>
    )
  }

  const Hero = HERO_OVERRIDES[id] ?? MetroHero
  const annualBill = facts ? facts.medianHomeValue * facts.effectivePropertyTaxRate : null

  return (
    <div className="h-full overflow-y-auto">
      <Hero metro={metro} theme={theme} facts={facts} shulCount={shulCount} />

      <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
        <Link
          href="/metro"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All communities
        </Link>

        {facts ? (
          <div className="mt-8 space-y-12">
            {/* Cost & taxes */}
            <section>
              <h2 className="font-heading text-xl font-semibold tracking-tight">Cost &amp; taxes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Approximate {facts.asOf} figures for the community area.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Median home value" value={usd(facts.medianHomeValue)} accent={theme.accent} />
                <StatCard label="Median rent" value={<>{usd(facts.medianRent)}<span className="text-base font-normal text-muted-foreground">/mo</span></>} />
                <StatCard
                  label="Property tax rate"
                  value={pct(facts.effectivePropertyTaxRate)}
                  accent={theme.accent}
                  sub={annualBill != null ? <>≈ {usd(annualBill)}/yr on the median home</> : undefined}
                />
                <StatCard
                  label="Cost of living"
                  value={facts.costOfLivingIndex}
                  sub="index · US avg = 100"
                />
              </div>

              <div
                className="mt-4 grid gap-4 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-3"
                style={{ backgroundColor: theme.accentSoft }}
              >
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    State income tax
                  </p>
                  <p className="mt-1 font-heading text-lg font-semibold">
                    {rateOrNone(facts.stateIncomeTaxTopRate)}
                    {facts.stateIncomeTaxTopRate > 0 && (
                      <span className="text-xs font-normal text-muted-foreground"> top rate</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sales tax</p>
                  <p className="mt-1 font-heading text-lg font-semibold">{pct(facts.salesTaxRate)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Note</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {facts.localIncomeTaxNote ?? facts.typicalPropertyTaxNote}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{facts.typicalPropertyTaxNote}</p>
            </section>

            {/* Community */}
            <section>
              <h2 className="font-heading text-xl font-semibold tracking-tight">Community</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <StatCard
                  label="Jewish population"
                  value={<>~{num(facts.jewishPopulation)}</>}
                  accent={theme.accent}
                  sub={facts.jewishPopSource}
                />
                <StatCard
                  label="Shuls on ShulSearch"
                  value={shulCount == null ? '…' : num(shulCount)}
                  sub={
                    <Link href="/" className="inline-flex items-center gap-1 text-primary hover:underline">
                      Explore them on the map <ArrowRight className="size-3" />
                    </Link>
                  }
                />
              </div>
              <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-foreground/90">{facts.blurb}</p>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{facts.sourceNote}</p>
            </section>
          </div>
        ) : (
          <div className="mt-8 rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold">Community details coming soon</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We don&apos;t have curated cost, tax, and population data for {metro.name} yet — but you
              can still search homes near its shuls.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold tracking-tight">
              Ready to find a home in {metro.name}?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search listings within a walk of any shul in the community.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: theme.accent }}
          >
            <Search className="size-4" /> Search homes near a shul here
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
