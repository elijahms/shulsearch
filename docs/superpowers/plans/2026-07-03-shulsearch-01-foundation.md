# ShulSearch Plan 01 — Foundation & Infra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployed, tested Next.js 15 skeleton with the shadcn collapsible-sidebar
shell, Firebase client + admin SDK wiring, a Firestore-emulator test harness, App Hosting
config, and CI — the foundation every later plan builds on.

**Architecture:** Next.js 15 App Router (TypeScript, `src/` dir, `@/*` alias) on Firebase App
Hosting. Firebase client SDK for the browser, a `server-only` Admin SDK singleton for the Node
runtime. Tests run on Vitest; Firestore/Auth integration tests run against the local Firebase
Emulator Suite so no cloud project is needed for the test loop.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui, Firebase (`firebase` +
`firebase-admin`), Firebase Emulator Suite, Vitest + Testing Library.

---

## Prerequisites (owner — one-time, needs `elijahmsilverman@gmail.com`)

These need your Google account and are done in a browser/CLI you own. The agent tasks below do
**not** depend on these until **Task 11 (deploy)** — everything before Task 11 runs fully local
against emulators.

- [ ] **P1.** Create a Firebase project on the **Blaze** plan at <https://console.firebase.google.com>.
- [ ] **P2.** In the project, **Add a Web App** and copy its config (apiKey, authDomain,
  projectId, appId, messagingSenderId, storageBucket).
- [ ] **P3.** Enable **Firestore** (production mode) and **Authentication** (enable the **Google**
  and **Anonymous** providers).
- [ ] **P4.** Install the CLIs locally and log in:
  ```bash
  npm install -g firebase-tools
  firebase login          # in the session, prefix with `! ` so output lands here
  ```
- [ ] **P5.** (Deferred to later plans, note now) Enable Google Maps Platform APIs + create keys,
  and subscribe to the OpenWeb Ninja RapidAPI — not needed until Plans 02–04.

---

## Task 1: Scaffold the Next.js 15 app into the existing repo

