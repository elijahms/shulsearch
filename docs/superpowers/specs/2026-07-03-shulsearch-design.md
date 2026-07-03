# ShulSearch — v1 Design

**Date:** 2026-07-03 (rev. 1.1 — updated after technical verification)
**Status:** Approved — ready for implementation planning
**Owner:** Elijah Silverman (`elijahmsilverman@gmail.com` for GCP/Firebase)
**Companion doc:** `2026-07-03-shulsearch-technical-findings.md` (verification detail + sources)

## 1. Problem & Premise

Home/apartment search tools are blind to the one thing that matters most to observant Jewish
buyers and renters: **can you walk to shul on Shabbat?** ShulSearch inverts the usual search —
instead of "here are homes in a city," it answers **"here are homes within a walkable radius of
a shul (of your denomination) in this city."**

The product is grounded in a curated database of shuls. Regular users search without any
account. The community keeps the shul database honest by adding and disputing entries, all of
which flow through an admin moderation queue.

## 2. Users & Core Flows

### 2.1 Searcher (no login — anonymous Firebase Auth)
1. Pick a **metro**.
2. Choose either a **specific shul** (search over our own DB) or **"any shul"** + a
   **denomination filter**.
3. Set a **walk radius** (presets: 0.5 / 0.75 / 1 / 1.5 mi).
4. Optional home filters: **buy vs. rent**, price range, beds, baths, home type.
5. Get results — only listings within the radius of a qualifying shul — on a **map + list**,
   each card showing the **real walking distance and time** to the shul.

### 2.2 Contributor (no login)
- **Add a new shul** or **dispute/edit** an existing one via a form.
- Submissions do **not** go live; they enter a moderation queue.
- Optional contact email so an admin can follow up.

### 2.3 Admin (Google login)
- Sign in with Google; access gated by a **custom claim** (`admin:true`) + email allowlist.
- Review the moderation queue with a **diff view** (proposed vs. current) for edits/disputes.
- **Approve / edit-then-approve / reject** with an audit trail.
- **Curate coverage gaps** (a first-class task, not an afterthought): review low-confidence
  auto-seeded records and hand-add missing shuls, using GoDaven/Chabad locators as on-screen
  human reference (never scraped/imported).
- View an **analytics dashboard** of search activity.

## 3. Architecture & Stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 15.x** (App Router, TypeScript), Node 20+ (`engines`) |
| UI | **shadcn/ui** + Tailwind; collapsible-sidebar app shell |
| Database | **Firestore** |
| Auth | **Firebase Auth** — Google provider for admins (custom claim + allowlist); Anonymous auth for searchers |
| Hosting | **Firebase App Hosting** (Blaze plan, managed Cloud Run + CDN, `apphosting.yaml`, GitHub push-to-deploy) |
| Map | **`@vis.gl/react-google-maps`** v1 |
| Geo (seed + display) | **Google Maps Platform** — Places (New) `synagogue` search for **discovery + `place_id` only**, Geocoding (rare), **Routes API `computeRouteMatrix`** (WALKING) for displayed walk times |
| Listings | **`ListingsProvider`** interface. Primary adapter: **OpenWeb Ninja "Real-Time Zillow Data"** (`/search/coordinates`). Fallback: **apimaker `zillow-com1`**. `MockListingsProvider` for dev/tests |
| Validation | **zod** on all inbound payloads |
| Secrets | **Cloud Secret Manager** (RapidAPI key, server Maps key) via `apphosting.yaml` |

**Provider abstraction:** every quirk of a listings source is isolated in one adapter behind a
stable `ListingsProvider` interface; swapping providers is a one-file change. This is
load-bearing — there is **no official Zillow API in 2026**; all endpoints are unofficial
scrapers that can break or be taken down, so the design also includes caching, retry/backoff,
a provider health check/failover, and a nightly canary.

**Two Google Maps keys:** a **server-only secret** for Routes API (walk times — must not be
browser-exposed) and a separate **HTTP-referrer-restricted browser key**
(`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`, declared with `BUILD` availability) for the client map.

## 4. Search Pipeline

### 4.1 Chosen approach — Live bounding-box query (verified feasible)
Compute a bounding box around the chosen shul(s) sized to the radius, query the listings
provider's **coordinate/bounds endpoint** for just that area, then haversine-filter to the exact
circle. We never persist provider listing data (ToS-safer), listings stay fresh, and we fetch
only what's near a shul. (OpenWeb Ninja `/search/coordinates` accepts an explicit N/S/E/W box —
confirmed in verification.)

