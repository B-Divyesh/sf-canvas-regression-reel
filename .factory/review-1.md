# Review 1: Find the first changed canvas frame

**Verdict: FAIL**

**Finding count:** 8

**Untested claim count:** 12

**Implementation reviewed:** `ad4f1843f7640416f1403b5473b5c6c14ae5baeb`

**Documentation reviewed:** `f6a47ed44dfcb7d70dd3c5045525f5a08bdff7d3`

**Live URL:** https://canvas-regression-reel.sociobot.in/

**Review date:** 2026-09-05

The implementation SHA is the last commit that changed the product or its
public documentation. The later commits only added verification reports and
handoff text. The live root, worker, JavaScript, CSS, and hero asset match the
local build from this source tree.

## First screen before scrolling

- Job: find the first browser-game canvas frame that changed.
- Audience: browser-game developers are implied by the supporting sentence;
  the first screen does not say that the product is for solo developers.
- First action: **Install the recorder**. A secondary **Try the live
  comparison** link scrolls to a sample already rendered farther down the same
  page.

At 1440 × 900 and 390 × 844, the job, supporting sentence, and both actions
were visible without scrolling. The live comparator itself began below the
viewport at 993 px on desktop and 1065 px on phone.

## Findings

### F-01 — P1 — The npm package named by the install instructions is unavailable

`npm view canvas-regression-reel version --json` returned registry `E404` on
2026-09-05. The live **View npm package** action and README tell users to
install this package. A new user therefore cannot perform the product's main
job from the documented public artifact. The locally packed artifact works,
but it is not a substitute for the advertised npm install path.

### F-02 — P1 — The required library demo and isolated sample mode do not exist

There is no `.factory/demo.md`. `/demo` returns the home page with the home
title and no distinct demo state. The first screen has no **Try it with sample
data** action. After opening the live comparison, there is no persistent
**Demo — sample data, nothing is saved** label, **Reset demo**, or **Start for
real** action.

The closest controls are **Clear trace** and **Load sample trace**. They do not
reset state: after introducing a regression, clearing, and loading the sample,
the toggle remained pressed and the status remained **Visual change found**.
The sample also reimplements comparison logic in `site/main.ts`; it does not
exercise the packed library as the library demo contract requires. The static
page wrote no cookies or web storage, so no real user data changed during the
review.

### F-03 — P1 — Public claims have no claims registry or dedicated claim tests

`.factory/claims.json` is missing and the repository contains no `@claim:`
test tags. There were therefore no declared claim commands to run. This review
counted 12 distinct public claim groups without the required dedicated sandbox
command:

1. seeded deterministic replay;
2. keyboard and pointer action replay;
3. capture of only the selected canvas;
4. explicit tolerant pixel comparison;
5. mask exclusion and report redaction;
6. first-divergence and self-contained report output;
7. CLI exit codes and machine-readable JSON;
8. browser trace recording;
9. no telemetry, account, cloud service, or artifact upload;
10. usable offline cached documentation and demo shell;
11. immutable fingerprinted assets with revalidating HTML and worker;
12. a reviewable result in under two minutes.

General tests or this review supplied partial evidence for these behaviors,
but none has the required one-to-one claim entry and command. Registry
availability is the separate false public instruction in F-01.

### F-04 — P2 — Unknown URLs do not return a designed 404

`/404` and `/not-a-real-page` both returned HTTP 200 and the complete home
page. The built Static Web Apps config has a navigation fallback but no 404
response override or 404 document. This is not a defect merely because a
deliberate 404 was requested; it is a defect because no deliberate 404 exists
and an invalid address is reported as a successful home page.

### F-05 — P2 — Required route metadata and site structure are incomplete

The root has no canonical link, Open Graph metadata, Twitter card, or Apple
touch icon. Privacy and terms also lack meta descriptions and canonical/social
metadata. There is no 1200 × 630 social image. The sitemap does not include a
real demo route or a 404 route. External npm and source links do not identify
themselves as external. The root header omits Privacy, and footers omit **Built
by Param Factory** plus a version or build ID.

### F-06 — P2 — The earlier security-header finding remains open

Live responses still send neither `Content-Security-Policy` nor
`Permissions-Policy`. This was the P3 hardening item in the preceding
verification. The current site-structure contract explicitly requires a CSP
matching the page, so it remains a finding in this strict zero-finding review.
HSTS, `Referrer-Policy`, and `X-Content-Type-Options` are present.

