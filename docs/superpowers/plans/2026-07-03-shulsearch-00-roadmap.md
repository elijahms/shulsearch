# ShulSearch — Implementation Roadmap

> Decomposition of the v1 spec (`docs/superpowers/specs/2026-07-03-shulsearch-design.md`,
> rev 1.1) into a sequence of plans. Each plan produces working, testable software and is
> executed + reviewed before the next is authored (so later plans build on real interfaces).

**Working repo:** `/Users/elijahsilverman/Development/shulsearch` (git-initialized).
**Language:** TypeScript everywhere — the app AND the offline seeding scripts (via `tsx`), so
they share zod schemas + the Firestore Admin SDK. No second toolchain.

## Plan sequence

| # | Plan | Produces | Depends on |
| --- | --- | --- | --- |
| **01** | **Foundation & Infra** | Deployed, tested Next.js 15 skeleton: shadcn collapsible-sidebar shell, Firebase client+admin SDK wiring, Firestore emulator test harness, `apphosting.yaml`, CI, health check | — |
| 02 | Shul Data Model & Seeding | `shuls` schema + zod types, geo utils, OSM/Wikidata ingesters, Google Places discovery (`place_id`), dedup + denomination pipelines, re-runnable metro seeder, populated dev DB | 01 |
| 03 | Listings Provider & Search Backend | `ListingsProvider` (Mock + OpenWeb Ninja + zillow-com1 fallback), bbox/haversine, any-shul min-distance, Routes API walk-time client + cache, listings cache/retry/failover, search API + zod, `searches` analytics logging | 01, 02 |
| 04 | Search UI | Metro selector, Firestore shul picker, denomination filter, radius presets, home filters, `@vis.gl/react-google-maps` map, result list + walk-time cards, zero-result state | 01, 02, 03 |
| 05 | Contribution Flow | Public add-shul + dispute/edit forms, zod validation, `submissions` writes, confirmation UX | 01, 02 |
| 06 | Admin App & Auth | Google sign-in, session-cookie mint/verify (Node runtime), `admin:true` claim + allowlist, route guard, moderation queue (diff + approve/edit/reject + audit), curation queue | 01, 02, 05 |
| 07 | Analytics Dashboard | Aggregations over `searches` (volume, top metros/shuls, radii, zero-result gaps) + dashboard UI | 01, 03, 06 |

## Target file structure (grows across plans)

```
shulsearch/
├─ apphosting.yaml                 # App Hosting runConfig + env/secret refs        [01]
├─ .env.example                    # documented env var surface                     [01]
├─ firebase.json                   # emulator config (Firestore + Auth)             [01]
├─ firestore.rules                 # security rules                                 [01→06]
├─ .github/workflows/ci.yml        # typecheck + test                               [01]
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                # root layout + providers                        [01]
│  │  ├─ (app)/                    # public search app group                        [01→04]
│  │  │  ├─ layout.tsx             # collapsible-sidebar shell                       [01]
│  │  │  └─ page.tsx               # search page                                    [04]
│  │  ├─ contribute/               # public add/dispute forms                       [05]
│  │  ├─ admin/                    # admin console (guarded, Node runtime)          [06→07]
│  │  └─ api/
│  │     ├─ health/route.ts        # health check                                   [01]
│  │     ├─ search/route.ts        # search endpoint                                [03]
│  │     ├─ submissions/route.ts   # contribution intake                            [05]
│  │     └─ session/route.ts       # admin session-cookie mint/clear                [06]
│  ├─ components/
│  │  ├─ ui/                       # shadcn primitives                              [01]
│  │  └─ app-sidebar.tsx           # sidebar shell                                   [01]
│  ├─ lib/
│  │  ├─ firebase/
│  │  │  ├─ client.ts              # client SDK singleton                            [01]
│  │  │  └─ admin.ts               # 'server-only' admin SDK singleton               [01]
│  │  ├─ geo/                      # haversine, bbox, geohash                        [02→03]
│  │  ├─ shuls/                    # shul schema + queries                           [02]
│  │  ├─ listings/                 # ListingsProvider + adapters + cache             [03]
│  │  ├─ routes/                   # Routes API walk-time client + cache             [03]
│  │  └─ analytics/                # search logging + aggregation                    [03→07]
│  └─ scripts/seed/                # OSM/Wikidata/Places ingest + dedup + denom      [02]
├─ test/                           # vitest setup, emulator helpers                  [01]
└─ docs/superpowers/{specs,plans}/ # this documentation
```

## Manual prerequisites (owner — needs your Google account)

These require `elijahmsilverman@gmail.com` and can't be automated by the agent. Plan 01 lists
exact steps; do them before/at the Plan 01 deploy step:
- Create a **Firebase project** (Blaze plan) and register a Web App.
- Enable **Google Maps Platform** APIs (Places New, Routes, Geocoding, Maps JavaScript) + create
  two API keys (server-restricted, browser-referrer-restricted).
- Create a **RapidAPI account** and subscribe to **OpenWeb Ninja "Real-Time Zillow Data"** (free
  tier to start).
- Connect the GitHub repo to Firebase App Hosting.

## Cadence

Author Plan 01 → execute + review → author Plan 02 → … Each plan is committed to
`docs/superpowers/plans/` before execution. Re-decompose if a phase proves larger than expected.
