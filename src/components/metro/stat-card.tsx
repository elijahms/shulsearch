import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A single labelled statistic — Quiet Luxe: hairline border, quiet card ground,
 * small-caps label, and a tabular figure. No shadows, no rounding.
 */
export function StatCard({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  /** Optional hex — colors the value for emphasis (usually the metro accent). */
  accent?: string
  className?: string
}) {
  return (
    <div className={cn('border border-border bg-card p-5', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-2.5 text-[1.7rem] font-medium leading-none tracking-[-0.02em] tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {sub != null && (
        <p className="mt-2 text-[0.8rem] leading-[1.4] text-muted-foreground">{sub}</p>
      )}
    </div>
  )
}
