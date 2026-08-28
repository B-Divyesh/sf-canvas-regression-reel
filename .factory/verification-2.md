# Independent verification 2 — PASS

**Candidate:** `991db53e9dc6a973a86197ec1755580d3d4e88c6`

**Live URL:** https://canvas-regression-reel.sociobot.in/

**Verified:** 2026-08-28 (Node 22.23.2; Playwright/Chromium 1.58.2)

## Decision

**PASS.** This candidate fixes the two release blockers in the preceding
verification: the versioned service-worker shell is interactive after an
offline reload, and the live deployment serves fingerprinted assets with
long-lived immutable caching. The npm artifact, generated report, demo, legal
pages, and live deployment meet the researched brief's local-first visual
regression workflow.

No product source was modified during verification. This report and the
handoff are the only repository changes.

## Clean checkout and package evidence

The starting worktree was clean and checked out exactly at the candidate.

```sh
npm ci                 # 94 packages; 0 vulnerabilities
npm run lint           # pass (tsc --noEmit)
npm run typecheck      # pass (tsc --noEmit)
npm run test:unit      # pass: 6 tests
npm test               # pass: 6 Vitest + 14 production Playwright tests
npm run build          # pass; creates dist/ and dist/site/
npm pack --dry-run     # pass
npm pack               # pass; canvas-regression-reel-0.1.0.tgz
```

The tarball is 15.6 kB compressed / 98.7 kB unpacked (18 files). I installed
that tarball, plus Playwright 1.58.2, into a new temporary npm consumer. In the
consumer, the public ESM and CommonJS entries loaded correctly. A real seeded
data-URL canvas run updated a baseline, passed unchanged, then detected the
first changed checkpoint and generated its self-contained HTML report.

The packaged CLI was exercised rather than only inspected:

- `canvas-reel --help` printed command, options, and documented 0/1/2 exits.
- `canvas-reel run reel.config.mjs --update --json` returned an `updated`
  result and exit 0; the unchanged invocation returned `pass` and exit 0.
- Changing the seed with tolerance `{ pixelDelta: 0, changedPixelRatio: 0 }`
  returned JSON `{ ok: false, firstDivergence: "spawn", status: "changed" }`
  and exit 1.
- An invalid command exited 2. Runtime validation clearly rejected no seed,
  duplicate checkpoint names, `pixelDelta` -1 and 256, and ratio 1.1.
- Mask verification excluded a masked changed pixel from counts and redacted it
  to the checker colour `[43,50,47,255]` in the report image.

The generated three-checkpoint report was separately opened at 390 px. It had
one title, `lang=en`, one `h1`, and `main`; axe reported zero
serious/critical findings; ArrowRight and End moved its selected checkpoint
from Spawn to Gap to Goal; there were no console errors or horizontal overflow.

## Product and browser QA

Independent Playwright checks against the live HTTPS site covered 1440 px
desktop and 390 x 844 mobile:

- Normal state showed **Within tolerance**. Introducing a regression showed
  **Visual change found** and first divergence **02 · Gap**.
- The explicit tolerance control accepted both boundary values 0 and 80.
- Arrow/Home/End navigation selected the expected reel checkpoints. Clear
  trace displayed the designed empty state; Load sample trace restored the
  canvases and interaction.
- At 390 px there was no document horizontal overflow. The page uses its
  intended stacked evidence layout.
- Keyboard-only entry reaches the Skip to main content link first; it had a
  visible 3 px focus outline. Buttons, range input, tabs, empty-state recovery,
  and copy control expose native/labelled semantics. Reduced-motion mode left
  the comparator usable and its CSS removes transition/animation duration.
- Axe found zero serious or critical violations at both viewports. Each run had
  zero console errors and zero `pageerror` events.
- Request capture contained only `canvas-regression-reel.sociobot.in`; no
  third-party scripts, fonts, trackers, or runtime uploads were observed.
  Cookies, localStorage, and sessionStorage were empty. Source review likewise
  found no analytics, telemetry, beacon, account, or artifact-upload code.
- `/privacy/` and `/terms/` each returned 200 and semantic pages with one h1
  and a main landmark.

## PWA, live identity, headers, and performance

In a fresh mobile browser context, I waited for the service worker, reloaded to
obtain a controller, switched the context offline, reloaded, and successfully
introduced a regression. The result was **Visual change found** with no console
errors. The cache name was `canvas-reel-shell-c1203811c2c12a0c` and contained
the root, legal pages, favicon, both fingerprinted hero images, and current
JS/CSS assets. This is the prior failure's exact recovery path.

The live root SHA-256 exactly matches this candidate's production build:

```
index.html                                  870b00563fcc46be8acfbb5d4a12020ce156831aadecea4830bdfaf8061c4be2
sw.js                                       da77d300618ad9dd8cac6c7a83b1c0325f6c9b976f47370e4c8689011de24f55
assets/main-CryaYXxN.js                     660d4816e9e633bd85438feced15515aa36711c6c331871b88a388bfed209021
assets/styles-C00iEuao.css                  28c1f533e42effe809840c975cca4f3f50d59a2d122cb4e59f2964592dd935b7
instrument-reel-cac1b0aee306.webp           cac1b0aee30664503d36500827ceba505c61d941b02d75b4b3fa6be3f0bbecc6
instrument-reel-720-b94879569868.webp       b94879569868b5b1a745bc089133692c3feb5228c66a5476a5999e7c09a8055f
```

Live responses return `public, max-age=31536000, immutable` for fingerprinted
JS, CSS, and WebP assets, and `public, max-age=0, must-revalidate` for the
document and `/sw.js`. They also include HSTS, `Referrer-Policy:
strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.

Direct build sizes are 4.31 kB application JS, 12.13 kB CSS, 24.5 kB mobile
hero, and 97.3 kB desktop hero, all within the stated budgets. Lighthouse on
the live deployment measured mobile Performance 99 and Accessibility 100
(LCP 1.0 s, CLS 0, total transfer 34 KiB); desktop measured Performance 100
and Accessibility 100 (LCP 0.3 s, CLS 0, total transfer 105 KiB).

## Defects and observations

### P0/P1/P2 — none

No release-blocking defect was reproduced. In particular, the prior P1 offline
shell and P2 cache-policy defects are fixed in both the candidate build and the
live deployment.

### P3 — security hardening opportunity (non-blocking)

The live responses do not currently send `Content-Security-Policy` or
`Permissions-Policy`. Existing HSTS, referrer policy, nosniff, local-first
runtime behaviour, and absence of untrusted input keep this outside the brief's
release gate, but a restrictive CSP and an explicit permissions policy would be
worth adding in a future hardening pass.
