# Jewish Schools (Plan 09) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed a public `schools` Firestore collection from NCES public-domain data (Jewish day schools), matched into the 24 metros with inferred hashkafa/type/gender, and surface it as a Schools section on each metro page plus an admin curation queue.

**Architecture:** A single authoritative bulk source (NCES PSS 2021-22 public-use CSV) — simpler than the shul pipeline (no OSM/Wikidata/cross-source dedup). Pipeline: download+unzip CSV → filter `ORIENT==18` (Jewish) → assign each school to a metro by point-in-bbox → decode grades → infer schoolType/gender/hashkafa from the name → upsert with a deterministic `nces-<PPIN>` doc id (idempotent re-seeds). UI + admin mirror the existing shul patterns exactly (client web-SDK read on the metro page; admin-guarded Node API routes + a curation surface).

**Tech Stack:** Next.js 16 (App Router, TS strict), Firebase Admin (seed/admin) + web SDK (public read), Zod, geofire-common, tsx. No new npm dependencies.

---

## Ground-truth data findings (verified against the real file)

Downloaded `https://nces.ed.gov/surveys/pss/zip/pss2122_pu_csv.zip` → `pss2122_pu.csv` (459 cols, 22,346 rows) and inspected it directly:

- **Jewish filter:** column `ORIENT == "18"` → **755** Jewish schools nationwide; **442 fall inside our 24 metro bboxes** (the real seed count). Per-metro: Brooklyn 108, Lakewood 83, LA 36, Queens 36, Monsey 33, Miami/Boca 28, Philadelphia 16, Baltimore 14, Teaneck 13, Chicago 12, Boston 9, Houston 8, Silver Spring 6, Las Vegas 6, Passaic 6, St. Louis 5, Cleveland 5, Denver 4, Atlanta 4, Five Towns 3, Memphis 2, Detroit 2, Dallas 2, Phoenix 1.
- **Columns we use:** `PPIN` (stable unique id), `PINST` (name), `PADDRS`/`PCITY`/`PSTABB`/`PZIP` (address), `LATITUDE22`/`LONGITUDE22` (coords — populated for all), `LEVEL` (1=elementary, 2=secondary, 3=combined), `LOGR2022`/`HIGR2022` (grade codes), `NUMSTUDS` (enrollment), `ORIENT`.
- **No gender/coed column exists** (only `MALES`, a student count). Gender must be **name-inferred**, not read from a field. *(This corrects the research, which assumed a `COEDUCAT` field.)*
- **Grade-code decode** (anchor: high schools show `14–17` = grades 9–12): `code >= 6` → grade `code-5` (`6→"1"` … `17→"12"`); `code == 5` → `"KG"`; `code` in `2..4` → `"PK"`; `code == 1` or negative/blank → unknown.
- **Licensing:** public domain (US Government work), no auth, no API key, redistribution permitted. No REST API — bulk file only; send a browser `User-Agent` on the GET.

Representative real in-metro names driving the heuristics: `THE FRISCH SCHOOL`, `THE MORIAH SCHOOL`, `BEN PORAT YOSEF`, `YESHIVAT NOAM SCHOOL` (Modern Orthodox); `BAIS KAILA TORAH PREPARATORY HIGH SCHOOL FOR GIRLS`, `SHULAMITH SCHOOL FOR GIRLS`, `LEV BAIS YAAKOV`, `BNOS BROCHA` (girls Yeshivish); `TALMUD TORAH OF BOBOV`, `YESHIVA KARLIN STOLIN` (Chassidish); `YESHIVAH OF CROWN HEIGHTS`, `BETH RIVKA HIGH SCHOOL`, `DARCHAI MENACHEM` (Chabad); `KRIEGER SCHECHTER DAY SCHOOL` (Conservative); `AHI EZER YESHIVA` (Sephardic/Syrian).

## File structure

**New:**
- `src/lib/schools/schema.ts` — `School` Zod schema + school enums (reuses shul `DenominationSchema` as the hashkafa slot).
- `src/lib/schools/nces.ts` — pure CSV parse + grade decode → `NcesSchoolRecord[]` (the testable core).
- `src/lib/schools/classify.ts` — `inferSchoolClassification(name, {level,gradeHigh})` → `{schoolType, gender, denomination, needsReview}`.
- `src/lib/schools/repo.ts` — admin-SDK `SCHOOLS`, `schoolDocId`, `upsertSchools`, `queryByMetro`, `countSchools`.
- `src/lib/schools/queries.ts` — client web-SDK `getSchoolsByMetro`.
- `src/lib/schools/group.ts` — pure `groupSchools(schools)` for the metro-page breakdown.
- `src/scripts/seed-schools/nces-download.ts` — impure `loadNcesCsv()` (cache + download + unzip).
- `src/scripts/seed-schools/index.ts` — seed orchestrator.
- `src/app/api/admin/schools/needs-review/route.ts`, `src/app/api/admin/schools/[id]/route.ts` — admin API.
- `src/app/(app)/admin/schools/page.tsx`, `src/components/admin/schools-curation-list.tsx`, `src/components/admin/school-fields-editor.tsx` — admin UI.
- `src/components/metro/schools-section.tsx` — the metro-page Schools section.
- Test files colocated: `schema.test.ts`, `nces.test.ts`, `classify.test.ts`, `repo.test.ts`, `group.test.ts`, and `src/lib/metros.test.ts` (extend).

