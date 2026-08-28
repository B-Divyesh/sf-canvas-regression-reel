# Canvas Regression Reel repair handoff

**Work order:** `canvas-regression-reel-repair-1`

**Repair base:** `31408eb542b1ccf7fb2bed6b872c8f43c0f28da1`
**Artifact / deploy root:** npm library; static documentation site at `dist/site`

## Result

Repaired both release blockers from the independent verification report.

- The PWA shell is now generated from the finished production build. Its cache
  name is the SHA-256-derived manifest version, it explicitly precaches every
  current JS/CSS asset and fingerprinted responsive hero image, and it uses a
  network-first strategy for documents with an offline cached fallback.
- The service worker is generated anew for each application asset manifest and
  registered with `updateViaCache: 'none'`; it removes only previous
  `canvas-reel-shell-*` caches after activation.
- Responsive hero WebPs are fingerprinted during `npm run build:site`, so they
  can safely receive immutable caching. `site/public/_headers` declares one
  year immutable caching for fingerprinted assets and revalidation for HTML
  and `sw.js`.
- Production browser tests now use the built static site, not Vite dev mode.
  They assert a versioned cache, cached application entry, interactive offline
  reload, and cache response policy.

The library API, CLI, report behavior, design system, local-first privacy
model, legal pages, and passed demo behavior were preserved.

## Verification performed

All commands were run in this repair workspace on Node 22.23.2.

```sh
npm ci                         # 94 packages; 0 vulnerabilities
npm run lint                   # pass (TypeScript no-emit check)
npm run typecheck              # pass
npm test                       # pass: 6 Vitest + 14 Playwright checks
npm pack --dry-run             # pass: 15.6 kB packed / 98.7 kB unpacked
npm pack                       # ready-to-publish canvas-regression-reel-0.1.0.tgz
```

The browser suite ran the built production server at both Desktop Chrome and
390×844 Chromium mobile. It covered normal and regression states, Arrow-key
checkpoint navigation, empty-state recovery, no mobile overflow, legal pages,
axe serious/critical violations (zero), versioned cached shell operation while
offline, and cache headers. The new offline test reloads after obtaining a
service-worker controller, switches the context offline, reloads, clicks
**Introduce regression**, and asserts `Visual change found` with no console
errors.

The static-server test verifies:

- JS and fingerprinted WebP: `Cache-Control: public, max-age=31536000, immutable`
- `/` and `/sw.js`: `Cache-Control: public, max-age=0, must-revalidate`

Packed-consumer smoke checks imported the tarball as ESM and CommonJS and
validated `defineConfig`, `runReel`, and `comparePng`; `canvas-reel --help`
worked and an invalid command returned exit code 2.

Production asset budgets remain within the contract: main JS 4.31 kB, CSS
12.13 kB, mobile hero 24.5 kB, desktop hero 97.3 kB (uncompressed files).
No third-party assets, telemetry, or upload path were added.

## Deploy and release

Deploy the generated `dist/site` directory unchanged, including `_headers` and
the generated `sw.js`. For npm release, the factory should publish the packed
tarball with its managed credentials; this worker did not publish it.

After the static deployment settles, confirm the live root, `sw.js`, a current
`/assets/main-*.js`, and both current `/instrument-reel-*.webp` responses match
the deployed build and header policy. This environment has no deployment
credential or explicit deployment command beyond pushing the configured `main`
branch, so live propagation is performed by the factory deployment pipeline.

## Known gaps

No product behavior gaps remain locally. A fresh live-URL identity/header check
must occur after the factory deployment has propagated; it cannot be truthfully
claimed before that external step completes.
