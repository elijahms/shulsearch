# Metro Showcase — Design Memo (research-grounded)

**Date:** 2026-07-04 · **Status:** Design / not yet built · **Based on:** the `metro-showcase-research`
workflow (5 agents; full findings in the session transcript).

## Idea
A per-metro "should I move here?" page for a prospective observant family — grounding a relocation
decision in what they actually weigh: **shuls (have it) + Jewish schools + tuition + kosher food +
taxes/cost + community signals (eruv, mikvah, population)**. Turns ShulSearch from a search tool into
a relocation tool.

## Feasibility tiers

### Tier A — free, public-domain, refreshable (build first; one seed job → `metros` doc)
| Metric | Source | License | Notes |
|---|---|---|---|
| Jewish population + % | **Berman DataBank / AJYB** (Sheskin & Dashefsky) | Public domain | ⚠️ NOT Brandeis AJPP (bans scraping/commercial). Same numbers on Berman are PD. Manual 24-row crosswalk. |
| Median home value + rent | **Zillow ZHVI / ZORI** CSV | Free w/ "Data provided by Zillow" | We already have Zillow access. ZIP-level for neighborhood metros (Brooklyn/Five Towns/Monsey). |
| Cost-of-living index | **BEA Regional Price Parities** API | Public domain | MSA-level only. |
| Effective property-tax rate + typical bill | **Census ACS 5-yr** API (B25103÷B25077), town-level; overlay **NJ Div of Taxation** + **NY OSC** for high-tax metros | Public domain | Store $ inputs too, not just the ratio. |
| Income + sales tax context | **Tax Foundation** state data | CC BY-NC (cross-check) | So no-income-tax TX/FL vs high-burden NJ/NY compares honestly. |
| US Religion Census 2020 congregation/adherent counts | **ASARB / thearda.com** | Free | Cross-check + movement spread. |

### Tier B — mirrors the existing shul pipeline (medium)
- **Jewish day schools:** backbone = **NCES PSS** (public domain, ~900–1,000 Jewish schools: name,
  address, grades, enrollment, gender, county). Denomination/hashkafa is the *same* tagging problem as
  shuls → association-membership proxy + **AVI CHAI 2018-19** classifications + **Torah Umesorah**
  directory (fixes PSS Haredi undercount) + name heuristics + **admin curation** (only 24 metros).
  Enrich website/geocode from Places/OSM. Storable.
- **Kosher restaurants:** the **hechsher/certifying-agency** field is the whole value, and only the
  agencies have it (Google/OSM don't). Primary = per-metro **certification-agency lists** (national
  OU/OK/Star-K/Kof-K + the 1–3 local Vaads per metro — a small stable mapping), geocoded on ingest,
  deduped, `certifyingAgency` as an array. Same `adapters → normalize → dedup → Firestore` shape as
  shuls. Aggregators (YeahThatsKosher, kosherconnect) = admin cross-check only (ToS). Refresh monthly
  + `certifiedAsOf` (de-certification is a real signal).

### Tier C — hard/manual (v1 = approximate, curate later)
- **Tuition:** NO structured source (NAIS DASL is member-walled). v1 = metro-level **typical range by
  hashkafa** (a Brooklyn yeshiva family ~$8–18K vs a Teaneck MO family ~$25–45K, same region) seeded
  from Prizmah national medians + a manual pass over 3–8 anchor schools' own tuition pages, **plus the
  effective/net cost via local federation affordability programs** (the real decision driver; e.g.
  Seattle Samis caps ~$18K/15% AGI). Show sticker AND net. Admin-curated; `as_of` per figure.
- **Eruv** (bool + map link) + **mikvah** count/list: manual curation for 24 metros (eruv.org,
  mikvah.org) + roll up the per-shul `flags.eruv` we already store. Store `verifiedAt` (eruv status
  goes stale). OSM does NOT reliably tag either.
- **Vitality score:** composite from primitives we already have (shul count, daily-minyan flags,
  denomination diversity) + sibling metrics (school count, kosher count, mikvah count, eruv).

## Architecture (reuses what's built)
- **`metros` collection** — 24 docs keyed by our metro id, holding Tier-A scalars + tuition range +
  eruv/mikvah + vitality + `*_source` / `*_asOf` per field. Attribution baked in.
- **`schools`** and **`kosher_places`** collections — `metro` field, seeded like `shuls`, curated via
  the **admin console we just built** (extend moderation/curation to these types).
- A **metro-facts seed pipeline** parallel to `src/scripts/seed/` (OSM/Wikidata pattern), with source
  adapters per metric. Hand-review the small per-metro counts in admin.

## Page (`/metro/[id]`)
Hero: metro name + `N shuls · N schools · N kosher · Jewish pop ~X` + vitality score. Sections:
**Cost** (home value, rent, property-tax rate + typical bill, COL, tax context) · **Schools** (list by
hashkafa + tuition range + affordability programs) · **Kosher** (count + list by hechsher/type) ·
**Community** (population, eruv y/n + map, mikvah count, shul denomination spread) · **"Search homes
here"** CTA into the core search. Later: **side-by-side metro comparison** (the killer feature for a
mover deciding *where*).

## Suggested build order
- **Plan 08** — Tier-A metro facts + `metros` collection + basic showcase page (biggest bang: cost/tax/population/home-price, all free & automatable).
- **Plan 09** — schools pipeline + admin curation.
- **Plan 10** — kosher pipeline + admin curation.
- **Plan 11** — tuition + eruv/mikvah curation + metro comparison view.

## Hard rules (from the research)
- Never ingest **Brandeis AJPP** (no-scrape/no-commercial) — use the **Berman/AJYB** PD copy.
- Google/aggregators = enrichment / cross-check only, `place_id`-only persistence (same discipline as shuls).
- Tuition & tax figures are per-grade / per-town and time-sensitive → store `as_of` + show ranges, not false precision.
