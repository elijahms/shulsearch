import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DailyCount } from '@/lib/analytics/aggregate'

/** A single headline metric. */
export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="gap-1 px-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="font-heading text-2xl leading-none font-semibold tabular-nums">{value}</div>
    </Card>
  )
}

/** A panel with a heading and body, matching the admin card look. */
export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <Card className="gap-3 px-4">
      <div>
        <h3 className="font-heading text-sm font-medium">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </Card>
  )
}

/** Vertical bar chart of daily search volume. Bars are CSS-height divs. */
export function DailyVolume({ daily }: { daily: DailyCount[] }) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  return (
    <div className="flex h-32 items-end gap-1">
      {daily.map((d) => {
        const pct = (d.count / max) * 100
        return (
          <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end" title={`${d.date}: ${d.count}`}>
              <div
                className="w-full rounded-t-sm bg-primary/80"
                style={{ height: `${Math.max(pct, d.count > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[10px] leading-none text-muted-foreground tabular-nums">
              {d.date.slice(8)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export interface BarItem {
  /** Display label. */
  label: string
  count: number
}

/** Horizontal CSS-bar list, longest bar first. */
export function BarList({ items, emptyLabel = 'No data yet' }: { items: BarItem[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>
  }
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => {
        const pct = (item.count / max) * 100
        return (
          <li key={`${item.label}-${i}`} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 truncate text-muted-foreground" title={item.label}>
              {item.label}
            </span>
            <span className="relative h-4 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted">
              <span
                className={cn('absolute inset-y-0 left-0 rounded-sm bg-primary/80')}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right font-medium tabular-nums">{item.count}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** Two-segment split bar (e.g. Buy vs Rent). */
export function SplitBar({
  segments,
}: {
  segments: { label: string; count: number; className: string }[]
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) {
    return <p className="text-xs text-muted-foreground">No data yet</p>
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-4 w-full overflow-hidden rounded-sm bg-muted">
        {segments.map((s) => (
          <div
            key={s.label}
            className={s.className}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', s.className)} />
            {s.label}
            <span className="font-medium text-foreground tabular-nums">
              {s.count} ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
