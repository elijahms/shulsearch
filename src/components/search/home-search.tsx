'use client'
import { useEffect, useMemo, useState } from 'react'
import { METROS, getMetro } from '@/lib/metros'
import { getShulsByMetro, type ShulDoc } from '@/lib/shuls/queries'
import { DenominationCategory, type DenominationCategoryT } from '@/lib/shuls/schema'
import { searchHomesClient } from '@/lib/search/client'
import type { SearchResultItem } from '@/lib/search/types'
import { SearchMap } from './search-map'
import { ListingsList } from './listings-list'
import { ShulList } from '@/components/shul/shul-list'
import { cn } from '@/lib/utils'

const CATEGORIES = DenominationCategory.options
const RADII = [0.5, 0.75, 1, 1.5] // miles
const MILE = 1609.34

export function HomeSearch() {
  const [metroId, setMetroId] = useState('teaneck-bergen-nj')
  const [shuls, setShuls] = useState<ShulDoc[]>([])
  const [loadingShuls, setLoadingShuls] = useState(true)
  const [enabled, setEnabled] = useState<Set<DenominationCategoryT>>(new Set(CATEGORIES))
  const [nearShulId, setNearShulId] = useState('any')
  const [radiusMi, setRadiusMi] = useState(1)
  const [listingType, setListingType] = useState<'buy' | 'rent'>('buy')
  const [results, setResults] = useState<SearchResultItem[] | null>(null)
  const [provider, setProvider] = useState<string>()
  const [searching, setSearching] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string>()
  const [error, setError] = useState<string>()

  const metro = getMetro(metroId)!

  useEffect(() => {
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingShuls(true)
    setResults(null)
    setNearShulId('any')
    getShulsByMetro(metroId)
      .then((rows) => {
        if (!alive) return
        setShuls([...rows].sort((a, b) => a.name.localeCompare(b.name)))
        setLoadingShuls(false)
      })
      .catch(() => {
        if (alive) setLoadingShuls(false)
      })
    return () => {
      alive = false
    }
  }, [metroId])

  const present = useMemo(() => {
    const s = new Set<DenominationCategoryT>(shuls.map((x) => x.denomination.category))
    return CATEGORIES.filter((c) => s.has(c))
  }, [shuls])

  const filteredShuls = useMemo(
    () => shuls.filter((s) => enabled.has(s.denomination.category)),
    [shuls, enabled],
  )

  const highlightShulIds = useMemo(() => {
    if (!results) return new Set<string>()
    return nearShulId !== 'any' ? new Set([nearShulId]) : new Set(filteredShuls.map((s) => s.id))
  }, [results, nearShulId, filteredShuls])

  function toggle(c: DenominationCategoryT) {
    setEnabled((prev) => {
      const n = new Set(prev)
      if (n.has(c)) n.delete(c)
      else n.add(c)
      return n
    })
  }

  async function runSearch() {
    setError(undefined)
    const nearShuls = nearShulId === 'any' ? filteredShuls : shuls.filter((s) => s.id === nearShulId)
    if (nearShuls.length === 0) {
      setError('No shuls to search near — adjust the denomination filter.')
      return
    }
    setSearching(true)
    setResults(null)
    setSelectedListingId(undefined)
    try {
      const res = await searchHomesClient({
        shuls: nearShuls.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng })),
        radiusMeters: Math.round(radiusMi * MILE),
        listingType,
        metro: metroId,
        mode: nearShulId === 'any' ? 'any' : 'specific',
      })
      setResults(res.items)
      setProvider(res.provider)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const segBtn = (active: boolean) =>
    cn(
      'rounded px-2.5 py-1 text-xs font-medium capitalize transition',
      active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-2 border-b bg-background px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={metroId}
            onChange={(e) => setMetroId(e.target.value)}
            aria-label="Metro"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <optgroup label="Established communities">
              {METROS.filter((m) => m.tier === 1).map((m) => (
                <option key={m.id} value={m.id}>{m.name}, {m.state}</option>
              ))}
            </optgroup>
            <optgroup label="Growing communities">
              {METROS.filter((m) => m.tier === 2).map((m) => (
                <option key={m.id} value={m.id}>{m.name}, {m.state}</option>
              ))}
            </optgroup>
          </select>

          <select
            value={nearShulId}
            onChange={(e) => setNearShulId(e.target.value)}
            aria-label="Near which shul"
            className="min-w-0 max-w-[220px] rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="any">Any shul (filtered)</option>
            {filteredShuls.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1 rounded-md border bg-muted p-0.5">
            {RADII.map((r) => (
              <button key={r} type="button" onClick={() => setRadiusMi(r)} className={segBtn(radiusMi === r)}>
                {r} mi
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 rounded-md border bg-muted p-0.5">
            {(['buy', 'rent'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setListingType(t)} className={segBtn(listingType === t)}>
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={runSearch}
            disabled={searching || loadingShuls}
            className="ml-auto rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search homes'}
          </button>
        </div>

        {present.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {present.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                  enabled.has(c)
                    ? 'border-foreground/15 bg-foreground/[0.06] text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <aside className="flex max-h-[45%] min-h-0 flex-col overflow-y-auto border-t bg-background md:max-h-none md:w-[380px] md:border-t-0 md:border-r">
          <div className="sticky top-0 z-10 shrink-0 border-b bg-background/95 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            {results ? (
              <>
                <span className="font-semibold text-foreground">{results.length}</span>{' '}
                {listingType === 'rent' ? 'rentals' : 'homes'} within {radiusMi} mi
                {provider === 'mock' && ' · sample data'}
              </>
            ) : loadingShuls ? (
              'Loading shuls…'
            ) : (
              <>Pick a shul below (or search “any”), then <span className="font-medium text-foreground">Search homes</span></>
            )}
          </div>
          {error && <div className="px-4 py-2 text-sm text-destructive">{error}</div>}
          {results ? (
            results.length > 0 ? (
              <ListingsList items={results} selectedId={selectedListingId} onSelect={setSelectedListingId} />
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No {listingType === 'rent' ? 'rentals' : 'homes'} within {radiusMi} mi — try a larger radius.
              </p>
            )
          ) : (
            <ShulList shuls={filteredShuls} selectedId={nearShulId === 'any' ? undefined : nearShulId} onSelect={setNearShulId} />
          )}
        </aside>

        <div className="min-h-[280px] flex-1">
          <SearchMap
            metro={metro}
            shuls={filteredShuls}
            highlightShulIds={highlightShulIds}
            listings={results ?? []}
            selectedListingId={selectedListingId}
            onSelectListing={setSelectedListingId}
          />
        </div>
      </div>
    </div>
  )
}
