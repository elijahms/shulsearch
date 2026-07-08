# Accounts, Trending & Support — design memo

**Date:** 2026-07-07 · **Status:** proposed (support skeleton shipped)

The goal driving all three: make ShulSearch genuinely useful to a religious Jew
*deciding* where to move — not just running one search, but comparing communities
over weeks, seeing where peers are looking, and trusting the product enough to
support it.

## 1. Accounts & saving (Google sign-in)

**What exists already.** Google sign-in is fully wired (`src/lib/auth/client.ts`:
`signInWithGoogle`, `onAuthChange`, `getIdToken`; server-side token verification in
`src/lib/auth/server.ts`). Today it's only surfaced for admins in the sidebar
footer. There is no user-facing reason to sign in yet — that's the gap, not auth.

**What to build.** A `users/{uid}` document tree, owner-only via rules:

- `users/{uid}/savedListings/{listingId}` — snapshot of the Listing (price, beds,
  photo, url…) + `savedAt` + search context (which shul, radius, metro). Snapshot,
  not reference: cached listings age out daily, and "the house I saved last week"
  must survive that. Mark stale entries when the id disappears from the metro cache
  ("no longer on the market" is *useful signal*, not an error).
- `users/{uid}/savedSearches/{id}` — named search params (metro, shuls, radius,
  filters) so a family can re-run "Teaneck, 15 min walk, ≤$900k" in one tap.

**Surfaces.** Heart button on every listing card (prompts sign-in when logged out
— that's the natural conversion moment); a `/saved` page (listings + searches
tabs, contribute-page layout); sidebar footer becomes a real account menu for
everyone, not just admins.

**Rules addition** (the whole security model):

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

**Effort:** ~1 focused session. No new infrastructure, no new secrets.

## 2. Trending communities

**What exists already.** Every search logs `{metro, mode, filters, sessionId,
resultCount}` to the `searches` collection (`/api/search` route), and
`aggregateSearches` (`src/lib/analytics/aggregate.ts`) already turns rows into
per-metro rollups for the admin dashboard. Trending = a public, privacy-safe
projection of data we already have.

**What to build.**

- **Precomputed, not live.** Extend the existing daily listings cron (or a sibling
  route) to aggregate the trailing 7/30 days of searches into one public doc:
  `trending/current` → `[{metroId, searches, uniqueSessions, topFilters, rank,
  rankDelta}]`. One Firestore read serves everyone; no raw analytics ever leave
  the server. Count **unique sessions, not raw searches**, so one enthusiastic
  user can't move a small metro's rank.
- **Cold-start & small-metro floor.** Below a minimum session count, show a
  curated default order rather than noisy ranks; never show "3 people searched
  here" — small numbers de-anonymize small communities. Buckets ("quiet /
  steady / rising / hot") beat raw counts.
- **Surfaces.** A "Where families are looking" strip on the home page (top 5 +
  rank movement); a trend badge on `/metro` cards; later, "searches like yours
  also looked at X" on zero-result searches.

**Why this matters for the mission:** choosing a community is a herd decision —
"where are people like us going?" is *the* question religious families ask. This
is the feature that makes ShulSearch feel alive.

**Effort:** ~1 session (aggregation exists; it's a projection + a strip of UI).

## 3. Frontend beauty pass

**Anchor, don't restart.** v0.8.0-quiet-luxe just established a real system:
Newsreader serif + Geist, muted tekhelet accent, hairline borders, `ql-fade`
choreography. The pass should *deepen* it where users actually live:

1. **Search results** — the listing card is the product. Photo treatment
   (aspect-locked, subtle zoom on hover), price as the serif display element, walk
   time as a first-class badge (it's our differentiator — nobody else answers
   "can I walk to shul?"), skeleton loading states, map↔list hover linking.
2. **Home page hero** — first-visit experience: one evocative serif headline, the
   metro picker as the hero act, trending strip beneath (feature 2 feeds this).
3. **Map identity** — custom map style matching Quiet Luxe (desaturated base,
   tekhelet shul markers, warm listing dots); the default Google style is the
   loudest off-brand element on the page.
4. **Motion & polish sweep** — consistent `ql-fade` choreography, empty states
   with next actions ("widen the radius?"), focus states, reduced-motion.

**Process:** run with the `frontend-design` skill, one surface per session,
screenshot-verified. Search results first — it's where every user ends up.

**Effort:** 2–3 sessions if scoped as above.

## 4. Donations (skeleton shipped in this change)

`/support` page (Quiet Luxe styled, sidebar "Support" item) with one-time +
monthly tiers. Provider-agnostic: buttons activate when `NEXT_PUBLIC_DONATE_URL`
(+ optional `NEXT_PUBLIC_DONATE_MONTHLY_URL`) are set in `apphosting.yaml` —
paste a Stripe Payment Link / Donorbox / PayPal URL and it's live; until then the
page shows "donations open soon" and is safely deployable.

**To activate:** create a Stripe Payment Link (Dashboard → Payment Links →
"customer chooses amount"; a second one with monthly recurrence), uncomment the
two env vars in `apphosting.yaml`, deploy.

**Deliberately deferred:** in-app Stripe Checkout (`stripe` SDK, webhook,
receipts, donor records in Firestore). Worth it only when donations prove real;
the page copy and layout won't change.

## Sequencing

| Order | Feature | Why this order |
|---|---|---|
| 1 | Accounts & saving | Unblocks trending-quality signal (uid > sessionId) and every future personalization |
| 2 | Trending | Small build, feeds the hero redesign with real content |
| 3 | Frontend pass | Redesigns surfaces *with* save buttons + trending in them, not before |
| 4 | Donations activation | Flip env vars once a payment link exists (page already shipped) |
