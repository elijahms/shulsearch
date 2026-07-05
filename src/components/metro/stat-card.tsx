import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A single labelled statistic tile used across the cost & community sections. */
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
    <div className={cn('rounded-xl bg-card p-4 ring-1 ring-foreground/10', className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className="mt-1 font-heading text-2xl font-semibold leading-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {sub != null && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  )
}
