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
import { DenominationFilterPill } from '@/components/shul/denomination-badge'
import { cn } from '@/lib/utils'

const CATEGORIES = DenominationCategory.options
const RADII = [0.5, 0.75, 1, 1.5] // miles
const MILE = 1609.34

/** Quiet hairline field shared by the toolbar controls. */
const FIELD =
  'h-9 rounded-[2px] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring'

/** A toolbar control under its small-caps micro-label. */
function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span
        aria-hidden
        className="text-[10px] font-medium uppercase leading-none tracking-[0.16em] text-muted-foreground"
      >
        {label}
      </span>
      {children}
    </div>
  )
}

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
      'px-3 text-xs font-medium capitalize transition-colors tabular-nums',
      active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div className="flex h-full flex-col">
      <div className="ql-fade ql-d1 shrink-0 space-y-3 border-b border-border bg-background px-4 py-3.5 sm:px-5">
        {/* Page heading — the chrome is bare on desktop; every page carries its own. */}
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-xl font-medium leading-none">Search</h1>
          <p className="hidden font-serif text-sm italic text-muted-foreground sm:block">
            homes within a walk of shul
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <Control label="Community">
            <select
              value={metroId}
              onChange={(e) => setMetroId(e.target.value)}
              aria-label="Metro"
              className={cn(FIELD, 'font-medium')}
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
          </Control>

          <Control label="Near shul">
            <select
              value={nearShulId}
              onChange={(e) => setNearShulId(e.target.value)}
              aria-label="Near which shul"
              className={cn(FIELD, 'min-w-0 max-w-[220px]')}
            >
              <option value="any">Any shul (filtered)</option>
              {filteredShuls.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Control>

          <Control label="Radius">
            <div className="inline-flex h-9 items-stretch divide-x divide-border overflow-hidden rounded-[2px] border border-input">
              {RADII.map((r) => (
                <button key={r} type="button" onClick={() => setRadiusMi(r)} className={segBtn(radiusMi === r)}>
                  {r} mi
                </button>
              ))}
            </div>
          </Control>

          <Control label="Market">
            <div className="inline-flex h-9 items-stretch divide-x divide-border overflow-hidden rounded-[2px] border border-input">
              {(['buy', 'rent'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setListingType(t)} className={segBtn(listingType === t)}>
                  {t}
                </button>
              ))}
            </div>
          </Control>

          <button
            type="button"
            onClick={runSearch}
            disabled={searching || loadingShuls}
            className="ml-auto h-9 rounded-[2px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search homes'}
          </button>
        </div>

        {present.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {present.map((c) => (
              <DenominationFilterPill key={c} category={c} active={enabled.has(c)} onClick={() => toggle(c)} />
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <aside className="ql-fade ql-d2 flex max-h-[45%] min-h-0 flex-col overflow-y-auto border-t border-border bg-background md:max-h-none md:w-[380px] md:border-t-0 md:border-r">
          <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur">
            {results ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <span className="text-foreground tabular-nums">{results.length}</span>{' '}
                {listingType === 'rent' ? 'rentals' : 'homes'} · within{' '}
                <span className="tabular-nums">{radiusMi}</span> mi
                {provider === 'mock' && ' · sample data'}
              </p>
            ) : loadingShuls ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Loading shuls…
              </p>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Pick a shul below (or search “any”), then{' '}
                <span className="font-medium text-foreground">Search homes</span>
              </p>
            )}
          </div>
          {error && <div className="px-4 py-2.5 text-[13px] text-destructive">{error}</div>}
          {results ? (
            results.length > 0 ? (
              <ListingsList items={results} selectedId={selectedListingId} onSelect={setSelectedListingId} />
            ) : (
              <p className="px-6 py-14 text-center font-serif text-[0.95rem] font-light italic leading-relaxed text-muted-foreground">
                No {listingType === 'rent' ? 'rentals' : 'homes'} within {radiusMi} mi — try a
                larger radius.
              </p>
            )
          ) : (
            <ShulList shuls={filteredShuls} selectedId={nearShulId === 'any' ? undefined : nearShulId} onSelect={setNearShulId} />
          )}
        </aside>

        <div className="ql-fade ql-d3 min-h-[280px] flex-1">
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
