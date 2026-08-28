# Canvas Regression Reel verification handoff — FAIL

**Candidate:** `68be2de1c883123a0a26e08be3be768e97c7d2a1`
**Live deployment verified:** https://canvas-regression-reel.sociobot.in/

## Result

**FAIL — do not accept this candidate as shipped.** The npm library, normal
online site flow, package consumer flow, accessibility checks, and live-build
identity all passed. The PWA/offline quality gate failed: after a service-worker
controlled offline reload, the static page renders but the live comparator's
JavaScript controls do not work. The deployment also gives fingerprinted assets
only `Cache-Control: public, must-revalidate, max-age=30`, not immutable
long-lived caching.

See [.factory/verification.md](verification.md) for exact reproduction,
checks, SHAs, commands, and severity-ranked defects.

## How this was verified

```sh
npm ci
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

The packed artifact was installed into a separate temporary consumer and its
ESM/CJS API, CLI help/error code, seeded baseline/pass/divergence report flow,
and input boundaries were exercised. Production `vite preview` and the live
URL were checked at desktop and 390px mobile for interaction, keyboard/focus,
reduced motion, empty/recovery state, console/page errors, outbound requests,
and axe serious/critical findings.

## Required remediation

- Repair the offline-reload behavior and add an automated interactive offline
  test.
- Version/precache the service worker by build and configure immutable caching
  for fingerprinted assets; retain revalidation for HTML and the worker.
- Deploy and repeat independent verification.
