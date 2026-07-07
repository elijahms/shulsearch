import { denominationLabel } from '@/lib/shuls/denomination-color'
import type { Denomination, DenominationCategoryT } from '@/lib/shuls/schema'
import { cn } from '@/lib/utils'

/** `Modern Orthodox` → `var(--denom-modern-orthodox)` — palette lives in globals.css. */
const denomVar = (label: string) => `var(--denom-${label.toLowerCase().replace(/\s+/g, '-')})`

export function DenominationDot({ d, className = '' }: { d: Denomination; className?: string }) {
  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${className}`}
      style={{ background: denomVar(denominationLabel(d)) }}
    />
  )
}

/**
 * Quiet Luxe denomination pill — hairline border, full-chroma dot, and a label
 * mixed toward the muted ink so the hue whispers instead of shouting.
 */
export function DenominationBadge({ d }: { d: Denomination }) {
  const v = denomVar(denominationLabel(d))
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-[3px] text-[11px] font-medium leading-none"
      style={{ color: `color-mix(in oklab, ${v} 55%, var(--muted-foreground))` }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: v }} aria-hidden />
      {denominationLabel(d)}
    </span>
  )
}

/**
 * Toggleable denomination-category filter pill (shared by the search + explorer
 * toolbars). The dot doubles as a legend for the map pins; it dims when off.
 */
export function DenominationFilterPill({
  category,
  active,
  onClick,
}: {
  category: DenominationCategoryT
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none transition-colors',
        active
          ? 'border-foreground/25 text-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full transition-opacity', !active && 'opacity-25')}
        style={{ background: denomVar(category) }}
        aria-hidden
      />
      {category}
    </button>
  )
}
