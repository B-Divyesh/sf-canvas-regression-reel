# Independent verification — FAIL

**Candidate:** `68be2de1c883123a0a26e08be3be768e97c7d2a1`
**Live URL:** https://canvas-regression-reel.sociobot.in/
**Verified:** 2026-08-28, fresh `npm ci`, Node 22.23.2, Chromium supplied for Playwright 1.58.2.

## Decision

**FAIL.** The publishable npm library and the normal online documentation flow
pass, but the deployed/claimed PWA offline experience does not. A controlled
service worker reload while offline renders static HTML but does not attach the
application's event handlers; the live demo cannot be used. The deployment also
sends a 30-second revalidating cache policy for content-hashed assets instead of
long-lived immutable caching. These are release-blocking quality-gate failures
for this product's advertised cached offline shell and static-site cache policy.

## Defects

### P1 — Offline reload is not a usable cached shell

**Reproduction (production build):** load `http://127.0.0.1:4174/`, wait for
`navigator.serviceWorker.ready`, reload once to obtain a controller, set the
browser context offline, then reload and click **Introduce regression**.

**Observed:** the service worker controls the page and Cache Storage contains
`/`, all three JS/CSS assets, the legal pages, favicon, and both hero images.
The browser reports HTTP 200 service-worker responses for the JS/CSS assets,
but after the offline reload the toggle remains `aria-pressed="false"` and
`#run-status` remains `Within tolerance`; it should become `Visual change
found`. This reproduced after waiting 1.5 seconds after reload. The first
offline run also produced three `net::ERR_FAILED` console resource errors.

**Impact:** an offline user sees the initial HTML but cannot run the advertised
local comparator. This fails the requested PWA offline-reload check.

### P2 — Hashed assets are not served with immutable long-lived caching

**Observed on the live deployment:** `/assets/main-A-T_1cUY.js`,
`/assets/styles-C00iEuao.css`, and `/instrument-reel.webp` each return
`Cache-Control: public, must-revalidate, max-age=30`. They are content-hashed
or versioned build outputs and do not receive `immutable` or a long-lived
max-age, contrary to the static-product performance contract.

**Related update risk:** `site/public/sw.js` has a fixed
`CACHE = 'canvas-reel-shell-v1'` and cache-first handling for `/` and assets.
The service-worker file does not incorporate the build asset hashes. A future
deployment whose app assets change while `sw.js` remains byte-identical will
not trigger a new worker, so existing users can remain on the cached old shell.

## Passed evidence

### Clean build and tests

- `npm ci`: completed; audit reported 0 vulnerabilities.
- `npm run typecheck`: passed.
- Exact `npm test`: passed — 6 Vitest unit/integration tests, production build,
  and 10 Playwright desktop/mobile tests.
- `npm run build`: passed and produced `dist/`.
- `npm pack --dry-run`: passed; package is 15.4 kB compressed / 98.1 kB
  unpacked, 18 files.

### Clean consumer and public surface

Packed the candidate, installed it into a fresh temporary npm consumer together
with Playwright 1.58.2, then exercised ESM and CommonJS imports, `comparePng`,
`defineConfig`, and `runReel`. A real seeded data-URL canvas run performed
baseline update, identical pass, and changed-seed first-divergence detection;
the generated report embedded its local PNG evidence. The complete consumer
flow took 428 ms. `canvas-reel --help` was useful; invalid command exited 2;
a duplicate-checkpoint config exited 2 with `Duplicate checkpoint “same”.`.
Runtime boundaries also rejected missing seed and `pixelDelta: -1` with clear
errors.

### Product behavior, accessibility, privacy, and responsiveness

Against a production `vite preview` build and separately against the live URL:

- Desktop (1440 px) and mobile (390 x 844) exercised normal state, introduced
  regression, tolerance values 0 and 80, checkpoint Arrow/End navigation,
  empty-state clear and recovery, and reduced-motion mode. No horizontal mobile
  overflow occurred.
- Keyboard Tab reaches the visible skip link; computed focus outline is 3 px.
- Axe found 0 serious/critical violations on both viewports. Title, `lang`,
  one `h1`, and `main` are present. No console errors or page errors occurred
  in online desktop/mobile tests.
- Runtime request capture found no third-party requests. Static review found no
  telemetry, analytics, upload, or CDN/font requests. External npm/GitHub links
  are user-activated links only.
- `/privacy/` and `/terms/` returned usable semantic pages.
- Reduced-motion CSS is present and the online interaction works with reduced
  motion selected.

### Live identity, headers, and budgets

The live deployment exactly matches the candidate production build for the
tested root and primary assets:

- `index.html` SHA-256: `053515e191fc598da9f8aef989808ade98e7e52e17b7fe18f2a007b59c02cb18`
- `sw.js` SHA-256: `b18c52792e57e12e3f01d31976a57066fdeb3ba6268b5d898150c97e1729a3d2`
- `main-A-T_1cUY.js` SHA-256: `d2c4d0adb23cce160525abcf91e989f3aee3528c5c4934bcfb626378aa75b9b8`
- `styles-C00iEuao.css` SHA-256: `28c1f533e42effe809840c975cca4f3f50d59a2d122cb4e59f2964592dd935b7`
- `instrument-reel.webp` SHA-256: `cac1b0aee30664503d36500827ceba505c61d941b02d75b4b3fa6be3f0bbecc6`

Live HTTP/2 headers include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Content-Type-Options: nosniff`, and appropriate content types. The live
online flow passed on both viewports with 0 serious/critical axe findings,
0 console/page errors, and 0 external runtime requests.

Bundle sizes are within stated payload budgets: application JS 4,288 B, CSS
12,133 B, responsive mobile hero 24,500 B, and desktop hero 97,300 B
(uncompressed build sizes). No Lighthouse binary was available locally; the
budget checks above are direct build measurements.

## Required next steps

1. Fix and automate the service-worker offline reload, including an assertion
   that an offline reload can operate the live comparator.
2. Version the worker/cache with the build (or use a proven precache tool), and
   set immutable, long-lived cache headers for fingerprinted assets while
   allowing HTML and the worker itself to revalidate.
3. Re-run this verification after deployment; do not rely on the current
   builder handoff's prior PASS claims.
