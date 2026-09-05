# Independent verification 3 — FAIL

**Candidate implementation:** `140dfd18323e453650d8f32d009ec1853f05c323`
**Documentation / prior handoff:** `67255d6aa18b3b74a8739e0f86d4e0037d162c92`
**Live URL:** https://canvas-regression-reel.sociobot.in/
**Verified:** 2026-09-05

## Verdict

**FAIL — 1 finding, 0 untested claims.**

The deployed product, all 13 declared claim commands, the complete test suite,
the packed consumer artifact, and live desktop/phone flows pass. It cannot be
accepted because the README and handoff declare that `npm run lint` and `npm
run typecheck` pass directly after `npm ci`, but both commands fail in a clean
checkout until `npm run build` has generated `dist/`. This is a real
clean-setup quality-gate and documentation failure.

## First screen before scrolling

Fresh 1440 x 900 desktop and iPhone 13 contexts both showed:

- Job: **Find changed canvas frames**.
- Audience: solo browser-game developers who need visual evidence before they ship.
- First action: **Try it with sample data**. Its adjacent text says it opens a
  seeded three-frame comparison in a separate demo.

Both contexts had no horizontal overflow. Screenshots are
`/work/.evidence/qa-live-desktop-first.png` and
`/work/.evidence/qa-live-phone-first.png`.

## Finding

### F-01 — P2 — Documented clean lint/typecheck commands fail

From a fresh clone of documentation commit `67255d6`, after the documented
`npm ci` and before any build:

```text
$ npm run lint
site/demo.ts(1,34): error TS2307: Cannot find module
'canvas-regression-reel/browser' or its corresponding type declarations.
tests/browser/claims.spec.ts(8,34): error TS2307: Cannot find module
'../../dist/browser.js' or its corresponding type declarations.
tests/browser/claims.spec.ts(9,64): error TS2307: Cannot find module
'../../dist/index.js' or its corresponding type declarations.

$ npm run typecheck
# same three TS2307 errors
```

`README.md` instructs users to run these commands immediately after `npm ci`,
and the prior handoff says they passed from that clean setup. Both scripts are
currently identical `tsc --noEmit`; the compiler includes site and browser
claim sources that import generated `dist` declarations. `npm run build && npm
run lint` and `npm run build && npm run typecheck` pass, as does `npm test`
(which builds first), but that does not make the documented commands work from
a clean setup.

**Required repair:** make lint/typecheck independent of generated `dist`, or
make the scripts build their required declarations first and update the README
and handoff to the actual clean command order. Re-run this verification from a
new checkout afterwards.

## Clean checkout evidence

Used a new local clone, Node 22, and `npm ci` (94 packages; audit reported 0
vulnerabilities). Results:

| Command | Result |
| --- | --- |
| `npm ci` | PASS |
| `npm run lint` | **FAIL** — F-01 |
| `npm run typecheck` | **FAIL** — F-01 |
| `npm test` | PASS — build, 6 Vitest tests, 40 Playwright tests |
| `npm run test:consumer` | PASS — packed clean consumer |
| `npm run build` | PASS — creates `dist/` and `dist/site/` |
| `npm pack --dry-run` | PASS — 21.1 kB, 22 files |

The complete command output is at `/work/.evidence/qa-clean-core.log`.

All 13 commands in `.factory/claims.json` were invoked individually from the
clean clone. Each exited 0, and each id occurs in exactly one tagged test
source. Full output: `/work/.evidence/qa-clean-claims.log`.

| Claim ids | Result |
| --- | --- |
| seeded-replay; input-recorder; selected-canvas; pixel-tolerance | PASS |
| masked-report; first-divergence-report; cli-json-exits; no-upload | PASS |
| offline-demo; versioned-cache; sample-speed; demo-isolation; package-playground | PASS |

## Live product evidence

- The `/demo/?demo=1` sandbox opens populated. Its persistent label says
  **Demo — sample data, nothing is saved**. A regression changes the result to
  **Visual change found**, first divergence **02 · Gap**. Reset returns it to
  **Within tolerance**. An unrelated `real:qa-preserve` local-storage value
  remained `kept`; demo state used only
  `demo:canvas-regression-reel:state`.
- Normal, zero and maximum tolerance, empty trace, and restore paths behaved
  as designed with no console/page errors. The empty state names its recovery
  action. See `/work/.evidence/qa-live-demo-paths.json`.
- A fresh service-worker-controlled phone context reloaded offline (HTTP 200)
  and changed the sample to **Visual change found** with no errors. See
  `/work/.evidence/qa-live-offline.json`.
- Desktop and phone axe scans returned no violations. Keyboard Tab reaches the
  skip link first with a solid focus outline. At a 200% equivalent phone
  layout, the page had no horizontal overflow. Reduced-motion CSS reduces
  animation and transition durations.
- Sample runtime requests went only to
  `canvas-regression-reel.sociobot.in`; no third-party request was observed.
  The response sends the deployed CSP, Permissions Policy, nosniff, referrer
  policy, document revalidation policy, and immutable asset policy.
- `/privacy/`, `/terms/`, and `/demo/` return 200 with their correct titles,
  one h1, and one main. An unknown route returns the designed page with HTTP
  404. The expected browser console resource error for that deliberately
  requested 404 is not a product defect. All internal landing-page links
  returned 200.
- The local rebuilt `dist/site/index.html` and `sw.js` SHA-256 values exactly
  match live: `0577c7dd40ab8bf12dee9030f916cfaaa1436db15dacdbd07129c687f924df36`
  and `2b4d052c916f01d074e3e96a6e8fc2100858fd3863e64b4662d297aec89fb546`.

## Earlier findings disposition

| Earlier item | Current disposition |
| --- | --- |
| F-01, unavailable registry install | Public instructions now honestly use the local tarball. `npm view canvas-regression-reel@0.1.0` still returns E404, so factory-managed publication remains an external next step, not a false current install claim. |
| F-02, no isolated sample | Fixed: package-backed `/demo/`, persistent banner, reset, separate `demo:` storage, and Start for real link verified. |
| F-03, missing claim registry/tests | Fixed: 13 claims, exactly one tagged source test per id, all 13 commands passed. |
| F-04, no designed 404 | Fixed: designed HTTP 404 verified. |
| F-05, metadata/site structure | Fixed: route titles, metadata, header/footer, legal pages, and links verified. |
| F-06, no CSP/Permissions Policy | Fixed: both live headers verified. |
| F-07, first-screen/plain words | Fixed: job, audience, sample action, adjacent outcome text, facts, and copy audit present. |
| F-08, phone/200% resize | Fixed: phone and 200%-equivalent layout have no overflow; controls are usable. |
| Earlier offline inert shell/cache policy | Fixed: live offline interaction and versioned cache/immutable asset claim passed. |
| Earlier P3 security hardening | Fixed by the deployed CSP and Permissions Policy. |

## Scope notes

This is a static npm library and documentation/demo site. It has no backend,
tenant state, database, billing, AI feature, health endpoint, or live API.
Tenant isolation, restart persistence, and 429/Retry-After checks do not
apply. The npm registry package is still unpublished; per the library policy,
publication is factory-managed and was not attempted.
