# Canvas Regression Reel repair handoff

**Work order:** `canvas-regression-reel-repair-2`

**Implementation SHA:** `140dfd18323e453650d8f32d009ec1853f05c323`

**Documentation/source SHA:** `140dfd18323e453650d8f32d009ec1853f05c323`

**Live URL:** https://canvas-regression-reel.sociobot.in/

## What changed

- Added `/demo/?demo=1`, an isolated three-checkpoint Canvas 2D playground.
  It imports the package's new browser-safe `canvas-regression-reel/browser`
  entry, displays a persistent sample-data banner, supports reset and recovery,
  and stores only `demo:canvas-regression-reel:state`.
- Added `.factory/claims.json` with 13 public claims and exactly one tagged,
  outcome-based browser test for each. `npm run test:claims -- --grep
  @claim:<id>` is the declared command.
- Added the browser comparison entry and a clean-consumer packaged-artifact
  check covering ESM, CommonJS, browser entry, runner, report, and CLI.
- Reworked the landing page around the job, audience, and sample action;
  added the required copy audit, demo documentation, catalog description, and
  generated social/device preview crops from the product's original hero art.
- Added `/demo/`, route-specific metadata, canonical and social tags, legal
  route metadata, sitemap entries, apple touch icon, designed 404 page, and
  a Static Web Apps 404 response override.
- Added restrictive CSP and Permissions Policy response headers. The CSP
  matches the self-hosted scripts, styles, images, worker, and data URL images.
- Fixed the former phone/200%-resize issue: interactive links and controls are
  at least 44 px tall, the range control is 44 px, and the 195 px equivalent
  layout has no document overflow.

## Verification

From a documented clean setup (`npm ci`, Node 22), these passed:

```text
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS: 6 Vitest + 40 Playwright tests
npm run test:consumer        PASS: packed clean consumer
npm run build                PASS: dist/ and dist/site/
npm pack --dry-run           PASS: 20.9 kB package, 22 files
```

All 13 claim commands in `.factory/claims.json` were run individually from the
clean setup and passed. They cover seeded replay, recorder actions, selected
canvas capture, tolerance, masking/redaction, first-divergence report, CLI
JSON/exits, no uploads, offline reload, cache policy, sample speed, isolation,
and the package-backed playground.

Live HTTPS checks after deployment used fresh desktop (1440 × 900) and phone
(390 × 844) browser contexts. Before scrolling, both showed:

- Job: **Find changed canvas frames**.
- Audience: solo browser-game developers who need visual evidence before they
  ship.
- First action: **Try it with sample data**; it opens the separate seeded
  comparison.

Both live contexts entered the demo, showed **Demo — sample data, nothing is
saved**, changed **02 · Gap**, reset to **Within tolerance**, had no console
errors, no serious/critical axe violations, and no horizontal overflow. A
fresh service-worker-controlled phone context reloaded offline and changed the
sample successfully. Privacy and terms returned 200 with route titles; an
unknown URL returned the designed 404 with HTTP 404.

The deployed root SHA-256 matched this build:

```text
0577c7dd40ab8bf12dee9030f916cfaaa1436db15dacdbd07129c687f924df36
```

Live headers verify document/worker revalidation, immutable hashed assets,
CSP, and Permissions Policy. Mobile Lighthouse on the live root measured:

| Performance | Accessibility | LCP | CLS | TBT | Transfer |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 100 | 1.04 s | 0 | 45 ms | 32.9 kB |

Evidence is in `/work/.evidence/live-repair-2.json`, the two first-screen and
demo screenshots beside it, and
`/work/.evidence/lighthouse-repair-2-mobile.json`.

## Earlier and current review disposition

| Review item | Disposition |
| --- | --- |
| F-01: npm registry package unavailable | **External dependency remains.** The registry still returns E404. The site and README no longer tell users to install an unavailable package; they document a local `npm pack` path. Factory-managed npm publishing is required before registry installation can be offered. |
| F-02: no isolated library sample | Fixed with `/demo/`, persistent banner, reset, separate storage namespace, and package browser entry. |
| F-03: no claims registry/tests | Fixed with 13 registered tagged tests and individual clean-command evidence. |
| F-04: no designed 404 | Fixed with `404.html` and Static Web Apps `responseOverrides`. Live unknown route is HTTP 404. |
| F-05: incomplete metadata/structure | Fixed: canonical/social metadata, social image, touch icon, demo and 404 sitemap entries, consistent header/footer, external-link labels, and build ID. |
| F-06: no CSP/Permissions Policy | Fixed in generated `staticwebapp.config.json`; verified live. |
| F-07: first-screen/plain words | Fixed and audited in `.factory/copy-audit.md`. |
| F-08: touch/200% resize | Fixed and tested at 390 px and 195 px equivalent. |
| Earlier offline inert shell | Remains fixed; rechecked against the deployed demo offline. |
| Earlier cache policy and worker version | Remains fixed; rechecked against live headers and offline reload. |

## Deployment

Deployed `dist/site` with `/opt/fleet/lib/deploy-static.sh` to the existing
`sf-canvas-regression-reel` Static Web App. The deployment reported success and
the HTTPS custom domain returned 200 immediately afterward. The product stays
static and has no backend, shared database, tenant state, billing, AI gateway,
or process-local persistence.

## Known gap and next step

The only remaining acceptance dependency is npm registry publication of
`canvas-regression-reel@0.1.0`. Per the library publishing policy, publishing
is factory-managed and was not attempted from this worker. The artifact is
ready: run `npm pack`, then publish that tarball through the factory registry
workflow. After publication, replace the local-tarball wording with the normal
registry install command and independently install it from a fresh consumer.
