'use client'
import { useEffect, useState } from 'react'
import { getSchoolsByMetro } from '@/lib/schools/queries'
import { groupSchools, type SchoolGroups } from '@/lib/schools/group'
import { SectionHead } from './section-head'
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

/**
 * Quiet Luxe schools section: a large light-serif accent figure (the total) beside
 * a hairline breakdown by type, with a small-caps hashkafa line. Hides itself when
 * the metro has no seeded schools.
 */
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
  const max = types.length > 0 ? types[0][1] : 1

  return (
    <section className="mt-16 md:mt-24">
      <SectionHead title="Jewish schools" note="Source · NCES PSS" />

      <div className="mt-7 grid items-start gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
        <div>
          <p
            className="font-serif text-[clamp(4rem,10vw,6.5rem)] font-light leading-[0.92] tracking-[-0.03em] tabular-nums"
            style={{ color: accent }}
          >
            {groups ? num(groups.total) : '…'}
          </p>
          <p className="mt-3 max-w-[26ch] text-[15px] leading-relaxed text-foreground/70">
            Jewish {groups?.total === 1 ? 'school' : 'schools'} in the community, from the
            national private-school survey.
          </p>
        </div>

        {types.length > 0 && (
          <div>
            <div className="border-t border-input">
              {types.map(([t, n]) => (
                <div
                  key={t}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3.5"
                >
                  <span className="text-[15px]">{TYPE_LABEL[t] ?? t}</span>
                  <span className="inline-flex items-center gap-3">
                    <span className="text-[15px] font-medium tabular-nums text-foreground/70">
                      {num(n)}
                    </span>
                    <span
                      className="h-[3px] rounded-full opacity-85"
                      style={{ width: `${Math.max(8, Math.round((n / max) * 72))}px`, backgroundColor: accent }}
                      aria-hidden
                    />
                  </span>
                </div>
              ))}
            </div>
            {hashkafot.length > 0 && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pt-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Hashkafa
                </span>
                <span className="text-right text-[0.8rem] font-medium tracking-[0.02em] text-muted-foreground">
                  {hashkafot.map(([h, n]) => `${h} ${n}`).join(' · ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