`create-next-app` refuses a non-empty directory (our repo already has `docs/` + `.git`), so
scaffold in a temp dir and copy in.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/*`, `postcss.config.mjs`,
  `eslint.config.mjs`, etc. (generated)

- [ ] **Step 1: Scaffold in a temp dir**

Run:
```bash
cd /Users/elijahsilverman/Development
npx create-next-app@latest _ss_scaffold \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Expected: prompts default through; a `_ss_scaffold/` app is created. (If it prompts for
Turbopack, accept the default — Yes.)

- [ ] **Step 2: Copy generated files into the repo (preserving our `.git` and `docs/`)**

Run:
```bash
rsync -a --exclude='.git' /Users/elijahsilverman/Development/_ss_scaffold/ \
  /Users/elijahsilverman/Development/shulsearch/
rm -rf /Users/elijahsilverman/Development/_ss_scaffold
cd /Users/elijahsilverman/Development/shulsearch
```
Expected: `package.json`, `src/app/`, `next.config.ts` now exist in `shulsearch/`. The
scaffold's `.gitignore` replaced ours — that's fine (Task 9 re-adds Firebase ignores).

- [ ] **Step 3: Install deps and verify typecheck + dev boot**

Run:
```bash
npm install
npx tsc --noEmit
```
Expected: `npm install` succeeds; `tsc --noEmit` exits 0 (no type errors).

- [ ] **Step 4: Verify the dev server serves the default page**

Run (the repo memory notes port 3000 is often occupied — use 3100):
```bash
PORT=3100 timeout 20 npm run dev &
sleep 8 && curl -sSf http://localhost:3100 >/dev/null && echo "DEV_OK"
```
Expected: prints `DEV_OK`. Kill any lingering dev server after.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 app (App Router, TS, Tailwind)"
```

---

## Task 2: Vitest + Testing Library test harness

**Files:**
- Create: `vitest.config.ts`, `test/setup.ts`
- Modify: `package.json` (scripts + devDeps)
- Test: `test/smoke.test.ts`

- [ ] **Step 1: Install test deps**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom vite-tsconfig-paths \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: installs succeed.

- [ ] **Step 2: Write `vitest.config.ts`**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // integration tests (emulator) run in their own pass; keep unit runs fast
    exclude: ['**/node_modules/**', 'test/integration/**'],
  },
})
```

- [ ] **Step 3: Write `test/setup.ts`**

Create `test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add scripts to `package.json`**

In `package.json` `"scripts"`, add (the emulator-backed `test:integration` script is added
later, in Task 8, once the emulator config exists):
```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Write the failing smoke test**

Create `test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('test harness', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run it and verify it passes**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add vitest + testing-library harness"
```

---

## Task 3: Initialize shadcn/ui + install shell components

**Files:**
- Create: `components.json`, `src/components/ui/*`, `src/lib/utils.ts`
- Modify: `src/app/globals.css` (shadcn tokens)

- [ ] **Step 1: Init shadcn**

Run:
```bash
npx shadcn@latest init -d
```
Expected: creates `components.json`, `src/lib/utils.ts`, and writes CSS variables into
`src/app/globals.css`. (`-d` accepts defaults: neutral base color, CSS variables.)

- [ ] **Step 2: Add the components the shell needs**

Run:
```bash
npx shadcn@latest add sidebar button separator sheet skeleton tooltip input dropdown-menu
```
Expected: files appear under `src/components/ui/` (including `sidebar.tsx`, which pulls the
`useIsMobile` hook + provider primitives).

- [ ] **Step 3: Verify typecheck still passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: init shadcn/ui and add shell components"
```

---

## Task 4: Collapsible-sidebar app shell

**Files:**
- Create: `src/components/app-sidebar.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`
- Test: `src/components/app-sidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/app-sidebar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

describe('AppSidebar', () => {
  it('renders the brand and primary nav items', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    )
    expect(screen.getByText('ShulSearch')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contribute/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app-sidebar`
Expected: FAIL — `Cannot find module './app-sidebar'`.

- [ ] **Step 3: Implement `AppSidebar`**

Create `src/components/app-sidebar.tsx`:
```tsx
import Link from 'next/link'
import { Home, PlusCircle } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const NAV = [
  { title: 'Search', href: '/', icon: Home },
  { title: 'Contribute', href: '/contribute', icon: PlusCircle },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-1 text-lg font-semibold">ShulSearch</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app-sidebar`
Expected: PASS.

- [ ] **Step 5: Wire the shell layout + a placeholder page**

Create `src/app/(app)/layout.tsx`:
```tsx
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="font-medium">ShulSearch</span>
        </header>
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

Create `src/app/(app)/page.tsx`:
```tsx
export default function SearchHome() {
  return <p className="text-muted-foreground">Search coming soon.</p>
}
```

Delete the default scaffold home so the route group owns `/`:
```bash
rm -f src/app/page.tsx
```

- [ ] **Step 6: Verify build + typecheck**

Run: `npm run typecheck && npx next build`
Expected: type check clean; build succeeds and lists `/` and no duplicate-route error.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: collapsible-sidebar app shell"
```

---

## Task 5: Health-check API route (TDD)

**Files:**
- Create: `src/app/api/health/route.ts`
- Test: `src/app/api/health/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/health/route.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(typeof body.timestamp).toBe('string')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- health`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implement the route**

Create `src/app/api/health/route.ts`:
```ts
import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- health`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: /api/health endpoint"
```

---

## Task 6: Firebase client SDK singleton (TDD)

Reads config from the App-Hosting-injected `FIREBASE_WEBAPP_CONFIG` (JSON) in prod, falling back
to `NEXT_PUBLIC_FIREBASE_*` env vars for local/other hosts. Returns a memoized app.

**Files:**
- Create: `src/lib/firebase/client.ts`
- Test: `src/lib/firebase/client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/firebase/client.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('getFirebaseApp', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-shulsearch'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:1:web:abc'
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-shulsearch.firebaseapp.com'
    delete process.env.FIREBASE_WEBAPP_CONFIG
  })

  it('returns a memoized singleton', async () => {
    const { getFirebaseApp } = await import('./client')
    const a = getFirebaseApp()
    const b = getFirebaseApp()
    expect(a).toBe(b)
    expect(a.options.projectId).toBe('demo-shulsearch')
  })

  it('prefers FIREBASE_WEBAPP_CONFIG when present', async () => {
    process.env.FIREBASE_WEBAPP_CONFIG = JSON.stringify({
      apiKey: 'injected',
      projectId: 'injected-project',
      appId: '1:2:web:def',
      authDomain: 'injected-project.firebaseapp.com',
    })
    const { getFirebaseApp } = await import('./client')
    expect(getFirebaseApp().options.projectId).toBe('injected-project')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- firebase/client`
Expected: FAIL — `Cannot find module './client'`.

- [ ] **Step 3: Implement the client singleton**

Create `src/lib/firebase/client.ts`:
```ts
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'

function readConfig(): FirebaseOptions {
  if (process.env.FIREBASE_WEBAPP_CONFIG) {
    return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG) as FirebaseOptions
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(readConfig())
}
```

- [ ] **Step 4: Install `firebase` if not already present, then run the test**

Run:
```bash
npm install firebase
npm test -- firebase/client
```
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: firebase client SDK singleton"
```

---

## Task 7: Firebase Admin SDK singleton (TDD, server-only)

Zero-arg init via Application Default Credentials on App Hosting; auto-targets the Firestore
emulator when `FIRESTORE_EMULATOR_HOST` is set (local/tests). Guarded with `import 'server-only'`.

**Files:**
- Create: `src/lib/firebase/admin.ts`
- Test: `test/integration/admin.test.ts` (integration — runs under the emulator in Task 8)

- [ ] **Step 1: Install admin SDK + `server-only`**

Run:
```bash
npm install firebase-admin
npm install server-only
```

- [ ] **Step 2: Implement the admin singleton**

Create `src/lib/firebase/admin.ts`:
```ts
import 'server-only'
import { getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

export function getAdminApp(): App {
  // On App Hosting, ADC + FIREBASE_CONFIG make this zero-arg. Locally, the emulator
  // env vars (FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST) + a projectId suffice.
  const existing = getApps()[0]
  if (existing) return existing
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    'demo-shulsearch'
  return initializeApp({ projectId })
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}
```

Note: `server-only` throws if imported into a client bundle — the integration test imports it in
a Node (non-jsdom) context, so it is safe there.

- [ ] **Step 3: Verify typecheck (the behavior test lives in Task 8 under the emulator)**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: server-only firebase admin SDK singleton"
```

---

## Task 8: Firestore emulator harness + smoke integration test

**Files:**
- Create: `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`,
  `test/integration/vitest.config.ts`, `test/integration/admin.test.ts`
- Modify: `package.json` (integration script)

- [ ] **Step 1: Write `firebase.json`**

Create `firebase.json`:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "firestore": { "port": 8080 },
    "auth": { "port": 9099 },
    "ui": { "enabled": true }
  }
}
```

- [ ] **Step 2: Write `.firebaserc`, rules, and indexes**

Create `.firebaserc`:
```json
{ "projects": { "default": "demo-shulsearch" } }
```

Create `firestore.rules` (locked down by default; opened per-collection in later plans):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Create `firestore.indexes.json`:
```json
{ "indexes": [], "fieldOverrides": [] }
```

- [ ] **Step 3: Write a dedicated integration vitest config (node env, includes only integration)**

Create `test/integration/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['test/integration/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Replace the integration script in `package.json`**

Set the script to run the emulator around the integration config:
```json
"test:integration": "firebase emulators:exec --only firestore,auth --project demo-shulsearch \"vitest run --config test/integration/vitest.config.ts\""
```

- [ ] **Step 5: Write the failing integration test**

Create `test/integration/admin.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { getAdminDb } from '@/lib/firebase/admin'

describe('admin Firestore against emulator', () => {
  beforeAll(() => {
    // firebase emulators:exec injects FIRESTORE_EMULATOR_HOST automatically.
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBeTruthy()
  })

  it('writes and reads a document', async () => {
    const db = getAdminDb()
    const ref = db.collection('_smoke').doc('t1')
    await ref.set({ hello: 'world' })
    const snap = await ref.get()
    expect(snap.data()).toEqual({ hello: 'world' })
  })
})
```

- [ ] **Step 6: Install firebase-tools locally as a dev dep (so CI has it without a global)**

Run: `npm install -D firebase-tools`

- [ ] **Step 7: Run the integration test under the emulator**

Run: `npm run test:integration`
Expected: emulator boots, test PASSES, emulator shuts down. (Requires a JDK — the Firestore
emulator needs Java 11+. If missing: `brew install temurin`.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: firestore emulator harness + admin smoke integration test"
```

---

## Task 9: App Hosting config + env surface + ignores

**Files:**
- Create: `apphosting.yaml`, `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Write `apphosting.yaml`**

Create `apphosting.yaml` (public browser config as BUILD env now; secrets are added in later
plans — commented so intent is captured):
```yaml
runConfig:
  minInstances: 0
  maxInstances: 4
  concurrency: 80
  cpu: 1
  memoryMiB: 512

env:
  # Public Firebase web config is injected automatically as FIREBASE_WEBAPP_CONFIG by App
  # Hosting; these NEXT_PUBLIC_* fallbacks are only needed if you self-inject. They must carry
  # BUILD availability or they will not reach the client bundle.
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: demo-shulsearch
    availability: [BUILD, RUNTIME]

  # --- Secrets added in later plans (Cloud Secret Manager) ---
  # - variable: RAPIDAPI_KEY
  #   secret: rapidapi-key
  #   availability: [RUNTIME]
  # - variable: GOOGLE_MAPS_SERVER_KEY
  #   secret: google-maps-server-key
  #   availability: [RUNTIME]
  # - variable: NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY
  #   secret: google-maps-browser-key
  #   availability: [BUILD]
```

- [ ] **Step 2: Write `.env.example`**

Create `.env.example`:
```bash
# Local dev — the Firebase web app config (from Firebase console > Project settings > Web app).
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Local emulator wiring (uncomment to point the app at emulators)
# FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
# FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

# Added in later plans:
# RAPIDAPI_KEY=
# GOOGLE_MAPS_SERVER_KEY=
# NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
```

- [ ] **Step 3: Re-add Firebase/Next ignores to `.gitignore`**

Append to `.gitignore`:
```
# firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log
*-debug.log

# env
.env
.env.local
!.env.example
```

- [ ] **Step 4: Verify env parsing works locally with a real `.env.local`**

Run:
```bash
cp .env.example .env.local
npm run typecheck
```
Expected: exits 0. (Fill `.env.local` with real values from prereq P2 when you deploy.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: apphosting.yaml, env surface, gitignore"
```

---

## Task 10: CI (typecheck + lint + unit + integration)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run test:integration
```

- [ ] **Step 2: Verify the workflow file is valid YAML**

Run: `npx --yes js-yaml .github/workflows/ci.yml >/dev/null && echo "YAML_OK"`
Expected: prints `YAML_OK`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: typecheck, lint, unit + integration tests"
```

---

## Task 11: First App Hosting deploy (owner-assisted checkpoint)

Requires prereqs P1–P4. This proves the whole toolchain end-to-end on a real URL.

**Files:**
- Modify: `.firebaserc` (real project id), `apphosting.yaml` (real project id)

- [ ] **Step 1: Point the repo at the real Firebase project**

Set `.firebaserc` `default` and `apphosting.yaml`'s `NEXT_PUBLIC_FIREBASE_PROJECT_ID` to your
real project id from prereq P1. Push the repo to a GitHub remote (owner: use the `elijahms`
personal account per your setup).

- [ ] **Step 2: Create the App Hosting backend (owner runs; connects GitHub)**

Run (prefix with `! ` in-session so output lands here):
```bash
firebase apphosting:backends:create --project <YOUR_PROJECT_ID>
```
Follow prompts: pick region, connect the GitHub repo, set the live branch to `main`, root `/`.

- [ ] **Step 3: Trigger a rollout by pushing to the live branch**

Run:
```bash
git push origin main
```
Expected: App Hosting builds + rolls out. Watch in Firebase console > App Hosting.

- [ ] **Step 4: Verify the live health endpoint**

Run (substitute the assigned `*.hosted.app` URL):
```bash
curl -sSf https://<backend-id>--<project-id>.us-central1.hosted.app/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`.

- [ ] **Step 5: Tag the milestone**

```bash
git tag v0.1.0-foundation
git push --tags
```

---

## Definition of Done (Plan 01)

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:integration` all green locally.
- `npx next build` succeeds.
- The collapsible-sidebar shell renders `/` and the sidebar toggles.
- `/api/health` returns `{status:"ok"}` locally and (Task 11) on the live `*.hosted.app` URL.
- Firebase client + admin singletons exist and are tested (admin against the emulator).
- `apphosting.yaml`, `.env.example`, `firebase.json`, CI are committed.
