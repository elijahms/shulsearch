/**
 * Curated, approximate ~2025 facts for each launch metro — cost of living, taxes,
 * and Jewish-community context. Client-safe (pure data, no server imports).
 *
 * Numbers are publicly-known ballpark figures for the *community area* (not always
 * the whole legal city/county), assembled from general knowledge for illustration.
 * They are intentionally approximate — treat them as "good enough to compare metros",
 * not as authoritative citations. Every record is stamped `asOf: 2025`.
 */
import { METROS } from '@/lib/metros'

export interface MetroFacts {
  /** Approximate Jewish population of the community/metro area. */
  jewishPopulation: number
  /** Attribution for the population figure. */
  jewishPopSource: string

  /** Zillow-ZHVI-ballpark median home value (USD) for the community area. */
  medianHomeValue: number
  /** Typical asking rent (USD / month) for the community area. */
  medianRent: number

  /** Effective annual property-tax rate as a decimal of home value (e.g. 0.0224 = 2.24%). */
  effectivePropertyTaxRate: number
  /** One-line context on how property tax works locally. */
  typicalPropertyTaxNote: string

  /** State income tax top marginal rate as a decimal; 0 for no-income-tax states (TX/FL/NV/TN). */
  stateIncomeTaxTopRate: number
  /** Combined state + local sales tax as a decimal (approx). */
  salesTaxRate: number
  /** Optional note about local (city/county) income or wage taxes, e.g. NYC. */
  localIncomeTaxNote?: string

  /** Cost-of-living index, US average = 100. */
  costOfLivingIndex: number

  /** 1–2 sentences on the community's character. */
  blurb: string

  /** Vintage of these figures. */
  asOf: number
  /** General disclaimer / provenance note. */
  sourceNote: string
}

const ASOF = 2025

const SOURCE_NOTE =
  'Approximate ~2025 figures curated for illustration from publicly-known sources ' +
  '(Berman Jewish DataBank / AJYB population estimates, Zillow-ballpark home values, ' +
  'Tax Foundation / state revenue effective rates). Compare directionally, not to the dollar.'

/** Per-metro data without the shared `asOf` / `sourceNote` stamp (added below). */
type FactSeed = Omit<MetroFacts, 'asOf' | 'sourceNote'>

