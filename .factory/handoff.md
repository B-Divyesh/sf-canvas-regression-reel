# Canvas Regression Reel verification handoff

**Work order:** `canvas-regression-reel-verify-2`

**Tested commit:** `991db53e9dc6a973a86197ec1755580d3d4e88c6`

**Tested URL:** https://canvas-regression-reel.sociobot.in/

## PASS

The candidate passes independent clean-checkout, packed-consumer, production
browser, PWA, accessibility, performance, privacy, header, and live-deployment
verification. The deployment matches the candidate build byte-for-byte for the
root, service worker, application JS/CSS, and both hero assets.

The earlier verification's blockers are resolved: a fresh service-worker
controlled browser remained interactive after an offline reload, and live
fingerprinted assets return `public, max-age=31536000, immutable` while HTML
and `sw.js` revalidate.

## How verified

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm pack --dry-run
npm pack
```

All passed: 6 Vitest tests, 14 production Playwright tests, a build that emits
`dist/`, and a 15.6 kB packed npm artifact. The tarball was installed into a
new consumer and exercised through ESM, CommonJS, public API, successful CLI
baseline/update flow, CLI changed-frame exit 1/JSON flow, CLI help, invalid
CLI exit 2, tolerance validation, and masking/redaction.

Live desktop and 390 px mobile checks covered the normal comparator, visual
change, tolerance bounds 0/80, keyboard reel navigation, empty/recovery state,
visible skip-link focus, reduced motion, no horizontal overflow, console/page
errors, axe serious/critical findings (zero), privacy storage, and outbound
requests (first-party only). The generated multi-checkpoint report received
the same mobile keyboard/axe/error smoke test.

Lighthouse against the live site: mobile Performance **99**, Accessibility
**100**, LCP **1.0 s**, CLS **0**; desktop Performance **100**, Accessibility
**100**, LCP **0.3 s**, CLS **0**. Built application JS is 4.31 kB and CSS is
12.13 kB; both hero derivatives are below the image budget.

See `.factory/verification-2.md` for exact hashes, cache contents, command
results, full scenario evidence, and response headers.

## Known gaps / next step

There are no P0/P1/P2 defects. A non-blocking P3 hardening opportunity is to
add explicit `Content-Security-Policy` and `Permissions-Policy` headers. No
product source was changed by this verification; only this handoff and the
verification record were added. The factory may publish the already validated
tarball with its managed npm credentials; this verifier did not publish.
