import { describe, it, expect } from 'vitest'
import { groupSchools } from './group'
import type { SchoolDoc } from './queries'

const mk = (over: Partial<SchoolDoc>): SchoolDoc =>
  ({ id: 'x', name: 'S', metro: 'm', lat: 0, lng: 0, geohash: 'g', source: 'nces', status: 'active',
     schoolType: 'day-school', gender: 'coed',
     denomination: { category: 'Orthodox', source: 'name-heuristic', confidence: 'medium' }, ...over }) as SchoolDoc

describe('groupSchools', () => {
  it('counts and buckets by type and hashkafa', () => {
    const g = groupSchools([
      mk({ id: 'a', schoolType: 'yeshiva-boys', denomination: { category: 'Orthodox', subtype: 'Yeshivish', source: 'name-heuristic', confidence: 'high' } }),
      mk({ id: 'b', schoolType: 'day-school', denomination: { category: 'Orthodox', subtype: 'Modern Orthodox', source: 'name-heuristic', confidence: 'medium' } }),
      mk({ id: 'c', schoolType: 'day-school', denomination: { category: 'Orthodox', subtype: 'Modern Orthodox', source: 'name-heuristic', confidence: 'medium' } }),
    ])
    expect(g.total).toBe(3)
    expect(g.byType['day-school']).toBe(2)
    expect(g.byHashkafa['Modern Orthodox']).toBe(2)
    expect(g.byHashkafa['Yeshivish']).toBe(1)
  })
})
