'use client'
import { useEffect } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import type { ShulDoc } from '@/lib/shuls/queries'
import { denominationColorHex } from '@/lib/shuls/denomination-color'
import { metroCenter, type Metro } from '@/lib/metros'

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY

/** A colored teardrop pin as an inline SVG data-URI (no WebGL / Map ID needed). */
function pinIcon(color: string, selected: boolean): string {
  const w = selected ? 30 : 22
  const h = selected ? 40 : 30
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 22 30">` +
    `<path d="M11 0C4.9 0 0 4.9 0 11c0 8 11 19 11 19s11-11 11-19C22 4.9 17.1 0 11 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>` +
    `<circle cx="11" cy="11" r="3.6" fill="#ffffff"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function FitBounds({ shuls }: { shuls: ShulDoc[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || shuls.length === 0) return
    const lats = shuls.map((s) => s.lat)
    const lngs = shuls.map((s) => s.lng)
    map.fitBounds(
      { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
      64,
    )
  }, [map, shuls])
  return null
}

export function ShulMap({
  metro,
  shuls,
  selectedId,
  onSelect,
}: {
  metro: Metro
  shuls: ShulDoc[]
  selectedId?: string
  onSelect?: (id: string) => void
}) {
  if (!KEY) {
    return (
      <div className="grid h-full place-items-center bg-muted px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Map key not configured
        </p>
      </div>
    )
  }
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
        <FitBounds shuls={shuls} />
        {shuls.map((s) => (
          <Marker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            title={s.name}
            icon={pinIcon(denominationColorHex(s.denomination), s.id === selectedId)}
            zIndex={s.id === selectedId ? 999 : undefined}
            onClick={() => onSelect?.(s.id)}
          />
        ))}
      </Map>
    </APIProvider>
  )
}
