import { describe, it, expect } from 'vitest'
import { inferSchoolClassification } from './classify'

describe('inferSchoolClassification', () => {
  it('detects girls Yeshivish (Bais Yaakov)', () => {
    const c = inferSchoolClassification('LEV BAIS YAAKOV', { level: 1 })
    expect(c.gender).toBe('girls')
    expect(c.denomination.subtype).toBe('Yeshivish')
  })
  it('detects Chabad', () => {
    expect(inferSchoolClassification('DARCHAI MENACHEM', {}).denomination.subtype).toBe('Chabad')
    expect(inferSchoolClassification('BETH RIVKA HIGH SCHOOL', {}).denomination.subtype).toBe('Chabad')
  })
  it('detects Chassidish (Bobov)', () => {
    expect(inferSchoolClassification('TALMUD TORAH OF BOBOV', {}).denomination.subtype).toBe('Chassidish')
  })
  it('detects Modern Orthodox (Frisch / Ben Porat Yosef)', () => {
    expect(inferSchoolClassification('THE FRISCH SCHOOL', { level: 2 }).denomination.subtype).toBe('Modern Orthodox')
    expect(inferSchoolClassification('BEN PORAT YOSEF', { level: 1 }).denomination.subtype).toBe('Modern Orthodox')
  })
  it('detects Conservative (Schechter)', () => {
    expect(inferSchoolClassification('KRIEGER SCHECHTER DAY SCHOOL', {}).denomination.category).toBe('Conservative')
  })
  it('classifies a boys mesivta high school as yeshiva-boys', () => {
    const c = inferSchoolClassification('MESIVTA OF LONG BEACH', { level: 2, gradeHigh: '12' })
    expect(c.gender).toBe('boys')
    expect(c.schoolType).toBe('yeshiva-boys')
  })
  it('flags an ambiguous name for review with a low-confidence fallback', () => {
    const c = inferSchoolClassification('HEBREW ACADEMY', {})
    expect(c.needsReview).toBe(true)
    expect(c.denomination.confidence).toBe('low')
  })
})
