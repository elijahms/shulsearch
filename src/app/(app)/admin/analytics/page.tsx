'use client'
import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { adminFetch } from '@/components/admin/api'
import { getMetro } from '@/lib/metros'
import type { Analytics } from '@/lib/analytics/aggregate'
import { BarList, DailyVolume, Panel, SplitBar, StatCard, type BarItem } from '@/components/admin/analytics/charts'

/** Meters -> a "N.N mi" label. */
function miles(meters: number): string {
  return `${(meters / 1609).toFixed(1)} mi`
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await adminFetch('/api/admin/analytics')
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      setData((await res.json()) as Analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          What people are searching for. Aggregated from the most recent 5,000 searches.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : data === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : data.total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <BarChart3 className="size-6" />
          <p className="text-sm">No searches logged yet — this fills in as people use the site.</p>
        </div>
      ) : (
        <Dashboard data={data} />
      )}
    </div>
  )
}

function Dashboard({ data }: { data: Analytics }) {
  const metroItems: BarItem[] = data.byMetro
    .slice(0, 10)
    .map((m) => ({ label: getMetro(m.metro)?.name ?? m.metro, count: m.count }))
  const shulItems: BarItem[] = data.byShul.map((s) => ({ label: s.shulId, count: s.count }))
  const radiusItems: BarItem[] = data.byRadius.map((r) => ({ label: miles(r.radiusMeters), count: r.count }))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total searches" value={data.total.toLocaleString()} />
        <StatCard label="Zero-result rate" value={`${(data.zeroResultRate * 100).toFixed(1)}%`} />
        <StatCard label="Distinct metros searched" value={data.byMetro.length.toLocaleString()} />
      </div>

      <Panel title="Daily volume" subtitle="Searches per day, last 14 days">
        <DailyVolume daily={data.daily} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel title="Top metros">
          <BarList items={metroItems} emptyLabel="No metros searched yet" />
        </Panel>
        <Panel title="Top shuls">
          <BarList items={shulItems} emptyLabel="No specific-shul searches yet" />
        </Panel>
        <Panel title="Radius distribution" subtitle="Search radius, in miles">
          <BarList items={radiusItems} emptyLabel="No searches yet" />
        </Panel>
        <Panel title="Buy vs rent">
          <SplitBar
            segments={[
              { label: 'Buy', count: data.byListingType.buy, className: 'bg-primary/80' },
              { label: 'Rent', count: data.byListingType.rent, className: 'bg-primary/40' },
            ]}
          />
        </Panel>
      </div>
    </div>
  )
}
