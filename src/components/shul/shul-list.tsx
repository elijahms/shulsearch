'use client'
import { useEffect, useRef } from 'react'
import type { ShulDoc } from '@/lib/shuls/queries'
import { DenominationBadge } from './denomination-badge'
import { cn } from '@/lib/utils'

export function ShulList({
  shuls,
  selectedId,
  onSelect,
}: {
  shuls: ShulDoc[]
  selectedId?: string
  onSelect?: (id: string) => void
}) {
  const selectedRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  if (shuls.length === 0) {
    return (
      <p className="px-6 py-14 text-center font-serif text-[0.95rem] font-light italic leading-relaxed text-muted-foreground">
        No shuls match this filter.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {shuls.map((s) => (
        <li key={s.id} ref={s.id === selectedId ? selectedRef : undefined}>
          <button
            type="button"
            onClick={() => onSelect?.(s.id)}
            className={cn(
              'relative w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/50',
              s.id === selectedId && 'bg-accent',
            )}
          >
            {s.id === selectedId && (
              <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />
            )}
            <div className="flex items-start justify-between gap-3">
              <span className="text-[15px] font-medium leading-snug text-foreground">{s.name}</span>
              {s.needsReview && (
                <span
                  title="Denomination auto-guessed — pending review"
                  className="mt-1 shrink-0 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70"
                >
                  unverified
                </span>
              )}
            </div>
            {s.address && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.address}</p>}
            <div className="mt-2">
              <DenominationBadge d={s.denomination} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