**Modified:**
- `src/lib/metros.ts` — add `metroForPoint(lat,lng)`.
- `src/components/metro/metro-showcase.tsx` — render `<SchoolsSection>`.
- `src/components/admin/admin-shell.tsx` — add `Schools` nav entry.
- `src/components/admin/api.ts` — add `SchoolWithId` type.
- `firestore.rules` — public-read `schools` block.
- `package.json` — `seed:schools` script.

---

### Task 1: `metroForPoint` helper

**Files:**
- Modify: `src/lib/metros.ts`
- Test: `src/lib/metros.test.ts`

- [ ] **Step 1: Write the failing test** — append to `src/lib/metros.test.ts` (create it if absent, importing from `./metros`):

```ts
import { describe, it, expect } from 'vitest'
import { metroForPoint } from './metros'

describe('metroForPoint', () => {
  it('assigns a Teaneck coordinate to teaneck-bergen-nj', () => {
    expect(metroForPoint(40.9057, -74.0201)).toBe('teaneck-bergen-nj')
  })
  it('assigns a Lakewood coordinate to lakewood-nj', () => {
    expect(metroForPoint(40.09, -74.2)).toBe('lakewood-nj')
  })
  it('returns null for a point outside every metro (Birmingham AL)', () => {
    expect(metroForPoint(33.5118, -86.7537)).toBeNull()
  })
})
```

- [ ] **Step 2: Run it, expect fail** — `npx vitest run src/lib/metros.test.ts` → FAIL (`metroForPoint` not exported).

- [ ] **Step 3: Implement** — append to `src/lib/metros.ts`:

```ts
/** The first metro whose bbox contains the point, or null. bbox = [south, west, north, east]. */
export function metroForPoint(lat: number, lng: number): string | null {
  for (const m of METROS) {
    const [s, w, n, e] = m.bbox
    if (lat >= s && lat <= n && lng >= w && lng <= e) return m.id
  }
  return null
}
```

- [ ] **Step 4: Run it, expect pass** — `npx vitest run src/lib/metros.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add src/lib/metros.ts src/lib/metros.test.ts && git commit -m "feat(schools): add metroForPoint bbox assignment"`

---

### Task 2: `School` schema + enums

**Files:**
- Create: `src/lib/schools/schema.ts`
- Test: `src/lib/schools/schema.test.ts`

The hashkafa is the **reused** shul `DenominationSchema` object (so schools + shuls share the denomination filter vocabulary). New school-specific enums cover structure. `id`/`createdAt`/`updatedAt` are repo-managed and NOT in the Zod object (mirrors `ShulSchema`).

- [ ] **Step 1: Write the failing test** — `src/lib/schools/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SchoolSchema } from './schema'

const base = {
  name: 'Yeshivat Noam',
  denomination: { category: 'Orthodox', subtype: 'Modern Orthodox', source: 'name-heuristic', confidence: 'medium' },
  schoolType: 'day-school',
  gender: 'coed',
  metro: 'teaneck-bergen-nj',
  lat: 40.9,
  lng: -74.02,
  geohash: 'dr5xxxxxxx',
  source: 'nces',
}

describe('SchoolSchema', () => {
  it('parses a valid school and defaults status to active', () => {
    const s = SchoolSchema.parse(base)
    expect(s.status).toBe('active')
    expect(s.gender).toBe('coed')
  })
  it('accepts optional grade band + enrollment + ncesId', () => {
    const s = SchoolSchema.parse({ ...base, gradeLow: 'PK', gradeHigh: '8', enrollment: 240, ncesId: 'A9902811' })
    expect(s.gradeHigh).toBe('8')
  })
  it('rejects an invalid schoolType', () => {
    expect(() => SchoolSchema.parse({ ...base, schoolType: 'college' })).toThrow()
  })
  it('rejects a bad grade level', () => {
    expect(() => SchoolSchema.parse({ ...base, gradeLow: '13' })).toThrow()
  })
})
```

- [ ] **Step 2: Run it, expect fail** — `npx vitest run src/lib/schools/schema.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement** — `src/lib/schools/schema.ts`:

```ts
import { z } from 'zod'
import { DenominationSchema } from '../shuls/schema'

