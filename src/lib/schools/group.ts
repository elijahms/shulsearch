import type { SchoolDoc } from './queries'

export interface SchoolGroups {
  total: number
  byType: Record<string, number>
  byHashkafa: Record<string, number>
}

/** Pure client-side bucketing of schools by type and hashkafa (subtype, or category if none). */
export function groupSchools(schools: SchoolDoc[]): SchoolGroups {
  const byType: Record<string, number> = {}
  const byHashkafa: Record<string, number> = {}
  for (const s of schools) {
    byType[s.schoolType] = (byType[s.schoolType] ?? 0) + 1
    const key = s.denomination.subtype ?? s.denomination.category
    byHashkafa[key] = (byHashkafa[key] ?? 0) + 1
  }
  return { total: schools.length, byType, byHashkafa }
}