### 4.2 Flow
```
shul point(s)
  → bounding box (sized to radius)
  → [cache check] ListingsProvider.search(bounds, {buy|rent, price, beds, baths, homeType})
  → haversine filter to exact circle          (provider returns a rectangle, so this is required)
  → sort by distance to nearest qualifying shul
  → take top N (hard cap ~15–20 shown)
  → Routes API computeRouteMatrix (WALKING, duration+distanceMeters mask) for shown results
    [walk-time cache keyed by (shulId, listing lat/lng rounded ~4dp)]
  → render map + list with walk distance/time
```

- **Specific-shul mode:** one shul point → one box/circle.
- **Any-shul mode:** load qualifying shuls for the metro (filtered by denomination), query the
  metro-area bounds, keep each listing whose **minimum distance to any qualifying shul** ≤
  radius; annotate with that nearest shul.
- **Caps & edge cases:** page provider results up to a sane cap; the ~500-result Zillow map cap
  is a non-issue for walkable radii — only subdivide the box into tiles for ultra-dense pockets.
- **Caching:** short-TTL (~15–60 min) server-side cache on provider responses keyed by (rounded
  bounds, status, home_type, price/beds); longer cache on walk-time results (origin is a fixed
  shul, listings recur → high hit rate; respect Routes caching ToS).

## 5. Data Model (Firestore)

### `shuls`
```
id, name,
denomination: {
  category: "Orthodox"|"Conservative"|"Reform"|"Reconstructionist"|"Nondenominational",
  subtype?: "Modern Orthodox"|"Yeshivish"|"Chassidish"|"Sephardic"|"Chabad",
  nusach?: "Ashkenaz"|"Sefard"|"Edot HaMizrach",   // optional Orthodox sub-signal
  source: "osm"|"name-heuristic"|"movement-directory"|"admin",
  confidence: "high"|"medium"|"low"
},
address, city, metro, state, zip,
lat, lng, geohash,
phone?, website?,
flags?: { eruv?: boolean, dailyMinyan?: boolean },   // display-only in v1
googlePlaceId?,                                        // stored for LIVE lookup only; no other Google content persisted
source: "osm"|"wikidata"|"user"|"admin",              // provenance of the stored record
status: "active"|"archived",
needsReview?: boolean,                                 // low-confidence / known-gap → admin queue
createdAt, updatedAt, verifiedBy?
```
> **ToS compliance:** durable records are built from **OSM (ODbL) + Wikidata (CC0) + first-party
> curation**. We persist Google's `place_id` only — never Google-sourced name/address/coords —
> and refetch live via `place_id` when needed.

### `submissions`
```
id, type: "new"|"edit"|"dispute",
targetShulId?, payload, note?, submitterEmail?,
status: "pending"|"approved"|"rejected",
reviewedBy?, reviewedAt?, reviewNote?, createdAt
```

### `searches` (analytics)
```
id, timestamp, metro, mode: "specific"|"any",
shulId?, denominationFilter?, radius,
listingType: "buy"|"rent", priceMin?, priceMax?, beds?, baths?, homeType?,
resultCount, zeroResults: boolean, sessionId
```

### `admins`
```
{ email }   // allowlist; backs the admin:true custom claim
```

**Geo strategy:** per-metro shul counts are small (hundreds), so v1 loads a metro's shuls into
memory (query by `metro`) and filters in-app. `geohash` is stored for a future `geofire` upgrade.

## 6. Admin, Auth & Analytics

- **Auth:** searchers use **Anonymous Auth** (never touch admin paths). Admins sign in with
  Google → server mints a **session cookie** (`createSessionCookie`) → guarded by
  `verifySessionCookie(cookie, true)` **in the Node runtime** (server component / route handler /
  server action — the Admin SDK cannot run in Edge middleware). Authorization gated by a
  **`admin:true` custom claim** + email allowlist. Admin SDK uses zero-arg init via Application
  Default Credentials in a `server-only` singleton.
- **Moderation queue:** pending submissions; diff view for edits/disputes; approve applies the
  change to `shuls` and stamps an audit trail; edit-then-approve; reject with reason.
- **Curation queue:** low-confidence / `needsReview` shuls surfaced for admin verification +
  gap-filling.