/** Institutional character. Distinct from the numeric grade band. */
export const SchoolType = z.enum([
  'preschool',
  'elementary',
  'day-school',
  'high-school',
  'yeshiva-boys',
  'yeshiva-girls',
  'cheder',
  'seminary',
  'other',
])
export const Gender = z.enum(['boys', 'girls', 'coed'])
export const GradeLevel = z.enum(['PK', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
/** Provenance of the stored record. NCES PSS is the durable primary source. */
export const SchoolRecordSource = z.enum(['nces', 'user', 'admin'])
export const SchoolStatus = z.enum(['active', 'archived'])

/**
 * Core School document data (id + createdAt/updatedAt are managed by the repo/Firestore).
 * `denomination` reuses the shul Denomination object as the hashkafa slot so schools and shuls
 * share the denomination filter vocabulary. NCES has no gender/coed field — gender is name-inferred.
 */
export const SchoolSchema = z.object({
  name: z.string().min(1),
  denomination: DenominationSchema,
  schoolType: SchoolType,
  gender: Gender,
  gradeLow: GradeLevel.optional(),
  gradeHigh: GradeLevel.optional(),
  enrollment: z.number().int().nonnegative().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  metro: z.string().min(1),
  state: z.string().optional(),
  zip: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  geohash: z.string().min(1),
  phone: z.string().optional(),
  website: z.string().optional(),
  /** Stable NCES id (PPIN) for reconciliation against future NCES refreshes. */
  ncesId: z.string().optional(),
  source: SchoolRecordSource,
  status: SchoolStatus.default('active'),
  needsReview: z.boolean().optional(),
  /** ISO 8601 timestamp set when an admin verifies the record (clears needsReview). */
  verifiedAt: z.string().optional(),
})

export type School = z.infer<typeof SchoolSchema>
export type SchoolTypeT = z.infer<typeof SchoolType>
export type GenderT = z.infer<typeof Gender>
export type GradeLevelT = z.infer<typeof GradeLevel>
```

- [ ] **Step 4: Run it, expect pass** — `npx vitest run src/lib/schools/schema.test.ts` → PASS. Then `npm run typecheck`.

- [ ] **Step 5: Commit** — `git add src/lib/schools/schema.ts src/lib/schools/schema.test.ts && git commit -m "feat(schools): School Zod schema + enums (reuses shul denomination)"`

---

### Task 3: NCES CSV parse + grade decode

**Files:**
- Create: `src/lib/schools/nces.ts`
- Test: `src/lib/schools/nces.test.ts`

Pure functions only (no I/O): a robust quoted-CSV line parser, the grade-code decoder, and `parseJewishSchools(csvText)` filtering `ORIENT==18` into normalized records. The seed script (Task 7) supplies the text.

- [ ] **Step 1: Write the failing test** — `src/lib/schools/nces.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it, expect fail** — `npx vitest run src/lib/schools/nces.test.ts` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/schools/nces.ts`:

```ts
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
```

- [ ] **Step 4: Run it, expect pass** — `npx vitest run src/lib/schools/nces.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add src/lib/schools/nces.ts src/lib/schools/nces.test.ts && git commit -m "feat(schools): NCES CSV parse + grade-code decode"`

---

### Task 4: School classification (schoolType / gender / hashkafa)

**Files:**
- Create: `src/lib/schools/classify.ts`
- Test: `src/lib/schools/classify.test.ts`

Mirrors `src/lib/shuls/denomination.ts` (ordered name heuristics with a low-confidence Orthodox fallback → `needsReview`). Heuristics are grounded in the real in-metro names.

- [ ] **Step 1: Write the failing test** — `src/lib/schools/classify.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it, expect fail** — `npx vitest run src/lib/schools/classify.test.ts` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/schools/classify.ts`:

```ts
import type { Denomination } from '../shuls/schema'
import type { GenderT, GradeLevelT, SchoolTypeT } from './schema'

export interface SchoolClassification {
  schoolType: SchoolTypeT
  gender: GenderT
  denomination: Denomination
  needsReview: boolean
}

interface NcesHints {
  level?: number
  gradeHigh?: GradeLevelT
}

/** Gender from the name (NCES has no coed field). Default coed. */
function inferGender(n: string): { gender: GenderT; strong: boolean } {
  if (/bais ?ya[ae]kov|beth ?jacob|\bbnos\b|\bbnot\b|\bbas\b|girls|shulamith|bais rochel|beth rivka|bais rivka|bais faiga|ateres|bnos|shevach|prospect park yeshiva.*girls/i.test(n))
    return { gender: 'girls', strong: true }
  if (/mesivta|yeshiva gedola|yeshiva ketana|\bboys\b|talmudical|beis medrash|bais medrash|tomer/i.test(n))
    return { gender: 'boys', strong: true }
  return { gender: 'coed', strong: false }
}

/** Hashkafa (reuses the shul Denomination object). Ordered strongest → weakest. */
function inferHashkafa(n: string): Denomination {
  if (/chabad|lubavitch|oholei torah|beth ?rivka|bais ?rivka|menachem|shluchim|beis chana|crown heights/i.test(n))
    return { category: 'Orthodox', subtype: 'Chabad', source: 'name-heuristic', confidence: 'high' }
  if (/satmar|bobov|belz|\bger\b|vizhnitz|skver|square|puppa|munkacz|klausenburg|spinka|karlin|stolin|bais rochel|talmud torah of/i.test(n))
    return { category: 'Orthodox', subtype: 'Chassidish', source: 'name-heuristic', confidence: 'medium' }
  if (/schechter/i.test(n)) return { category: 'Conservative', source: 'name-heuristic', confidence: 'high' }
  if (/heschel|community day|pluralistic|jewish community/i.test(n))
    return { category: 'Nondenominational', source: 'name-heuristic', confidence: 'medium' }
  if (/sephard|magen david|barkai|ahi ezer|syrian|persian|bukhar|mizrah|edot|shaare/i.test(n))
    return { category: 'Orthodox', subtype: 'Sephardic', source: 'name-heuristic', confidence: 'medium' }
  if (/frisch|moriah|ben porat|yeshivat noam|\bnoam\b|kushner|\bsar\b|ramaz|maimonides|shalhevet|kohelet|yavneh|hillel|beth tfiloh|tabc|golda och|heilicman/i.test(n))
    return { category: 'Orthodox', subtype: 'Modern Orthodox', source: 'name-heuristic', confidence: 'medium' }
  if (/bais ya[ae]kov|beth jacob|bnos|mesivta|yeshiva|yeshivah|talmud torah|talmudical|cheder|toras|darchei|ateres|tiferes|nesivos|kollel|beis medrash|bais medrash/i.test(n))
    return { category: 'Orthodox', subtype: 'Yeshivish', source: 'name-heuristic', confidence: 'medium' }
  return { category: 'Orthodox', source: 'name-heuristic', confidence: 'low' }
}

/** School type from NCES LEVEL + grade band + name overrides. */
function inferType(n: string, gender: GenderT, hints: NcesHints): { type: SchoolTypeT; ambiguous: boolean } {
  if (/seminary|\bsem\b/i.test(n)) return { type: 'seminary', ambiguous: false }
  if (/cheder/i.test(n)) return { type: 'cheder', ambiguous: false }
  if (/preschool|nursery|early childhood|\bgan\b|toddler|\belc\b/i.test(n)) return { type: 'preschool', ambiguous: false }
  const isHigh = hints.level === 2 || hints.gradeHigh === '12' || /high school|mesivta|yeshiva gedola/i.test(n)
  if (isHigh) {
    if (gender === 'boys' || /mesivta|yeshiva gedola/i.test(n)) return { type: 'yeshiva-boys', ambiguous: false }
    if (gender === 'girls') return { type: 'yeshiva-girls', ambiguous: false }
    return { type: 'high-school', ambiguous: false }
  }
  if (hints.level === 1 || hints.level === 3) return { type: 'day-school', ambiguous: false }
  return { type: 'other', ambiguous: true }
}

/** Infer schoolType, gender, and hashkafa from the name + NCES structural hints. */
export function inferSchoolClassification(name: string, hints: NcesHints = {}): SchoolClassification {
  const n = name.toLowerCase()
  const { gender } = inferGender(n)
  const denomination = inferHashkafa(n)
  const { type, ambiguous } = inferType(n, gender, hints)
  const needsReview = denomination.confidence === 'low' || ambiguous
  return { schoolType: type, gender, denomination, needsReview }
}
```

- [ ] **Step 4: Run it, expect pass** — `npx vitest run src/lib/schools/classify.test.ts` → PASS. Then `npm run typecheck`.

- [ ] **Step 5: Commit** — `git add src/lib/schools/classify.ts src/lib/schools/classify.test.ts && git commit -m "feat(schools): name-based schoolType/gender/hashkafa inference"`

---

### Task 5: Schools repo (admin SDK)

**Files:**
- Create: `src/lib/schools/repo.ts`
- Test: `src/lib/schools/repo.test.ts`

Mirrors `src/lib/shuls/repo.ts`. Doc id is `nces-<PPIN>` when `ncesId` is present (stable + unique → idempotent re-seeds), else a geohash+name slug (for future user/admin submissions).

- [ ] **Step 1: Write the failing test** — `src/lib/schools/repo.test.ts` (pure `schoolDocId` only; Firestore paths are covered by the seed run in Task 12):

```ts
import { describe, it, expect } from 'vitest'
import { schoolDocId } from './repo'

describe('schoolDocId', () => {
  it('uses the stable nces- prefix when ncesId is present', () => {
    expect(schoolDocId({ ncesId: 'A9902811', geohash: 'dr5xxxxxxx', name: 'Yeshiva Ner Torah' })).toBe('nces-A9902811')
  })
  it('falls back to geohash + name slug without an ncesId', () => {
    expect(schoolDocId({ geohash: 'dr5regw123', name: 'Yeshiva Ner Torah' })).toMatch(/^dr5regw1-/)
  })
})
```

- [ ] **Step 2: Run it, expect fail** — `npx vitest run src/lib/schools/repo.test.ts` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/schools/repo.ts`:

```ts
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { normalizeName } from '../shuls/normalize'
import type { School } from './schema'

export const SCHOOLS = 'schools'

/** Deterministic doc id: stable NCES id when present, else geohash prefix + name slug. */
export function schoolDocId(school: Pick<School, 'geohash' | 'name'> & { ncesId?: string }): string {
  if (school.ncesId) return `nces-${school.ncesId}`
  const slug = normalizeName(school.name).replace(/\s+/g, '-') || 'school'
  return `${school.geohash.slice(0, 8)}-${slug}`.slice(0, 120)
}

/** Bulk-upsert schools (merge). Deterministic doc id makes re-seeds idempotent. */
export async function upsertSchools(db: Firestore, schools: School[]): Promise<number> {
  if (schools.length === 0) return 0
  const writer = db.bulkWriter()
  let failed = 0
  writer.onWriteError((error) => {
    if (error.failedAttempts < 5) return true
    failed++
    return false
  })
  for (const school of schools) {
    const ref = db.collection(SCHOOLS).doc(schoolDocId(school))
    void writer
      .set(
        ref,
        { ...school, updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      .catch(() => {})
  }
  await writer.close()
  if (failed > 0) throw new Error(`${failed}/${schools.length} writes failed`)
  return schools.length
}

export async function queryByMetro(db: Firestore, metro: string): Promise<School[]> {
  const snap = await db.collection(SCHOOLS).where('metro', '==', metro).get()
  return snap.docs.map((d) => d.data() as School)
}

export async function countSchools(db: Firestore): Promise<number> {
  const snap = await db.collection(SCHOOLS).count().get()
  return snap.data().count
}
```

- [ ] **Step 4: Run it, expect pass** — `npx vitest run src/lib/schools/repo.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add src/lib/schools/repo.ts src/lib/schools/repo.test.ts && git commit -m "feat(schools): admin-SDK repo (upsert/query/count, nces- doc id)"`

---

### Task 6: `firestore.rules` — public-read schools

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add the block** — insert immediately after the `match /shuls/{id} { … }` block:

```
    // Schools are public to read (anonymous searchers); writes only via Admin SDK (seed/admin).
    match /schools/{id} {
      allow read: if true;
      allow write: if false;
    }
```

- [ ] **Step 2: Deploy the rules** — `firebase deploy --only firestore:rules --project shulsearch-app` (expect "Deploy complete"). *(No index change: `queryByMetro` is a single equality filter.)*

- [ ] **Step 3: Commit** — `git add firestore.rules && git commit -m "feat(schools): public-read schools firestore rule"`

---

### Task 7: Seed script

**Files:**
- Create: `src/scripts/seed-schools/nces-download.ts`
- Create: `src/scripts/seed-schools/index.ts`
- Modify: `package.json`

Download is isolated (impure) from the pure parse (Task 3). The CSV is cached to a gitignored `.data/` dir so re-runs skip the 43 MB download.

- [ ] **Step 1: Implement the downloader** — `src/scripts/seed-schools/nces-download.ts`:

```ts
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ZIP_URL = 'https://nces.ed.gov/surveys/pss/zip/pss2122_pu_csv.zip'
const DATA_DIR = join(process.cwd(), '.data')
const CSV_PATH = join(DATA_DIR, 'pss2122_pu.csv')
const ZIP_PATH = join(DATA_DIR, 'pss2122_pu_csv.zip')

/** Return the NCES PSS CSV text, downloading + unzipping into .data/ on first run. */
export async function loadNcesCsv(): Promise<string> {
  if (existsSync(CSV_PATH)) return readFileSync(CSV_PATH, 'utf8')
  mkdirSync(DATA_DIR, { recursive: true })
  console.log('Downloading NCES PSS 2021-22 CSV (~4 MB zip)…')
  const res = await fetch(ZIP_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`NCES download failed: ${res.status}`)
  writeFileSync(ZIP_PATH, Buffer.from(await res.arrayBuffer()))
  execFileSync('unzip', ['-o', ZIP_PATH, '-d', DATA_DIR], { stdio: 'ignore' })
  if (!existsSync(CSV_PATH)) throw new Error('unzip did not produce pss2122_pu.csv')
  return readFileSync(CSV_PATH, 'utf8')
}
```

- [ ] **Step 2: Implement the orchestrator** — `src/scripts/seed-schools/index.ts`:

```ts
/**
 * Seed the `schools` collection from the NCES PSS public-use CSV.
 * Filters Jewish schools (ORIENT==18), assigns each to a metro by lat/lng, infers
 * schoolType/gender/hashkafa from the name, and upserts (idempotent via nces- doc id).
 *
 * Usage:  tsx src/scripts/seed-schools/index.ts [metroId]   (omit to seed all metros)
 * Emulator: set FIRESTORE_EMULATOR_HOST. Real Firestore: needs ADC + GOOGLE_CLOUD_PROJECT.
 */
import type { Firestore } from 'firebase-admin/firestore'
import { getMetro, metroForPoint } from '../../lib/metros'
import { geohashOf } from '../../lib/geo/geo'
import { getSeedDb } from '../seed/firestore'
import { parseJewishSchools } from '../../lib/schools/nces'
import { inferSchoolClassification } from '../../lib/schools/classify'
import { upsertSchools, countSchools } from '../../lib/schools/repo'
import type { School } from '../../lib/schools/schema'
import { loadNcesCsv } from './nces-download'

async function main() {
  const onlyMetro = process.argv[2] // optional metro id filter
  if (onlyMetro && !getMetro(onlyMetro)) throw new Error(`Unknown metro: ${onlyMetro}`)
  const target = process.env.FIRESTORE_EMULATOR_HOST ? 'EMULATOR' : 'REAL Firestore'
  console.log(`Seeding schools → ${target}${onlyMetro ? ` (metro ${onlyMetro})` : ''}`)

  const records = parseJewishSchools(await loadNcesCsv())
  console.log(`Parsed ${records.length} Jewish schools from NCES.`)

  const perMetro: Record<string, number> = {}
  const schools: School[] = []
  for (const r of records) {
    const metro = metroForPoint(r.lat, r.lng)
    if (!metro) continue
    if (onlyMetro && metro !== onlyMetro) continue
    const c = inferSchoolClassification(r.name, { level: r.level, gradeHigh: r.gradeHigh })
    schools.push({
      name: r.name,
      denomination: c.denomination,
      schoolType: c.schoolType,
      gender: c.gender,
      gradeLow: r.gradeLow,
      gradeHigh: r.gradeHigh,
      enrollment: r.enrollment,
      address: r.address,
      city: r.city,
      metro,
      state: r.state,
      zip: r.zip,
      lat: r.lat,
      lng: r.lng,
      geohash: geohashOf(r.lat, r.lng),
      ncesId: r.ncesId,
      source: 'nces',
      status: 'active',
      ...(c.needsReview ? { needsReview: true } : {}),
    })
    perMetro[metro] = (perMetro[metro] ?? 0) + 1
  }

  const db: Firestore = getSeedDb()
  const written = await upsertSchools(db, schools)
  console.log(`Upserted ${written} schools.`)
  console.log('Per metro:', Object.entries(perMetro).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '))
  const flagged = schools.filter((s) => s.needsReview).length
  console.log(`needsReview: ${flagged}/${schools.length} (${Math.round((flagged / schools.length) * 100)}%)`)
  console.log(`Total schools in Firestore: ${await countSchools(db)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 3: Add the npm script + gitignore** — in `package.json` `scripts`, after `"seed"`, add:

```json
    "seed:schools": "tsx src/scripts/seed-schools/index.ts"
```

Add `.data/` to `.gitignore` (do not commit the 43 MB CSV).

- [ ] **Step 4: Dry-run against the emulator** — with Java on PATH:

```
PATH="/opt/homebrew/opt/openjdk/bin:$PATH" firebase emulators:exec --only firestore --project demo-shulsearch "npm run seed:schools -- teaneck-bergen-nj"
```

Expected: parses ~755, filters to ~13 Teaneck schools, logs a needsReview %, "Total schools in Firestore: 13".

- [ ] **Step 5: Commit** — `git add src/scripts/seed-schools package.json .gitignore && git commit -m "feat(schools): NCES seed pipeline + seed:schools script"`

---

### Task 8: Client query + grouping helper

**Files:**
- Create: `src/lib/schools/queries.ts`
- Create: `src/lib/schools/group.ts`
- Test: `src/lib/schools/group.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/schools/group.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it, expect fail** — `npx vitest run src/lib/schools/group.test.ts` → FAIL.

- [ ] **Step 3: Implement both files** — `src/lib/schools/queries.ts`:

```ts
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseApp } from '../firebase/client'
import type { School } from './schema'

export type SchoolDoc = School & { id: string }

/** Fetch all schools in a metro from the client (public read). */
export async function getSchoolsByMetro(metro: string): Promise<SchoolDoc[]> {
  const db = getFirestore(getFirebaseApp())
  const snap = await getDocs(query(collection(db, 'schools'), where('metro', '==', metro)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as School) }))
}
```

`src/lib/schools/group.ts`:

```ts
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
```

- [ ] **Step 4: Run it, expect pass** — `npx vitest run src/lib/schools/group.test.ts` → PASS. Then `npm run typecheck`.

- [ ] **Step 5: Commit** — `git add src/lib/schools/queries.ts src/lib/schools/group.ts src/lib/schools/group.test.ts && git commit -m "feat(schools): client query + grouping helper"`

---

### Task 9: Schools section on the metro page

**Files:**
- Create: `src/components/metro/schools-section.tsx`
- Modify: `src/components/metro/metro-showcase.tsx`

Renders OUTSIDE the `facts` ternary (schools exist even for metros without curated facts). Fetches client-side via a `useEffect` mirroring the existing `shulCount` effect, and uses the existing `StatCard`.

- [ ] **Step 1: Implement the section** — `src/components/metro/schools-section.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire it into the showcase** — in `src/components/metro/metro-showcase.tsx`, add the import near the other `./` imports:

