# ShulSearch — v1 Design

**Date:** 2026-07-03
**Status:** Approved (design) — pending technical verification + implementation plan
**Owner:** Elijah Silverman (`elijahmsilverman@gmail.com` for GCP/Firebase)

## 1. Problem & Premise

Home/apartment search tools are blind to the one thing that matters most to observant
Jewish buyers and renters: **can you walk to shul on Shabbat?** ShulSearch inverts the
usual search — instead of "here are homes in a city," it answers **"here are homes within a
walkable radius of a shul (of your denomination) in this city."**

The product is grounded in a curated database of shuls. Regular users search without any
account. The community keeps the shul database honest by adding and disputing entries, all
of which flow through an admin moderation queue.

## 2. Users & Core Flows

### 2.1 Searcher (no login)
1. Pick a **metro**.
2. Choose either a **specific shul** (autocomplete within the metro) or **"any shul"** +
   a **denomination filter**.
3. Set a **walk radius** (presets: 0.5 / 0.75 / 1 / 1.5 mi).
4. Optional home filters: **buy vs. rent**, price range, beds, baths, home type.
5. Get results — only listings within the radius of a qualifying shul — on a **map + list**,
   each card showing the **real walking distance and time** to the shul.

### 2.2 Contributor (no login)
- **Add a new shul** or **dispute/edit** an existing one via a form.
- Submissions do **not** go live; they enter a moderation queue.
- Optional contact email so an admin can follow up.

### 2.3 Admin (Google login)
- Sign in with Google; access gated to an **email allowlist**.
- Review the moderation queue with a **diff view** (proposed vs. current) for edits/disputes.
- **Approve / edit-then-approve / reject** with an audit trail.
- View an **analytics dashboard** of search activity.

## 3. Architecture & Stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js** (App Router, TypeScript) |
| UI | **shadcn/ui** + Tailwind; collapsible-sidebar app shell |
| Database | **Firestore** |
| Auth | **Firebase Auth** (Google provider) — admins only; searchers anonymous |
| Hosting | **Firebase App Hosting** (Next.js SSR) |
| Maps/geo | **Google Maps Platform** — `@vis.gl/react-google-maps` (map), Places (seeding + shul autocomplete), Geocoding, **Distance Matrix** (walking distance) |
| Listings | **`ListingsProvider`** interface; `ZillowRapidApiProvider` is the only Zillow-aware module |
| Validation | **zod** on all inbound payloads (search params, submissions) |

**Key principle — provider abstraction:** every quirk of the unofficial Zillow RapidAPI is
isolated in one adapter behind a stable `ListingsProvider` interface. Swapping to Rentcast,
ATTOM, or any other source later is a one-file change. A `MockListingsProvider` backs local
development and tests.

## 4. Search Pipeline

### 4.1 Chosen approach — Live bounding-box query
Compute a bounding box around the chosen shul(s) sized to the radius, query the listings
provider **by map bounds** for just that area, then haversine-filter to the exact circle.
We never persist provider listing data (ToS-safer), listings stay fresh, and we fetch only
what's near a shul.

**Rejected alternatives:**
- *Whole-city query then filter* — simpler but wasteful; hits provider pagination limits in
  dense metros.
- *Pre-cache all metro listings in Firestore* — fast and analytics-friendly, but stale data
  and storing provider data is a ToS liability. Out for v1.

### 4.2 Flow
```
shul point(s)
  → bounding box (sized to radius)
  → ListingsProvider.search(bounds, {buy|rent, price, beds, baths, homeType})
  → haversine filter to exact circle
  → sort by distance to nearest qualifying shul
  → take top N (~20 shown)
  → Distance Matrix (walking) batch call for shown results
  → render map + list with walk distance/time
```

- **Specific-shul mode:** one shul point → one box/circle.
- **Any-shul mode:** load qualifying shuls for the metro (filtered by denomination), query
  the metro-area bounds, keep each listing whose **minimum distance to any qualifying shul**
  ≤ radius; annotate with that nearest shul.
- **Caps:** page provider results up to a sane cap; if capped, UI shows "closest N."
- **Caching:** short-TTL cache on provider responses (cost + rate limits); longer cache on
  routing results keyed by (origin, destination) since geometry is stable.

## 5. Data Model (Firestore)

