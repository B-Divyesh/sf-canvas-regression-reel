# Canvas Regression Reel v0.1 handoff

## What shipped

- A publish-ready TypeScript npm library with ESM, CommonJS, and declaration
  outputs. The public Node API exports `defineConfig`, `runReel`, `comparePng`,
  `redactPng`, and `buildReport`; a browser-safe `/recorder` entry exports
  `createRecorder`.
- `canvas-reel run [config]` seeds `Math.random` before game code loads, exposes
  `window.__CANVAS_REEL_SEED__`, replays keyboard/pointer/wait actions in
  Chromium, captures the configured canvas, and uses explicit per-channel and
  changed-pixel-ratio tolerances.
- Explicit `--update` baseline creation, `--json` CI output, useful `--help`,
  and exit codes 0/1/2. Missing baselines, canvas size changes, invalid configs,
  and run errors are explained.
- A self-contained HTML evidence reel that names the first divergence and
  includes baseline/current/diff images. User masks are excluded from comparison
  and checkerboard-redacted in report images. No artifact is uploaded.
- A responsive documentation site with a real Canvas 2D comparator, adjustable
  tolerance, regression toggle, keyboard checkpoint navigation, copy feedback,
  empty state, online/offline status, and cached offline shell.
- `/privacy/` and `/terms/`, README, changelog, MIT license, sitemap, robots
  policy, and the product-specific visual system in `.factory/design.md`.
- An original mid-century instrument illustration generated through
  `/opt/fleet/lib/gen-image.sh`; its exact prompt and provenance are in the
  design document. The deployed 1440px WebP is 96 KB and its 720px responsive
  derivative is 24 KB. Source and generation metadata live in `.factory/assets`.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

`npm test` runs 6 unit/integration assertions, builds both artifacts, then runs
10 Playwright checks across desktop Chromium and a 390 × 844 Chromium viewport.
These cover the documented config surface, pixel thresholds, masks, dimension
errors, a real seeded baseline/pass/divergence sequence, live-demo interactions,
keyboard tab navigation, mobile overflow, empty-state recovery, legal routes,
console errors, and axe serious/critical findings.

Build output is exactly `dist/site/index.html` for static deployment. The npm
package files remain at `dist/*` and `npm pack --dry-run` reports a 15.4 KB
tarball (98.1 KB unpacked). The landing page payload on the mobile route is
about 36 KiB in Lighthouse because it selects the 24 KB responsive hero; built
application JS is 4.29 KB and CSS is 12.13 KB uncompressed. `npm audit
--audit-level=low` reports 0 vulnerabilities.

## Lighthouse-class verification

Measured August 28, 2026 against the production Vite build with Lighthouse
12.8.2, mobile defaults, and headless Chromium:

- Performance: **100**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**
- First Contentful Paint: **1.1 s**
- Largest Contentful Paint: **1.1 s**
- Total Blocking Time: **0 ms**
- Maximum Potential First Input Delay: **30 ms**
- Cumulative Layout Shift: **0**
- Total transferred: **36 KiB**

Lighthouse did not emit a lab INP value; the interactive demo is also exercised
in Playwright on both viewports. Axe reported no serious or critical violations.

## Publishing and deployment

- Package readiness: `npm pack --dry-run`
- Factory publish step (not run here): `npm publish`
- Site build command: `npm run build:site`
- Static deployment directory: `dist/site`

No registry credentials, product IDs, billing integration, DNS, or deployment
configuration were added.

## Known gaps and next steps

- Reliable evidence still depends on the game using a fixed timestep and
  controlling entropy outside `Math.random`; the optional `setup(page, seed)`
  hook is the escape hatch for engine-specific seeding/readiness.
- v0.1 runs one Chromium project locally. A future version could accept a
  browser-project matrix while keeping each report compact.
- The browser recorder captures pointer moves verbatim. Long drag-heavy sessions
  may benefit from trace compaction in a later minor release.