```tsx
import { SchoolsSection } from './schools-section'
```

Then render it just after the `facts ? (…) : (…)` block closes, still inside the `max-w-5xl` container `<div>` (so it shows regardless of curated facts). Locate the closing of the facts conditional and insert:

```tsx
        <div className="mt-12">
          <SchoolsSection metroId={id} accent={theme.accent} />
        </div>
```

- [ ] **Step 3: Verify** — `npm run typecheck` and `npm run build` both pass. With the dev server up, `/metro/teaneck-bergen-nj` renders a "Jewish schools" section (populated after Task 12 seeds; the section self-hides while empty).

- [ ] **Step 4: Commit** — `git add src/components/metro/schools-section.tsx src/components/metro/metro-showcase.tsx && git commit -m "feat(schools): Schools section on the metro page"`

---

### Task 10: Admin API (needs-review + curate)

**Files:**
- Create: `src/app/api/admin/schools/needs-review/route.ts`
- Create: `src/app/api/admin/schools/[id]/route.ts`

Mirrors the shul admin routes exactly (guarded, Node runtime, `serialize()` timestamps). The curate route accepts the school-specific fields.

- [ ] **Step 1: needs-review route** — `src/app/api/admin/schools/needs-review/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { serialize } from '../../_lib/serialize'

export const runtime = 'nodejs'

/** GET /api/admin/schools/needs-review — schools flagged needsReview==true (admin only). */
export async function GET(req: Request) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response
  const snap = await getAdminDb().collection('schools').where('needsReview', '==', true).limit(100).get()
  return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) })))
}
```

