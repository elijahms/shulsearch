import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Metro } from '@/lib/metros'
import type { MetroFacts } from '@/lib/metros/facts'
import type { MetroTheme } from '@/lib/metros/theme'
import { usd, num, heroTextColor } from './format'

/** A themed community card for the `/metro` index grid. Links to the showcase. */
export function MetroCard({
  metro,
  facts,
  theme,
}: {
  metro: Metro
  facts?: MetroFacts
  theme: MetroTheme
}) {
  return (
    <Link
      href={`/metro/${metro.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/20"
    >
      <div
        className="relative flex h-24 items-end p-4"
        style={{ background: theme.heroBackground, color: heroTextColor(theme.heroText) }}
      >
        <span className="absolute right-3 top-3 text-2xl" aria-hidden>
          {theme.motif}
        </span>
        <p className="line-clamp-2 pr-9 text-xs font-medium opacity-90">{theme.tagline}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-heading text-base font-semibold leading-snug">{metro.name}</h3>
            <p className="text-xs text-muted-foreground">{metro.state}</p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </div>

        {facts ? (
          <dl className="mt-auto grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Jewish pop.</dt>
              <dd className="text-sm font-semibold" style={{ color: theme.accent }}>
                ~{num(facts.jewishPopulation)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Median home</dt>
              <dd className="text-sm font-semibold text-foreground">{usd(facts.medianHomeValue)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-auto text-xs text-muted-foreground">Details coming soon.</p>
        )}
      </div>
    </Link>
  )
}
