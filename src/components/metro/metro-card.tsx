import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Metro } from '@/lib/metros'
import type { MetroFacts } from '@/lib/metros/facts'
import type { MetroTheme } from '@/lib/metros/theme'
import { num, stateName } from './format'

/**
 * Quiet Luxe community card for the `/metro` index grid — hairline border, a tiny
 * accent dot in the metro's theme color, serif name, and one tabular fact. Links to
 * the showcase; on hover the border darkens and the name takes the metro accent.
 */
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
      style={{ '--metro-accent': theme.accent } as CSSProperties}
      className="group flex flex-col border border-border bg-card p-5 transition-colors duration-150 hover:border-foreground/30"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: theme.accent }}
            aria-hidden
          />
          <span className="truncate">{stateName(metro.state)}</span>
        </p>
        <ArrowUpRight
          className="size-3.5 shrink-0 text-muted-foreground/50 transition-colors duration-150 group-hover:text-foreground"
          aria-hidden
        />
      </div>

      <h3 className="mb-8 mt-2.5 font-serif text-[1.35rem] font-normal leading-snug tracking-[-0.01em] text-foreground transition-colors duration-150 group-hover:text-[var(--metro-accent)]">
        {metro.name}
      </h3>

      {facts ? (
        <p className="mt-auto flex items-baseline justify-between gap-4 border-t border-border pt-3 text-[13px]">
          <span className="text-muted-foreground">Jewish population</span>
          <span className="tabular-nums text-foreground/80">≈ {num(facts.jewishPopulation)}</span>
        </p>
      ) : (
        <p className="mt-auto border-t border-border pt-3 text-[13px] text-muted-foreground">
          Details coming soon.
        </p>
      )}
    </Link>
  )
}
