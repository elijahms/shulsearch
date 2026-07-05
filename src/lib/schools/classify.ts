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