### `shuls`
```
id, name,
denomination: { category: "Orthodox"|"Conservative"|"Reform"|"Reconstructionist"|"Nondenominational",
                subtype?: "Modern Orthodox"|"Yeshivish"|"Chassidish"|"Sephardic"|"Chabad"|... },
address, city, metro, state, zip,
lat, lng, geohash,
phone?, website?,
flags?: { eruv?: boolean, dailyMinyan?: boolean },   // display-only in v1
source: "google"|"osm"|"user"|"admin",
status: "active"|"archived",
needsReview?: boolean,                                 // e.g. uncertain denomination
createdAt, updatedAt, verifiedBy?
```

### `submissions`
```
id, type: "new"|"edit"|"dispute",
targetShulId?,                 // for edit/dispute
payload,                       // proposed fields
note?, submitterEmail?,
status: "pending"|"approved"|"rejected",
reviewedBy?, reviewedAt?, reviewNote?,
createdAt
```

### `searches` (analytics)
```
id, timestamp,
metro, mode: "specific"|"any",
shulId?, denominationFilter?,
radius, listingType: "buy"|"rent",
priceMin?, priceMax?, beds?, baths?, homeType?,
resultCount, zeroResults: boolean,
sessionId                       // anonymous
```

### `admins`
```
{ email }                       // allowlist; may back custom claims later
```

**Geo strategy:** per-metro shul counts are small (hundreds), so v1 loads a metro's shuls
into memory (query by `metro`) and filters in-app — no geohash range queries needed yet.
`geohash` is stored so we can move to `geofire`-style radius queries if scale demands.

## 6. Admin & Analytics

- **Guard:** `/admin/*` protected server-side (Firebase Auth session + email allowlist),
  not merely UI hiding.
- **Moderation queue:** pending submissions; diff view for edits/disputes; approve applies
  the change to `shuls` and stamps an audit trail; edit-then-approve; reject with reason.
- **Analytics dashboard:** search volume over time, top metros, top shuls, popular radii,
  and **zero-result searches** as the demand-gap signal (where users search but data is thin).

## 7. Seeding Pipeline

A re-runnable script (not part of the request path). For each launch metro:
1. Pull synagogues from **Google Places** (name, address, lat/lng, phone, website).
2. Cross-fill from **OpenStreetMap Overpass** (`amenity=place_of_worship` + `religion=jewish`,
   plus `denomination` tag where present).
3. **Dedupe** by name + proximity; geocode any gaps.
4. Best-guess **denomination** from name/OSM tags; set `needsReview` where uncertain.
5. Write to `shuls` with `source` tags.

**Launch metros (~11):** Brooklyn, Queens, Five Towns/Nassau, Teaneck-Bergen NJ, Lakewood NJ,
Passaic NJ, Monsey NY, Baltimore, Los Angeles, Miami/Boca Raton, Chicago. (Adding metros is
cheap — re-run the script with a new metro definition.)

## 8. Non-Goals (v1 / YAGNI)

- No searcher accounts.
- No saved searches or email alerts.
- No **walking-distance filter** — we filter by straight-line radius and only *display* walk
  time/distance for shown results.
- No persistence of provider listing data.
- No payments.
- No minyan-time scheduling.
- US-only.

## 9. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Unofficial Zillow RapidAPI is fragile / may change | Provider abstraction + a `MockListingsProvider`; monitor; swap-ready |
| External API cost creep (Zillow, Google Maps) | Short-TTL caching, result caps, routing only for shown results, billing alerts |
| Shul data quality / coverage gaps | Crowdsourced submissions + admin moderation; zero-result analytics surface gaps |
| Denomination tagging incomplete | `needsReview` flag; admin fills; best-guess from name/OSM on seed |
| Routing (Distance Matrix) cost | Only shown results (~20), cache by (origin, destination) |

## 10. Open Assumptions To Verify Before Implementation

1. **Zillow RapidAPI capabilities** — the chosen endpoint must support **map-bounds /
   coordinate queries** and return **per-listing lat/lng**, plus buy/rent + basic filters and
   pagination. If not, fall back to city-search + client-side geocoding of results.
2. **Firebase App Hosting + Next.js App Router** — current setup (`apphosting.yaml`, secret/
   env handling, Firestore/Auth wiring) as of 2026.
3. **Google Maps Platform** — Places usage for synagogue seeding + autocomplete; Distance
   Matrix walking-mode limits and pricing; geocoding quotas.
4. **OSM Overpass** — realistic denomination-tag coverage for Jewish places of worship in the
   launch metros.

These are verified during planning; findings feed the implementation plan.
