'use client'
import { useEffect, useMemo, useState } from 'react'
import { METROS, getMetro } from '@/lib/metros'
import { getShulsByMetro, type ShulDoc } from '@/lib/shuls/queries'
import { DenominationCategory, type DenominationCategoryT } from '@/lib/shuls/schema'
import { ShulMap } from './shul-map'
import { ShulList } from './shul-list'
import { DenominationFilterPill } from './denomination-badge'

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
      <div className="ql-fade ql-d1 shrink-0 border-b border-border bg-background px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span
              aria-hidden
              className="text-[10px] font-medium uppercase leading-none tracking-[0.16em] text-muted-foreground"
            >
              Community
            </span>
            <select
              value={metroId}
              onChange={(e) => setMetroId(e.target.value)}
              className="h-9 rounded-[2px] border border-input bg-background px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
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
          </div>
          <span className="self-end pb-2 text-[13px] leading-none text-muted-foreground">
            {loading ? (
              'Loading…'
            ) : (
              <>
                <span className="font-medium text-foreground tabular-nums">{filtered.length}</span>{' '}
                shul{filtered.length === 1 ? '' : 's'} within a walk
              </>
            )}
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5 self-end pb-1">
            {present.map((c) => (
              <DenominationFilterPill key={c} category={c} active={enabled.has(c)} onClick={() => toggle(c)} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <aside className="ql-fade ql-d2 flex max-h-[45%] min-h-0 flex-col overflow-y-auto border-t border-border bg-background md:max-h-none md:w-[360px] md:border-t-0 md:border-r">
          <ShulList shuls={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
        <div className="ql-fade ql-d3 min-h-[280px] flex-1">
          <ShulMap metro={metro} shuls={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>
    </div>
  )
}
