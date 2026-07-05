import { describe, it, expect } from 'vitest'
import { decodeGrade, parseJewishSchools } from './nces'

describe('decodeGrade', () => {
  it('maps codes 6..17 to grades 1..12', () => {
    expect(decodeGrade(6)).toBe('1')
    expect(decodeGrade(13)).toBe('8')
    expect(decodeGrade(14)).toBe('9')
    expect(decodeGrade(17)).toBe('12')
  })
  it('maps 5 to KG and 2..4 to PK, and unknowns to undefined', () => {
    expect(decodeGrade(5)).toBe('KG')
    expect(decodeGrade(4)).toBe('PK')
    expect(decodeGrade(2)).toBe('PK')
    expect(decodeGrade(1)).toBeUndefined()
    expect(decodeGrade(-1)).toBeUndefined()
  })
})

describe('parseJewishSchools', () => {
  // Minimal CSV: header with the columns we read, one Jewish row (ORIENT=18) + one non-Jewish (ORIENT=1).
  const csv = [
    'PPIN,PINST,PADDRS,PCITY,PSTABB,PZIP,LATITUDE22,LONGITUDE22,LOGR2022,HIGR2022,LEVEL,NUMSTUDS,ORIENT',
    'A1,"YESHIVA NER TORAH, INC","123 Main St",BALTIMORE,MD,21208,39.38,-76.72,2,13,1,240,18',
    'B2,ST MARY SCHOOL,456 Oak Ave,BALTIMORE,MD,21208,39.30,-76.60,5,17,3,500,1',
  ].join('\n')

  it('keeps only ORIENT==18 rows and maps fields', () => {
    const rows = parseJewishSchools(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      ncesId: 'A1',
      name: 'YESHIVA NER TORAH, INC',
      address: '123 Main St',
      city: 'BALTIMORE',
      state: 'MD',
      lat: 39.38,
      lng: -76.72,
      level: 1,
      gradeLow: 'PK',
      gradeHigh: '8',
      enrollment: 240,
    })
  })

  it('drops rows missing name or coordinates', () => {
    const bad = [
      'PPIN,PINST,LATITUDE22,LONGITUDE22,ORIENT',
      'C3,,40.1,-74.2,18',
      'C4,NO COORDS,,,18',
    ].join('\n')
    expect(parseJewishSchools(bad)).toHaveLength(0)
  })
})