### F-07 — P2 — First-screen facts and page language do not meet the plain-words contract

The primary action is installation rather than the required sample action,
and adjacent text does not say what happens after the click. The three short
facts are **Seeded**, **Tolerant**, and **Local only**; they do not plainly state
privacy, offline availability, and price. Several headings use slogans or
instrument language instead of naming their sections, including **The shortest
path to certainty**, **Record. Replay. Read the signal.**, and **Keep the
release switch boring**. The required `.factory/copy-audit.md` is missing.

### F-08 — P2 — Phone touch targets and 200% text resizing fail the accessibility baseline

At 390 px, seven interactive elements measured below 44 CSS px in height. They
included the home wordmark (31 px), live-comparison link (41 px), tolerance
slider (24 px), footer wordmark (31 px), and Privacy, Terms, and Source links
(25 px each). At the 195 CSS px layout equivalent to 200% zoom on a 390 px
phone, the document widened to 302 px and the heading extended past the right
edge. Content therefore requires horizontal scrolling at the required resize.

## Earlier findings

| Earlier item | Current disposition | Evidence |
| --- | --- | --- |
| Offline reload rendered an inert shell (P1) | Fixed | A fresh service-worker-controlled context was taken offline, reloaded, and changed to **Visual change found** with no console errors. |
| Fingerprinted assets had 30-second caching and an unversioned worker (P2) | Fixed | The worker cache is `canvas-reel-shell-c1203811c2c12a0c`; JS, CSS, and WebP return one-year immutable caching, while `/` and `/sw.js` revalidate. |
| No CSP or Permissions Policy (P3) | Open as F-06 | Both headers remain absent on the live root response. |

## Passing evidence

From the initially clean checkout with Node 22.23.2 and npm 10.9.8:

```text
npm ci                PASS, 94 packages, 0 vulnerabilities
npm run lint          PASS
npm run typecheck     PASS
npm test              PASS, 6 Vitest and 14 Playwright tests
npm run build         PASS, dist/ and dist/site/ created
npm run build:site    PASS
npm pack --dry-run    PASS, 15.6 kB package, 18 files
```

A new temporary consumer installed the local tarball with Playwright 1.58.2.
ESM, CommonJS, the recorder subpath, baseline update, unchanged pass, changed
seed, three-checkpoint report, `--help`, JSON output, and exits 0/1/2 passed.
Invalid tolerance values, duplicate and invalid checkpoint names, missing
baselines, and maximum tolerance boundaries behaved as documented. The changed
run found `spawn` first and finished in 879 ms. Its report contained embedded
PNG data, one h1 and one main, supported arrow-key tab movement, fit 390 px,
had no serious/critical axe findings, and logged no errors.

On the live site, desktop and phone sample output showed three named frames,
544 changed pixels at Gap, the explicit threshold, seed, viewport, and mask.
Keyboard navigation, the visible 3 px skip-link focus ring, reduced motion,
normal/changed/empty/recovery flows, tolerance endpoints 0 and 80, and phone
layout passed. Axe found zero serious or critical issues at both viewports.
There were no console or page errors, cookies, local/session storage, or
third-party runtime requests. Privacy and terms returned semantic 200 pages.

Current Lighthouse 12.6.1 results were:

| Profile | Performance | Accessibility | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 100 | 1.1 s | 0 | 60 ms |
| Desktop | 100 | 100 | 0.3 s | 0 | 0 ms |

The built application JavaScript is 4.31 kB and CSS is 12.13 kB. The root,
service worker, main JS, main CSS, and hero hashes matched live. This product
has no backend, tenant state, rate-limited API, payment, or AI feature, so
tenant isolation, restart persistence, health, 429 handling, and AI gateway
checks do not apply. AI assistance is not an obvious missing step for a
deterministic pixel-comparison library.

## Evidence files

- `/work/.evidence/live-audit.json`
- `/work/.evidence/live-desktop-first-screen.png`
- `/work/.evidence/live-desktop-populated.png`
- `/work/.evidence/live-phone-first-screen.png`
- `/work/.evidence/live-phone-populated.png`
- `/work/.evidence/live-200-percent-equivalent.png`
- `/work/.evidence/generated-report-phone.png`
- `/work/.evidence/lighthouse-mobile.json`
- `/work/.evidence/lighthouse-desktop.json`

The product must not be accepted until all eight findings are resolved, the
claims registry reports zero untested claims, and the published npm artifact
can be installed from a clean consumer project.
