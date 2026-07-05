import { describe, it, expect } from 'vitest'
import { METROS } from '@/lib/metros'
import { METRO_FACTS, getMetroFacts } from './facts'

describe('METRO_FACTS', () => {
  it('has an entry for every metro in METROS', () => {
    for (const m of METROS) {
      expect(METRO_FACTS[m.id], `missing facts for ${m.id}`).toBeDefined()
    }
  })

  it('has no entries for ids that are not real metros', () => {
    const ids = new Set(METROS.map((m) => m.id))
    for (const id of Object.keys(METRO_FACTS)) {
      expect(ids.has(id), `unknown metro id in facts: ${id}`).toBe(true)
    }
  })

  it('carries plausible, positive numbers stamped asOf 2025', () => {
    for (const m of METROS) {
      const f = METRO_FACTS[m.id]!
      expect(f.jewishPopulation).toBeGreaterThan(0)
      expect(f.medianHomeValue).toBeGreaterThan(0)
      expect(f.medianRent).toBeGreaterThan(0)
      expect(f.effectivePropertyTaxRate).toBeGreaterThan(0)
      expect(f.effectivePropertyTaxRate).toBeLessThan(0.1)
      expect(f.stateIncomeTaxTopRate).toBeGreaterThanOrEqual(0)
      expect(f.costOfLivingIndex).toBeGreaterThan(50)
      expect(f.asOf).toBe(2025)
    }
  })

  it('getMetroFacts returns undefined for an unknown id', () => {
    expect(getMetroFacts('nowhere-zz')).toBeUndefined()
  })
})
