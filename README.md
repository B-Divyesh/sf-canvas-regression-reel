# Canvas Regression Reel

Canvas Regression Reel finds the first changed browser-game canvas frame. It is
for solo browser-game developers who need visual evidence before they ship.

The runner replays a seeded checkpoint list in Chromium, captures the canvas
selector you choose, compares pixels with an explicit per-channel tolerance,
and writes one self-contained HTML report. It is local-first: the package has
no account, telemetry, cloud service, or artifact upload.

## Try the sample

Open [the sample demo](https://canvas-regression-reel.sociobot.in/demo/?demo=1).
It uses a seeded three-checkpoint canvas run in a `demo:` browser-storage
namespace. **Reset demo** discards its sample state. The demo works offline
after its first visit.

## Install from this repository

The public npm registry package is not released yet. The factory-managed npm
publish is the remaining external release dependency. Until it is released,
build and install the local tarball:

```sh
npm ci
npm run build
npm pack
npm install --save-dev ./canvas-regression-reel-0.1.0.tgz playwright
npx playwright install chromium
```

## Use the runner

Create `reel.config.mjs`:

```js
import { defineConfig } from 'canvas-regression-reel'

export default defineConfig({
  url: 'http://127.0.0.1:4173',
  canvas: '#game',
  seed: 'release-42',
  viewport: { width: 960, height: 540 },
  baselineDir: '.reel/baseline',
  outputDir: '.reel/run',
  report: '.reel/report.html',
  tolerance: { pixelDelta: 24, changedPixelRatio: 0.001 },
  checkpoints: [
    { name: 'spawn' },
    {
      name: 'jump-apex',
      actions: [
        { type: 'key', key: 'ArrowRight', action: 'down' },
        { type: 'key', key: ' ', action: 'press' },
        { type: 'wait', ms: 280 },
        { type: 'key', key: 'ArrowRight', action: 'up' }
      ],
      masks: [{ x: 820, y: 12, width: 120, height: 44 }]
    }
  ]
})
```

Create approved baselines only after reviewing them:

```sh
npx canvas-reel run reel.config.mjs --update
```

Run the comparison in a local terminal or CI:

```sh
npx canvas-reel run reel.config.mjs
npx canvas-reel run reel.config.mjs --json
```

The command exits `0` when every checkpoint passes, `1` for a changed or
missing checkpoint or run error, and `2` for an invalid command or unloaded
config. `--json` writes one machine-readable result to standard output.

The report names the first changed checkpoint and embeds baseline, current, and
difference images as data URLs. Masks are excluded from the comparison and
redacted in report images.

## Browser recorder and playground

`canvas-regression-reel/recorder` exports `createRecorder()` for recording
canvas-relative pointer and keyboard actions. The sample playground uses the
browser-safe `canvas-regression-reel/browser` entry to compare its displayed
RGBA frame data.

The runner installs a seeded `Math.random` and provides the seed at
`window.__CANVAS_REEL_SEED__` before navigation. Games with other entropy
sources should use the `setup(page, seed)` callback and fixed timesteps.

## Develop and verify

Node.js 20 or newer is required.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:consumer
npm run build
npm pack --dry-run
```

Every public product claim is listed in `.factory/claims.json`. Run one claim
from a clean checkout with its documented command, for example:

```sh
npm run test:claims -- --grep @claim:offline-demo
```

`npm run build` creates the library in `dist/` and the static site in
`dist/site/`. Deploy that site directory with its generated
`staticwebapp.config.json`. It sets immutable caching for fingerprinted assets,
revalidates documents and the service worker, includes CSP and Permissions
Policy headers, and returns a designed 404 page.

## License

MIT. See [LICENSE](LICENSE). Changes are recorded in [CHANGELOG.md](CHANGELOG.md).