- **Analytics dashboard:** search volume over time, top metros, top shuls, popular radii, and
  **zero-result searches** as the demand-gap signal.

## 7. Seeding & Data Pipeline

Coverage strategy (chosen): **auto-seed + first-class admin curation + public crowdsourcing.**
Ship with what we can legally auto-seed, make curation a first-class admin tool, let the
community add/dispute, and do a manual cleanup pass on launch metros before go-live.

Re-runnable pipeline (offline, not in the request path). For each launch metro:
1. **Storable backbone:** pull Jewish places of worship from **OSM Overpass** (ODbL) —
   `nwr["amenity"="place_of_worship"]["religion"="jewish"]({{bbox}})` (widen with
   `building=synagogue`); optionally union **Wikidata** (CC0) for notable/historic congregations.
2. **Discovery + `place_id`:** run **Google Places `synagogue`** search per metro to (a) discover
   shuls missing from OSM and (b) attach a `place_id`. Persist only `place_id` + our own fields.
3. **Dedup:** normalize names (strip diacritics/punctuation, expand abbreviations, unify
   Beth/Beis/Bais/Beit, drop generic stopwords) → geoblock (~75–120 m dense, ~150 m else) → match
   if fuzzy ≥~0.85 OR identical housenumber+street OR same website/phone → merge (OSM canonical) →
   flag 0.70–0.85 for admin review.
4. **Denomination pipeline:** (a) name heuristics (Chabad/Lubavitch→Chabad; Young Israel→Modern
   Orthodox; Kollel/Yeshiva/Beis/Khal→Orthodox; Temple…/Reform→Reform); (b) cross-reference
   name+geo against movement directories (URJ ~819 Reform, USCJ ~600 Conservative, OU/GoDaven for
   Orthodox); (c) normalize OSM `denomination` values into the fixed enum. Store denomination
   `source` + `confidence`; low-confidence → `needsReview`.
5. **Attribution:** keep "© OpenStreetMap contributors" on stored/derived data; show "Google
   Maps" attribution wherever live Google fields are displayed off-map.

**Launch metros (~11):** Brooklyn, Queens, Five Towns/Nassau, Teaneck-Bergen NJ, Lakewood NJ,
Passaic NJ, Monsey NY, Baltimore, Los Angeles, Miami/Boca Raton, Chicago.

**GoDaven/Chabad:** used as **on-screen human reference for admins only** — never bulk-scraped
(their ToS prohibits it). A future data partnership is the path to shtiebel-level Orthodox depth.

## 8. Non-Goals (v1 / YAGNI)

- No searcher accounts (anonymous only).
- No saved searches or email alerts.
- No **walking-distance filter** — filter by straight-line radius, only *display* walk time.
- No persistence of provider listing data or of Google Places content (beyond `place_id`).
- No scraping of GoDaven/Chabad/movement directories.
- No payments, no minyan-time scheduling, US-only.

## 9. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Unofficial Zillow RapidAPI is fragile / could be taken down | Provider abstraction + `MockListingsProvider`; caching; retry/backoff; health check/failover; nightly canary |
| Shul coverage gaps in Haredi metros (OSM under-counts) | First-class admin curation + public crowdsourcing; manual launch-metro pass; zero-result analytics surface gaps; optional GoDaven/Chabad partnership later |
| Denomination incomplete / unreliable | Denomination pipeline (heuristics + movement-directory cross-ref + admin), stored with source + confidence; `needsReview` flag |
| Google Maps free-tier cliff (~500 searches/mo) | Walk-time only for shown results; hard result cap; walk-time cache; billing alerts |
| External API cost creep | Caching, result caps, budgets/alerts, referrer-restricted Maps key |
| ODbL share-alike on derived DB | Acceptable for v1; revisit (lean more on CC0 Wikidata + first-party curation) if commercial terms tighten |

## 10. Verification Status & Residual Questions

Section-10 assumptions from rev. 1.0 were verified (see technical-findings doc). The bounding-box
pipeline, App Hosting fit, and Google Maps cost pattern are confirmed; shul-data architecture was
revised accordingly (this doc). Residual items to confirm during implementation:
1. Exact OpenWeb Ninja `/search/coordinates` parameter names + whether for-sale and for-rent
   require separate calls (confirm in the RapidAPI playground before coding the box builder).
2. Current Routes API caching ToS window (before building the walk-time cache).
3. Whether the client renders an interactive map on every search (drives the browser Maps key).
