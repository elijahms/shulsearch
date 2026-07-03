'use client'
import { useEffect, useRef } from 'react'
import type { SearchResultItem } from '@/lib/search/types'
import { cn } from '@/lib/utils'

function fmtPrice(l: SearchResultItem): string {
  return l.listingType === 'rent'
    ? `$${l.price.toLocaleString()}/mo`
    : `$${l.price.toLocaleString()}`
}

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
              'w-full px-4 py-3 text-left transition-colors hover:bg-secondary/70',
              l.id === selectedId && 'bg-secondary',
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-semibold text-foreground">{fmtPrice(l)}</span>
              {l.homeType && (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                  {l.homeType}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {[l.beds != null && `${l.beds} bd`, l.baths != null && `${l.baths} ba`, l.sqft != null && `${l.sqft.toLocaleString()} sqft`]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {l.address && <div className="mt-0.5 text-xs text-muted-foreground">{l.address}</div>}
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              {fmtProximity(l)}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
