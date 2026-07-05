'use client'
import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { getSchoolsByMetro } from '@/lib/schools/queries'
import { groupSchools, type SchoolGroups } from '@/lib/schools/group'
import { StatCard } from './stat-card'
import { num } from './format'

const TYPE_LABEL: Record<string, string> = {
  preschool: 'Preschools',
  elementary: 'Elementary',
  'day-school': 'Day schools',
  'high-school': 'High schools',
  'yeshiva-boys': "Boys' yeshivas",
  'yeshiva-girls': "Girls' schools",
  cheder: 'Chadarim',
  seminary: 'Seminaries',
  other: 'Other',
}

export function SchoolsSection({ metroId, accent }: { metroId: string; accent: string }) {
  const [groups, setGroups] = useState<SchoolGroups | null>(null)

  useEffect(() => {
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroups(null)
    getSchoolsByMetro(metroId)
      .then((rows) => alive && setGroups(groupSchools(rows)))
      .catch(() => alive && setGroups({ total: 0, byType: {}, byHashkafa: {} }))
    return () => {
      alive = false
    }
  }, [metroId])

  if (groups && groups.total === 0) return null // hide until seeded / when none

  const types = groups ? Object.entries(groups.byType).sort((a, b) => b[1] - a[1]) : []
  const hashkafot = groups ? Object.entries(groups.byHashkafa).sort((a, b) => b[1] - a[1]) : []

  return (
    <section>
      <h2 className="font-heading text-xl font-semibold tracking-tight">Jewish schools</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Day schools and yeshivas in the community · source: NCES PSS
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Schools"
          value={groups ? num(groups.total) : '—'}
          accent={accent}
          sub={
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-3.5" /> in this community
            </span>
          }
        />
        {types.slice(0, 3).map(([t, n]) => (
          <StatCard key={t} label={TYPE_LABEL[t] ?? t} value={num(n)} />
        ))}
      </div>
      {hashkafot.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hashkafot.map(([h, n]) => (
            <span
              key={h}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-foreground/10"
              style={{ backgroundColor: `${accent}14` }}
            >
              {h}
              <span className="text-muted-foreground">{n}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
