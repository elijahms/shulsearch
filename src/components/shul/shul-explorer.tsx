'use client'
import { useEffect, useMemo, useState } from 'react'
import { METROS, getMetro } from '@/lib/metros'
import { getShulsByMetro, type ShulDoc } from '@/lib/shuls/queries'
import { DenominationCategory, type DenominationCategoryT } from '@/lib/shuls/schema'
import { ShulMap } from './shul-map'
import { ShulList } from './shul-list'
import { cn } from '@/lib/utils'

const CATEGORIES = DenominationCategory.options

export function ShulExplorer() {
  const [metroId, setMetroId] = useState('teaneck-bergen-nj')
  const [shuls, setShuls] = useState<ShulDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState<Set<DenominationCategoryT>>(new Set(CATEGORIES))
  const [selectedId, setSelectedId] = useState<string>()

  const metro = getMetro(metroId)!

  useEffect(() => {
    let alive = true
    // Intentional: show the loading state immediately when the metro changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getShulsByMetro(metroId)
      .then((rows) => {
        if (!alive) return
        setShuls([...rows].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedId(undefined)
        setLoading(false)
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [metroId])

  const present = useMemo(() => {
    const s = new Set<DenominationCategoryT>(shuls.map((x) => x.denomination.category))
    return CATEGORIES.filter((c) => s.has(c))
  }, [shuls])

  const filtered = useMemo(
    () => shuls.filter((s) => enabled.has(s.denomination.category)),
    [shuls, enabled],
  )

  function toggle(c: DenominationCategoryT) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <select
            value={metroId}
            onChange={(e) => setMetroId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Metro"
          >
            <optgroup label="Established communities">
              {METROS.filter((m) => m.tier === 1).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}, {m.state}
                </option>
              ))}
            </optgroup>
            <optgroup label="Growing communities">
              {METROS.filter((m) => m.tier === 2).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}, {m.state}
                </option>
              ))}
            </optgroup>
          </select>
          <span className="text-sm text-muted-foreground">
            {loading ? (
              'Loading…'
            ) : (
              <>
                <span className="font-semibold text-foreground">{filtered.length}</span> shul
                {filtered.length === 1 ? '' : 's'} within a walk
              </>
            )}
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5">
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
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <aside className="flex max-h-[45%] min-h-0 flex-col overflow-y-auto border-t bg-background md:max-h-none md:w-[360px] md:border-t-0 md:border-r">
          <ShulList shuls={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
        <div className="min-h-[280px] flex-1">
          <ShulMap metro={metro} shuls={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>
    </div>
  )
}
