'use client'
import { useEffect } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import type { ShulDoc } from '@/lib/shuls/queries'
import type { SearchResultItem } from '@/lib/search/types'
import { denominationColorHex } from '@/lib/shuls/denomination-color'
import { metroCenter, type Metro } from '@/lib/metros'

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY

const dataUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`

function shulPin(color: string, highlighted: boolean): string {
  const s = highlighted ? 1 : 0.72
  const w = Math.round(22 * s)
  const h = Math.round(30 * s)
  return dataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 22 30"><path d="M11 0C4.9 0 0 4.9 0 11c0 8 11 19 11 19s11-11 11-19C22 4.9 17.1 0 11 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/><circle cx="11" cy="11" r="3.6" fill="#fff"/></svg>`,
  )
}

function priceBubble(label: string, selected: boolean): string {
  const w = 22 + label.length * 7.5
  const bg = selected ? '#111827' : '#0f5132'
  return dataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="30" viewBox="0 0 ${w} 30"><rect x="1" y="1" rx="9" ry="9" width="${w - 2}" height="21" fill="${bg}" stroke="#fff" stroke-width="1.5"/><path d="M${w / 2 - 5} 21 L${w / 2} 28 L${w / 2 + 5} 21 Z" fill="${bg}"/><text x="${w / 2}" y="16" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`,
  )
}

function priceLabel(l: SearchResultItem): string {
  if (l.listingType === 'rent') return `$${Math.round(l.price / 100) / 10}k`
  return l.price >= 1_000_000 ? `$${(l.price / 1_000_000).toFixed(1)}M` : `$${Math.round(l.price / 1000)}K`
}

function FitBounds({ pts }: { pts: { lat: number; lng: number }[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || pts.length === 0) return
    const lats = pts.map((p) => p.lat)
    const lngs = pts.map((p) => p.lng)
    map.fitBounds(
      { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
      72,
    )
  }, [map, pts])
  return null
}

export function SearchMap({
  metro,
  shuls,
  highlightShulIds,
  listings,
  selectedListingId,
  onSelectListing,
}: {
  metro: Metro
  shuls: ShulDoc[]
  highlightShulIds: Set<string>
  listings: SearchResultItem[]
  selectedListingId?: string
  onSelectListing?: (id: string) => void
}) {
  if (!KEY) {
    return (
      <div className="grid h-full place-items-center bg-muted text-sm text-muted-foreground">
        Map key not configured.
      </div>
    )
  }
  const fitPts = listings.length > 0 ? listings : shuls
  return (
    <APIProvider apiKey={KEY}>
      <Map
        defaultCenter={metroCenter(metro)}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        className="h-full w-full"
      >
        <FitBounds pts={fitPts} />
        {shuls.map((s) => (
          <Marker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            title={s.name}
            icon={shulPin(denominationColorHex(s.denomination), highlightShulIds.has(s.id))}
            zIndex={highlightShulIds.has(s.id) ? 500 : 1}
          />
        ))}
        {listings.map((l) => (
          <Marker
            key={l.id}
            position={{ lat: l.lat, lng: l.lng }}
            title={l.address}
            icon={priceBubble(priceLabel(l), l.id === selectedListingId)}
            zIndex={l.id === selectedListingId ? 999 : 100}
            onClick={() => onSelectListing?.(l.id)}
          />
        ))}
      </Map>
    </APIProvider>
  )
}