- [ ] **Step 2: curate route** — `src/app/api/admin/schools/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'
import { adminGuard } from '@/lib/auth/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { DenominationCategory, DenominationSubtype, type Denomination } from '@/lib/shuls/schema'
import { SchoolType, Gender } from '@/lib/schools/schema'

export const runtime = 'nodejs'

const Body = z.object({
  schoolType: SchoolType,
  gender: Gender,
  denominationCategory: DenominationCategory,
  denominationSubtype: DenominationSubtype.optional(),
})

/** POST /api/admin/schools/[id] — set curated fields, clear needsReview, stamp verifiedAt. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminGuard(req)
  if ('response' in guard) return guard.response
  const { id } = await params

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request', issues: parsed.error.issues }, { status: 400 })
  }
  const db = getAdminDb()
  const ref = db.collection('schools').doc(id)
  if (!(await ref.get()).exists) return NextResponse.json({ error: 'school not found' }, { status: 404 })

  const denomination: Denomination = {
    category: parsed.data.denominationCategory,
    source: 'admin',
    confidence: 'high',
  }
  if (parsed.data.denominationSubtype) denomination.subtype = parsed.data.denominationSubtype

  await ref.update({
    schoolType: parsed.data.schoolType,
    gender: parsed.data.gender,
    denomination,
    needsReview: false,
    verifiedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Verify** — `npm run typecheck` passes.

- [ ] **Step 4: Commit** — `git add src/app/api/admin/schools && git commit -m "feat(schools): admin needs-review + curate API routes"`

---

### Task 11: Admin curation UI + nav

**Files:**
- Create: `src/app/(app)/admin/schools/page.tsx`
- Create: `src/components/admin/school-fields-editor.tsx`
- Create: `src/components/admin/schools-curation-list.tsx`
- Modify: `src/components/admin/admin-shell.tsx`, `src/components/admin/api.ts`

- [ ] **Step 1: Add the client type** — in `src/components/admin/api.ts`, add near `ShulWithId`:

```ts
import type { School } from '@/lib/schools/schema'
export type SchoolWithId = School & { id: string }
```

- [ ] **Step 2: Fields editor** — `src/components/admin/school-fields-editor.tsx`:

```tsx
'use client'
import { DenominationCategory, DenominationSubtype, type DenominationCategoryT, type DenominationSubtypeT } from '@/lib/shuls/schema'
import { SchoolType, Gender, type SchoolTypeT, type GenderT } from '@/lib/schools/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NO_SUBTYPE = '__none__'

