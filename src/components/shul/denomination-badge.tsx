import { denominationColorHex, denominationLabel } from '@/lib/shuls/denomination-color'
import type { Denomination } from '@/lib/shuls/schema'

export function DenominationDot({ d, className = '' }: { d: Denomination; className?: string }) {
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ${className}`}
      style={{ background: denominationColorHex(d) }}
    />
  )
}

/** Soft tinted pill: colored dot + label on a light tint of the denomination color. */
export function DenominationBadge({ d }: { d: Denomination }) {
  const c = denominationColorHex(d)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${c}1a`, color: c }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c }} />
      {denominationLabel(d)}
    </span>
  )
}
