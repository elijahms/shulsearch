import type { GradeLevelT } from './schema'

/** Decode an NCES LOGR2022/HIGR2022 grade code. Anchor: 14..17 = grades 9..12, so grade = code-5. */
export function decodeGrade(code: number): GradeLevelT | undefined {
  if (!Number.isFinite(code)) return undefined
  if (code >= 6 && code <= 17) return String(code - 5) as GradeLevelT
  if (code === 5) return 'KG'
  if (code >= 2 && code <= 4) return 'PK'
  return undefined // 1 = ungraded, negatives = suppressed/NA
}

export interface NcesSchoolRecord {
  ncesId: string
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  lat: number
  lng: number
  level?: number
  gradeLow?: GradeLevelT
  gradeHigh?: GradeLevelT
  enrollment?: number
}

/** Parse one CSV line, honoring double-quoted fields and "" escaped quotes. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        q = !q
      }
    } else if (c === ',' && !q) {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

const numOrUndef = (s: string | undefined): number | undefined => {
  if (s == null || s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

/** Filter the NCES PSS public-use CSV to Jewish schools (ORIENT==18) and map to normalized records. */
export function parseJewishSchools(csvText: string): NcesSchoolRecord[] {
  const lines = csvText.split(/\r?\n/)
  if (lines.length < 2) return []
  const header = parseCsvLine(lines[0])
  const col = (name: string) => header.indexOf(name)
  const iId = col('PPIN')
  const iName = col('PINST')
  const iAddr = col('PADDRS')
  const iCity = col('PCITY')
  const iState = col('PSTABB')
  const iZip = col('PZIP')
  const iLat = col('LATITUDE22')
  const iLng = col('LONGITUDE22')
  const iLo = col('LOGR2022')
  const iHi = col('HIGR2022')
  const iLevel = col('LEVEL')
  const iNum = col('NUMSTUDS')
  const iOrient = col('ORIENT')

  const out: NcesSchoolRecord[] = []
  for (let r = 1; r < lines.length; r++) {
    if (!lines[r]) continue
    const f = parseCsvLine(lines[r])
    if (f[iOrient] !== '18') continue
    const name = (f[iName] ?? '').trim()
    const lat = numOrUndef(f[iLat])
    const lng = numOrUndef(f[iLng])
    if (!name || lat == null || lng == null) continue
    const loCode = numOrUndef(f[iLo])
    const hiCode = numOrUndef(f[iHi])
    out.push({
      ncesId: (f[iId] ?? '').trim(),
      name,
      address: f[iAddr]?.trim() || undefined,
      city: f[iCity]?.trim() || undefined,
      state: f[iState]?.trim() || undefined,
      zip: f[iZip]?.trim() || undefined,
      lat,
      lng,
      level: numOrUndef(f[iLevel]),
      gradeLow: loCode != null ? decodeGrade(loCode) : undefined,
      gradeHigh: hiCode != null ? decodeGrade(hiCode) : undefined,
      enrollment: (() => {
        const n = numOrUndef(f[iNum])
        return n != null && n >= 0 ? n : undefined
      })(),
    })
  }
  return out
}