const SEEDS: Record<string, FactSeed> = {
  'brooklyn-ny': {
    jewishPopulation: 600000,
    jewishPopSource: 'UJA-Federation of NY community study est.',
    medianHomeValue: 950000,
    medianRent: 3200,
    effectivePropertyTaxRate: 0.009,
    typicalPropertyTaxNote:
      'NYC caps assessment growth on 1–3 family homes, so effective rates run well below the rest of New York State.',
    stateIncomeTaxTopRate: 0.109,
    salesTaxRate: 0.08875,
    localIncomeTaxNote: 'NYC adds a resident income tax up to ~3.9%.',
    costOfLivingIndex: 154,
    blurb:
      'The largest Jewish community in the United States, from Hasidic Boro Park and Williamsburg to the yeshivish and modern-Orthodox neighborhoods of Flatbush and Midwood.',
  },
  'queens-ny': {
    jewishPopulation: 200000,
    jewishPopSource: 'UJA-Federation of NY community study est.',
    medianHomeValue: 720000,
    medianRent: 2900,
    effectivePropertyTaxRate: 0.009,
    typicalPropertyTaxNote:
      'As in the rest of NYC, assessment caps on small homes keep effective property-tax rates comparatively low.',
    stateIncomeTaxTopRate: 0.109,
    salesTaxRate: 0.08875,
    localIncomeTaxNote: 'NYC adds a resident income tax up to ~3.9%.',
    costOfLivingIndex: 138,
    blurb:
      'Tight-knit enclaves like Kew Gardens Hills and Far Rockaway anchor a diverse Orthodox presence with easy access to Manhattan.',
  },
  'five-towns-ny': {
    jewishPopulation: 40000,
    jewishPopSource: 'Berman Jewish DataBank / community est.',
    medianHomeValue: 850000,
    medianRent: 3000,
    effectivePropertyTaxRate: 0.021,
    typicalPropertyTaxNote:
      'Nassau County property taxes are among the highest in the nation — a typical home bill runs well over $18k/yr.',
    stateIncomeTaxTopRate: 0.109,
    salesTaxRate: 0.08625,
    costOfLivingIndex: 148,
    blurb:
      'Lawrence, Cedarhurst, Woodmere and Hewlett form a leafy, affluent suburban Orthodox community just over the Queens line.',
  },
  'teaneck-bergen-nj': {
    jewishPopulation: 100000,
    jewishPopSource: 'Jewish Federation of Northern NJ est.',
    medianHomeValue: 675000,
    medianRent: 2600,
    effectivePropertyTaxRate: 0.024,
    typicalPropertyTaxNote:
      'New Jersey has the highest property taxes in the U.S.; a typical Teaneck home runs $15k–$20k/yr.',
    stateIncomeTaxTopRate: 0.1075,
    salesTaxRate: 0.06625,
    costOfLivingIndex: 135,
    blurb:
      'The flagship modern-Orthodox suburb, Teaneck and its Bergen County neighbors pack dozens of shuls and day schools into a commuter-friendly grid.',
  },
  'lakewood-nj': {
    jewishPopulation: 110000,
    jewishPopSource: 'Community / township growth est.',
    medianHomeValue: 550000,
    medianRent: 2400,
    effectivePropertyTaxRate: 0.021,
    typicalPropertyTaxNote:
      'Ocean County rates are high and school costs pressure the levy; new construction has kept assessments climbing.',
    stateIncomeTaxTopRate: 0.1075,
    salesTaxRate: 0.06625,
    costOfLivingIndex: 112,
    blurb:
      'Home of Beth Medrash Govoha and one of the fastest-growing communities in America, Lakewood is a booming yeshiva town with new developments in every direction.',
  },
  'passaic-nj': {
    jewishPopulation: 18000,
    jewishPopSource: 'Community est.',
    medianHomeValue: 500000,
    medianRent: 2200,
    effectivePropertyTaxRate: 0.026,
    typicalPropertyTaxNote:
      'Passaic County carries some of NJ’s steepest effective rates, though home prices sit below Bergen.',
    stateIncomeTaxTopRate: 0.1075,
    salesTaxRate: 0.06625,
    costOfLivingIndex: 120,
    blurb:
      'A dense, walkable yeshivish community straddling Passaic and Clifton, known for affordability relative to its Bergen County neighbors.',
  },
  'monsey-ny': {
    jewishPopulation: 120000,
    jewishPopSource: 'Rockland County community est.',
    medianHomeValue: 600000,
    medianRent: 2500,
    effectivePropertyTaxRate: 0.025,
    typicalPropertyTaxNote:
      'Rockland County property taxes are very high, driven largely by school-district levies.',
    stateIncomeTaxTopRate: 0.109,
    salesTaxRate: 0.08375,
    costOfLivingIndex: 128,
    blurb:
      'A sprawling, heavily Hasidic and yeshivish community — Monsey, New Square and Kaser — set in the wooded suburbs north of the city.',
  },
  'baltimore-md': {
    jewishPopulation: 93000,
    jewishPopSource: 'Associated: Jewish Federation of Baltimore study',
    medianHomeValue: 300000,
    medianRent: 1700,
    effectivePropertyTaxRate: 0.013,
    typicalPropertyTaxNote:
      'Baltimore County rates are moderate; Baltimore City runs higher. Homestead caps limit annual assessment jumps.',
    stateIncomeTaxTopRate: 0.0575,
    salesTaxRate: 0.06,
    localIncomeTaxNote: 'Maryland counties add a local income tax (~2.8–3.2%).',
    costOfLivingIndex: 104,
    blurb:
      'A famously affordable, deeply-rooted community centered on Pikesville and Park Heights, with a strong out-of-town, kollel-rich character.',
  },
  'los-angeles-ca': {
    jewishPopulation: 560000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 950000,
    medianRent: 2900,
    effectivePropertyTaxRate: 0.0075,
    typicalPropertyTaxNote:
      'California’s Prop 13 caps assessed value growth at ~2%/yr, so long-time owners pay far below the ~1.1% headline rate.',
    stateIncomeTaxTopRate: 0.133,
    salesTaxRate: 0.095,
    costOfLivingIndex: 150,
    blurb:
      'The nation’s second-largest Jewish community, spanning the shuls of Pico-Robertson, Hancock Park, La Brea and the Valley under year-round sun.',
  },
  'miami-boca-fl': {
    jewishPopulation: 500000,
    jewishPopSource: 'Berman Jewish DataBank (South FL) est.',
    medianHomeValue: 550000,
    medianRent: 2700,
    effectivePropertyTaxRate: 0.011,
    typicalPropertyTaxNote:
      'Florida’s Save Our Homes homestead cap limits assessment growth to 3%/yr for primary residences.',
    stateIncomeTaxTopRate: 0,
    salesTaxRate: 0.07,
    costOfLivingIndex: 122,
    blurb:
      'From Miami Beach to Hollywood to Boca Raton, a fast-growing, no-income-tax haven drawing families from the Northeast to the water’s edge.',
  },
  'chicago-il': {
    jewishPopulation: 320000,
    jewishPopSource: 'JUF/Jewish Federation of Chicago study est.',
    medianHomeValue: 350000,
    medianRent: 1900,
    effectivePropertyTaxRate: 0.021,
    typicalPropertyTaxNote:
      'Cook County property taxes are high and complex, with triennial reassessments and steep school levies.',
    stateIncomeTaxTopRate: 0.0495,
    salesTaxRate: 0.1025,
    costOfLivingIndex: 114,
    blurb:
      'West Rogers Park and Skokie anchor a classic Midwestern Orthodox community with a full slate of institutions and mild home prices.',
  },
  'dallas-tx': {
    jewishPopulation: 75000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 400000,
    medianRent: 1800,
    effectivePropertyTaxRate: 0.019,
    typicalPropertyTaxNote:
      'Texas has no income tax, so property taxes carry the load — effective rates run near 2% with no state offset.',
    stateIncomeTaxTopRate: 0,
    salesTaxRate: 0.0825,
    costOfLivingIndex: 103,
    blurb:
      'A growing, business-friendly community in North Dallas with new eruvin and schools drawing young families priced out of the coasts.',
  },
  'houston-tx': {
    jewishPopulation: 51000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 350000,
    medianRent: 1600,
    effectivePropertyTaxRate: 0.021,
    typicalPropertyTaxNote:
      'No state income tax means Texas leans on property tax; Harris County effective rates hover around 2%.',
    stateIncomeTaxTopRate: 0,
    salesTaxRate: 0.0825,
    costOfLivingIndex: 100,
    blurb:
      'Meyerland and the Fondren Southwest corridor host a warm, affordable community with sprawling homes and no state income tax.',
  },
  'atlanta-ga': {
    jewishPopulation: 120000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 450000,
    medianRent: 1900,
    effectivePropertyTaxRate: 0.01,
    typicalPropertyTaxNote:
      'Georgia’s effective property-tax rate is moderate, with homestead exemptions in Fulton and DeKalb.',
    stateIncomeTaxTopRate: 0.0539,
    salesTaxRate: 0.089,
    costOfLivingIndex: 102,
    blurb:
      'Toco Hills and its intown neighbors form a vibrant Southern community with a strong day-school network and steady in-migration.',
  },
  'phoenix-az': {
    jewishPopulation: 85000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 500000,
    medianRent: 1900,
    effectivePropertyTaxRate: 0.0063,
    typicalPropertyTaxNote:
      'Arizona’s effective property-tax rate is among the lowest in the country.',
    stateIncomeTaxTopRate: 0.025,
    salesTaxRate: 0.086,
    costOfLivingIndex: 106,
    blurb:
      'Scottsdale and North Phoenix anchor a sunbelt community growing on low property taxes, a flat income tax and endless blue skies.',
  },
  'denver-co': {
    jewishPopulation: 95000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 580000,
    medianRent: 2000,
    effectivePropertyTaxRate: 0.0051,
    typicalPropertyTaxNote:
      'Colorado has one of the lowest effective property-tax rates in the nation, offset by higher home values.',
    stateIncomeTaxTopRate: 0.044,
    salesTaxRate: 0.0881,
    costOfLivingIndex: 110,
    blurb:
      'East Denver’s Hilltop and Hebrew-Educational-Alliance corridor headline a community that pairs mountain-town lifestyle with a flat, low income tax.',
  },
  'cleveland-oh': {
    jewishPopulation: 80000,
    jewishPopSource: 'Jewish Federation of Cleveland study est.',
    medianHomeValue: 300000,
    medianRent: 1500,
    effectivePropertyTaxRate: 0.022,
    typicalPropertyTaxNote:
      'Cuyahoga County carries high effective rates, but low home prices keep the dollar bill in check.',
    stateIncomeTaxTopRate: 0.035,
    salesTaxRate: 0.08,
    localIncomeTaxNote: 'Ohio municipalities levy a local income tax (~2–2.5%).',
    costOfLivingIndex: 95,
    blurb:
      'Beachwood, University Heights and Cleveland Heights host a well-established, institution-rich community with famously affordable housing.',
  },
  'detroit-mi': {
    jewishPopulation: 72000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 280000,
    medianRent: 1400,
    effectivePropertyTaxRate: 0.017,
    typicalPropertyTaxNote:
      'Michigan caps taxable-value growth for existing owners, but effective rates on transfers can be high.',
    stateIncomeTaxTopRate: 0.0425,
    salesTaxRate: 0.06,
    costOfLivingIndex: 92,
    blurb:
      'Oak Park, Southfield and Huntington Woods form a compact, walkable community with some of the most affordable home prices on this list.',
  },
  'boston-ma': {
    jewishPopulation: 250000,
    jewishPopSource: 'CJP Greater Boston community study est.',
    medianHomeValue: 1050000,
    medianRent: 3100,
    effectivePropertyTaxRate: 0.011,
    typicalPropertyTaxNote:
      'Massachusetts’ effective rate is modest, but Brookline/Newton home values push the dollar bill high.',
    stateIncomeTaxTopRate: 0.09,
    salesTaxRate: 0.0625,
    localIncomeTaxNote: 'MA adds a 4% surtax on income above ~$1M (the “millionaire’s tax”).',
    costOfLivingIndex: 150,
    blurb:
      'Brookline and Newton anchor a highly-educated community with premier day schools — and some of the priciest housing in the country.',
  },
  'philadelphia-pa': {
    jewishPopulation: 215000,
    jewishPopSource: 'Jewish Federation of Greater Philadelphia study est.',
    medianHomeValue: 400000,
    medianRent: 1800,
    effectivePropertyTaxRate: 0.014,
    typicalPropertyTaxNote:
      'Rates vary widely: Lower Merion and Montgomery County differ sharply from the city itself.',
    stateIncomeTaxTopRate: 0.0307,
    salesTaxRate: 0.08,
    localIncomeTaxNote: 'Philadelphia levies a ~3.75% resident wage tax.',
    costOfLivingIndex: 105,
    blurb:
      'From the Main Line’s Lower Merion to the Northeast, a historic community with a low flat state income tax and a range of price points.',
  },
  'silver-spring-md': {
    jewishPopulation: 110000,
    jewishPopSource: 'Greater Washington community study (MD side) est.',
    medianHomeValue: 600000,
    medianRent: 2200,
    effectivePropertyTaxRate: 0.0099,
    typicalPropertyTaxNote:
      'Montgomery County’s effective property-tax rate is moderate for the DC region.',
    stateIncomeTaxTopRate: 0.0575,
    salesTaxRate: 0.06,
    localIncomeTaxNote: 'Montgomery County adds a ~3.2% local income tax.',
    costOfLivingIndex: 132,
    blurb:
      'Kemp Mill and White Oak host a close, walkable community inside the Beltway, blending federal-workforce stability with easy DC access.',
  },
  'st-louis-mo': {
    jewishPopulation: 60000,
    jewishPopSource: 'Jewish Federation of St. Louis study est.',
    medianHomeValue: 300000,
    medianRent: 1400,
    effectivePropertyTaxRate: 0.012,
    typicalPropertyTaxNote:
      'Missouri effective rates are moderate; University City and Olivette assessments stay reasonable.',
    stateIncomeTaxTopRate: 0.048,
    salesTaxRate: 0.0918,
    localIncomeTaxNote: 'St. Louis City levies a 1% earnings tax.',
    costOfLivingIndex: 90,
    blurb:
      'University City, Olivette and Chesterfield anchor a friendly, affordable Midwestern community with a growing out-of-town draw.',
  },
  'memphis-tn': {
    jewishPopulation: 9000,
    jewishPopSource: 'Jewish Federation of Memphis / community est.',
    medianHomeValue: 300000,
    medianRent: 1400,
    effectivePropertyTaxRate: 0.013,
    typicalPropertyTaxNote:
      'Tennessee has no income tax; Shelby County property rates carry more of the load.',
    stateIncomeTaxTopRate: 0,
    salesTaxRate: 0.0975,
    costOfLivingIndex: 88,
    blurb:
      'A small but famously warm and cohesive community in East Memphis, punching well above its weight in Torah institutions.',
  },
  'las-vegas-nv': {
    jewishPopulation: 75000,
    jewishPopSource: 'Berman Jewish DataBank est.',
    medianHomeValue: 450000,
    medianRent: 1700,
    effectivePropertyTaxRate: 0.006,
    typicalPropertyTaxNote:
      'Nevada’s effective property-tax rate is low, and a tax-abatement cap limits annual increases.',
    stateIncomeTaxTopRate: 0,
    salesTaxRate: 0.0838,
    costOfLivingIndex: 103,
    blurb:
      'Summerlin anchors a fast-growing, no-income-tax community drawing families west with new homes and year-round warmth.',
  },
}

/** Full facts table: every metro id → curated ~2025 facts. */
export const METRO_FACTS: Record<string, MetroFacts> = Object.fromEntries(
  Object.entries(SEEDS).map(([id, seed]): [string, MetroFacts] => [
    id,
    { ...seed, asOf: ASOF, sourceNote: SOURCE_NOTE },
  ]),
)

/** Look up curated facts for a metro id, or `undefined` if none exist. */
export function getMetroFacts(id: string): MetroFacts | undefined {
  return METRO_FACTS[id]
}

// Dev-time guard: keep facts in lockstep with the metro list. Tree-shaken out of prod.
if (process.env.NODE_ENV !== 'production') {
  for (const m of METROS) {
    if (!METRO_FACTS[m.id]) {
      console.warn(`[metros/facts] missing MetroFacts for "${m.id}"`)
    }
  }
}
