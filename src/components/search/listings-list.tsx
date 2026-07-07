'use client'
import { useEffect, useRef } from 'react'
import type { SearchResultItem } from '@/lib/search/types'
import { cn } from '@/lib/utils'

function fmtProximity(l: SearchResultItem): string {
  if (l.walkSeconds && l.walkSeconds > 0) {
    const min = Math.max(1, Math.round(l.walkSeconds / 60))
    return `${min} min walk to ${l.nearestShulName}`
  }
  const mi = l.distanceMeters / 1609.34
  return `${mi.toFixed(mi < 1 ? 2 : 1)} mi from ${l.nearestShulName}`
}

export function ListingsList({
  items,
  selectedId,
  onSelect,
}: {
  items: SearchResultItem[]
  selectedId?: string
  onSelect?: (id: string) => void
}) {
  const selectedRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <ul className="divide-y divide-border">
      {items.map((l) => (
        <li key={l.id} ref={l.id === selectedId ? selectedRef : undefined}>
          <button
            type="button"
            onClick={() => onSelect?.(l.id)}
            className={cn(
              'relative w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/50',
              l.id === selectedId && 'bg-accent',
            )}
          >
            {l.id === selectedId && (
              <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />
            )}
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[1.05rem] font-semibold leading-none tracking-[-0.01em] text-foreground tabular-nums">
                ${l.price.toLocaleString()}
                {l.listingType === 'rent' && (
                  <span className="ml-0.5 text-xs font-normal tracking-normal text-muted-foreground">
                    /mo
                  </span>
                )}
              </span>
              {l.homeType && (
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {l.homeType}
                </span>
              )}
            </div>
            {/* The walk to shul is the point of the product — the row's hero detail. */}
            <div className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-primary">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {fmtProximity(l)}
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
              {[
                l.beds != null && `${l.beds} bd`,
                l.baths != null && `${l.baths} ba`,
                l.sqft != null && `${l.sqft.toLocaleString()} sqft`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {l.address && <div className="mt-0.5 text-xs text-muted-foreground/80">{l.address}</div>}
          </button>
        </li>
      ))}
    </ul>
  )
}