export interface SchoolFields {
  schoolType?: SchoolTypeT
  gender?: GenderT
  category?: DenominationCategoryT
  subtype?: DenominationSubtypeT
}

export function SchoolFieldsEditor({
  value,
  onChange,
  disabled,
}: {
  value: SchoolFields
  onChange: (v: SchoolFields) => void
  disabled?: boolean
}) {
  const set = (patch: Partial<SchoolFields>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={value.schoolType ?? ''} onValueChange={(v) => set({ schoolType: v as SchoolTypeT })} disabled={disabled}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>{SchoolType.options.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={value.gender ?? ''} onValueChange={(v) => set({ gender: v as GenderT })} disabled={disabled}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Gender" /></SelectTrigger>
        <SelectContent>{Gender.options.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={value.category ?? ''} onValueChange={(v) => set({ category: v as DenominationCategoryT })} disabled={disabled}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>{DenominationCategory.options.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={value.subtype ?? NO_SUBTYPE} onValueChange={(v) => set({ subtype: v === NO_SUBTYPE ? undefined : (v as DenominationSubtypeT) })} disabled={disabled}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Hashkafa (optional)" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SUBTYPE}>No hashkafa</SelectItem>
          {DenominationSubtype.options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
```

- [ ] **Step 3: Curation list** — `src/components/admin/schools-curation-list.tsx` (mirror of `curation-list.tsx`):

```tsx
'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminFetch, type SchoolWithId } from './api'
import { SchoolFieldsEditor, type SchoolFields } from './school-fields-editor'

function Row({ school, onDone }: { school: SchoolWithId; onDone: (id: string) => void }) {
  const [fields, setFields] = useState<SchoolFields>({
    schoolType: school.schoolType,
    gender: school.gender,
    category: school.denomination?.category,
    subtype: school.denomination?.subtype,
  })
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!fields.schoolType || !fields.gender || !fields.category) {
      toast.error('Choose type, gender, and category')
      return
    }
    setBusy(true)
    try {
      const res = await adminFetch(`/api/admin/schools/${school.id}`, {
        method: 'POST',
        body: JSON.stringify({
          schoolType: fields.schoolType,
          gender: fields.gender,
          denominationCategory: fields.category,
          denominationSubtype: fields.subtype,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      toast.success(`Saved ${school.name}`)
      onDone(school.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{school.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {[school.address, school.city, school.state].filter(Boolean).join(', ') || school.metro}
          {' · '}current: {school.schoolType} · {school.gender} · {school.denomination?.subtype ?? school.denomination?.category ?? 'unknown'}
          {school.denomination?.confidence ? ` · ${school.denomination.confidence} confidence` : ''}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <SchoolFieldsEditor value={fields} onChange={setFields} disabled={busy} />
        <Button size="sm" disabled={busy} onClick={() => void save()}>
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          Save &amp; mark reviewed
        </Button>
      </CardContent>
    </Card>
  )
}

export function SchoolsCurationList() {
  const [items, setItems] = useState<SchoolWithId[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await adminFetch('/api/admin/schools/needs-review')
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      setItems((await res.json()) as SchoolWithId[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schools')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const onDone = useCallback((id: string) => {
    setItems((prev) => (prev ? prev.filter((s) => s.id !== id) : prev))
  }, [])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">School curation</h2>
        <p className="text-sm text-muted-foreground">
          Schools flagged for review. Confirm type, gender, and hashkafa to clear the flag.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : items === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <CheckCircle2 className="size-6" />
          <p className="text-sm">Nothing needs review.</p>
        </div>
      ) : (
        items.map((s) => <Row key={s.id} school={s} onDone={onDone} />)
      )}
    </div>
  )
}
```

- [ ] **Step 4: Page + nav** — `src/app/(app)/admin/schools/page.tsx`:

```tsx
import { SchoolsCurationList } from '@/components/admin/schools-curation-list'

export default function AdminSchoolsPage() {
  return <SchoolsCurationList />
}
```

In `src/components/admin/admin-shell.tsx`, add to the `NAV` array after Curation:

```ts
  { href: '/admin/schools', label: 'Schools' },
```

- [ ] **Step 5: Verify** — `npm run typecheck` + `npm run build` pass. Signed in as admin, `/admin/schools` loads the queue (empty until Task 12 seeds).

- [ ] **Step 6: Commit** — `git add src/app/\(app\)/admin/schools src/components/admin && git commit -m "feat(schools): admin schools curation surface + nav"`

---

### Task 12: Seed production + full verify + deploy

**Files:** none (operational)

- [ ] **Step 1: Run the full unit suite + typecheck** — `npm run typecheck && npx vitest run` (all green, including the new school tests).

- [ ] **Step 2: Seed real Firestore** — with ADC for the personal account:

```
gcloud auth application-default login   # if needed, account elijahmsilverman@gmail.com
GOOGLE_CLOUD_PROJECT=shulsearch-app npm run seed:schools
```

Expected: `Upserted ~442 schools`, per-metro counts matching the findings (Brooklyn ~108, Lakewood ~83…), a needsReview %, and a Firestore total ≈ 442.

- [ ] **Step 3: Re-run to prove idempotency** — run Step 2 again; the total stays ≈ 442 (deterministic `nces-<PPIN>` ids upsert, not duplicate).

- [ ] **Step 4: Verify live** — the dev server (localhost:3100) `/metro/lakewood-nj` shows the Jewish schools section with a count and type/hashkafa breakdown; `/admin/schools` lists the flagged schools.

- [ ] **Step 5: Deploy** — confirm `gh` is `elijahms` (`gh auth switch --user elijahms`), then `git push origin main` (App Hosting auto-deploys). The `firestore:rules` were deployed in Task 6.

- [ ] **Step 6: Tag** — `git tag v0.7.0-schools`.

---

## Out of scope (follow-ups)

- School pins on the search-results map (near listings) — a nice enhancement; defer to keep this plan shippable.
- Public "add/dispute a school" submissions (mirror the shul `submissions` flow) — only needed if crowdsourcing schools; seed + admin-write suffices for launch.
- Human-readable grade-range labels beyond PK/KG/1–12, tuition (Plan 11), and NCES refresh reconciliation.
