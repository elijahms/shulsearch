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
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">No shuls match this filter.</p>
  }

  return (
    <ul className="divide-y divide-border">
      {shuls.map((s) => (
        <li key={s.id} ref={s.id === selectedId ? selectedRef : undefined}>
          <button
            type="button"
            onClick={() => onSelect?.(s.id)}
            className={cn(
              'w-full px-4 py-3 text-left transition-colors hover:bg-secondary/70',
              s.id === selectedId && 'bg-secondary',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium leading-snug text-foreground">{s.name}</span>
              {s.needsReview && (
                <span
                  title="Denomination auto-guessed — pending review"
                  className="mt-0.5 shrink-0 text-[10px] font-medium uppercase tracking-wider text-accent-foreground/60"
                >
                  unverified
                </span>
              )}
            </div>
            {s.address && <p className="mt-0.5 text-xs text-muted-foreground">{s.address}</p>}
            <div className="mt-1.5">
              <DenominationBadge d={s.denomination} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
