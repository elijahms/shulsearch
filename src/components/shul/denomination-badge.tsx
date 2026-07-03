import { denominationColorHex, denominationLabel } from '@/lib/shuls/denomination-color'
import type { Denomination } from '@/lib/shuls/schema'

export function DenominationDot({ d, className = '' }: { d: Denomination; className?: string }) {
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ring-1 ring-black/10 ${className}`}
      style={{ background: denominationColorHex(d) }}
    />
  )
}

export function DenominationBadge({ d }: { d: Denomination }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <DenominationDot d={d} />
      {denominationLabel(d)}
    </span>
  )
}
