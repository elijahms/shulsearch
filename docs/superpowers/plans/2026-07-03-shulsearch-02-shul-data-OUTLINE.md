# ShulSearch Plan 02 — Shul Data Model & Seeding (OUTLINE / draft)

> Draft outline for review. Full bite-sized TDD steps + a verification pass are added
> before execution (same treatment Plan 01 got). Grounded in the spec (§5, §7) and the
> technical-findings doc.

**Goal:** A populated, deduped, denomination-tagged `shuls` collection in Firestore for the
launch metros, plus a re-runnable seeding pipeline — all behind typed, tested modules.

**Key structuring decision (reduces dependencies):** the storable backbone (OSM + Wikidata) +
dedup + denomination pipeline needs **no Google key**, so Plan 02 ships useful data on its own.
The **Google Places discovery / `place_id`** pass is the *last* task and is gated on the Maps
key — if the key isn't ready, seeding still runs (OSM+Wikidata only) and Places enrichment is a
re-run later.

## Prerequisites (owner)
- **Google Maps Platform key** with **Places API (New)** enabled — only needed for the final
  Places-enrichment task. I'll give exact console steps when we reach it. (Not needed to start.)
- No RapidAPI key needed in Plan 02 (that's Plan 03).

## File structure (new in Plan 02)
```
src/lib/geo/
  haversine.ts        # great-circle distance (m) between two lat/lng      [Task 2]
  geohash.ts          # geohash encode for stored shuls                    [Task 2]
src/lib/shuls/
  schema.ts           # Shul zod schema + TS types + denomination enums    [Task 1]
  repo.ts             # Firestore upsert / queryByMetro / getById          [Task 3]
  normalize.ts        # name normalization (diacritics, abbrevs, translit) [Task 4]
  dedup.ts            # geoblock + fuzzy-name merge decision               [Task 4]
  denomination.ts     # name heuristics + OSM-value normalization + conf.  [Task 5]
src/scripts/seed/
  metros.ts           # ~11 launch metros with bboxes + display names      [Task 6]
  osm.ts              # Overpass fetch → raw shul records                   [Task 6]
  wikidata.ts         # SPARQL fetch → raw shul records (CC0)              [Task 7]
  places.ts           # Google Places discovery + place_id (gated on key)  [Task 9]
  merge.ts            # combine sources → dedup → denomination → Shul[]     [Task 8]
  index.ts            # orchestrator: per-metro seed → Firestore (tsx)      [Task 10]
test/fixtures/        # recorded Overpass/SPARQL/Places responses for tests
```

## Task list (each becomes full TDD steps in the final plan)

1. **Shul schema + enums** — zod schema mirroring spec §5 (`denomination.category` ∈
   Orthodox/Conservative/Reform/Reconstructionist/Nondenominational; `subtype` ∈ Modern
   Orthodox/Yeshivish/Chassidish/Sephardic/Chabad; `nusach`; `source`; `confidence`), address,
   `lat/lng/geohash`, `googlePlaceId?`, `status`, timestamps. Tests: valid doc passes, bad
   category rejected.
2. **Geo utils** — `haversineMeters(a,b)` (test: known NYC↔LA ≈ 3,940 km; short walk ≈ correct)
   and `geohash(lat,lng)` (test: known encoding). Pure, unit-tested.
3. **Shul repo** — `upsertShul`, `queryByMetro`, `getById` over Firestore Admin. Integration
   test against the emulator (extends Plan 01 harness): write two shuls, query by metro.
4. **Normalize + dedup** — `normalizeName` (NFKD strip diacritics, lowercase, drop punctuation,
   expand Cong→congregation/Ctr→center, unify Beth/Beis/Bais/Beit + Yisroel/Yisrael/Israel,
   strip generic stopwords) and `isDuplicate(a,b)` (geoblock ≤~100 m AND token-set ratio ≥0.85,
   OR same housenumber+street, OR same website/phone). Tests: "Cong. Beth Israel" ≈ "Bais
   Yisroel"? (tunable), distinct adjacent shtieblach NOT merged.
5. **Denomination inference** — `inferDenomination(name, osmTags)`: Chabad/Lubavitch→Chabad;
   Young Israel→Modern Orthodox; Kollel/Yeshiva/Beis/Khal/Nusach→Orthodox; Temple…/Reform→Reform;
   normalize OSM `denomination` raw values → enum; return `{category, subtype?, source,
   confidence}`. Low confidence → `needsReview`. Tests over a table of real names.
6. **Metros + OSM ingester** — `metros.ts` (11 bboxes) and `fetchOsmShuls(bbox)` calling the
   Overpass API with the canonical query (`nwr[amenity=place_of_worship][religion=jewish]` ∪
   `building=synagogue`), parsed to raw records (name, lat/lng, tags, address). Test against a
   recorded fixture (no live HTTP in tests); one live smoke run gated behind an env flag.
7. **Wikidata ingester** — `fetchWikidataSynagogues(region)` via SPARQL (CC0), parsed to raw
   records. Fixture-tested. (Optional union for notable/historic congregations.)
8. **Merge pipeline** — `mergeSources(osm, wikidata)` → normalize → dedup (Task 4) → denomination
   (Task 5) → `Shul[]` with provenance + attribution (`© OpenStreetMap contributors`). Unit-tested
   end-to-end on fixtures for one metro.
9. **Google Places discovery (gated)** — `discoverPlaces(metro)` Text/Nearby `synagogue` search
   with a minimal field mask; attach `place_id` to matched shuls, surface OSM-missing candidates
   for admin review. Persist **only `place_id`** (ToS). Skipped if no Maps key. Fixture-tested.
10. **Seed orchestrator** — `src/scripts/seed/index.ts` (run via `tsx`): for each metro →
    fetch sources → merge → optional Places → `upsertShul` to Firestore. Integration test seeds a
    fixture metro into the emulator and asserts counts + a spot-checked denomination. Add
    `"seed": "tsx src/scripts/seed/index.ts"` script; install `tsx`.
11. **Run + verify** — run the seeder against the real project (or emulator first), report
    per-metro counts and `needsReview` totals; commit a short data-quality note. Confirms the
    coverage reality (OSM sparse in Haredi metros) and populates the admin curation queue.

## Open decisions to confirm before finalizing
- **Fuzzy-match library:** `string-similarity`/Jaro-Winkler dep vs. a small in-repo token-set
  ratio (no dep). Lean: tiny in-repo function (YAGNI, testable).
- **Seed target first:** emulator (safe dry-run) then real Firestore, or straight to real? Lean:
  emulator dry-run first, eyeball counts, then real.
- **Denomination for ambiguous names:** default to `Orthodox`/`needsReview` vs.
  `Nondenominational`/`needsReview`? Lean: `needsReview` with best-guess category, never silently
  wrong.
