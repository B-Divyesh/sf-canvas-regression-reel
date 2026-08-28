# Canvas Regression Reel

Deterministic canvas checkpoints in; a reviewable regression reel out. Canvas
Regression Reel is a local-first npm library and CLI for solo browser-game
developers who need visual evidence from real input sequences—not another DOM
snapshot tool or a folder of manual screenshots.

It seeds the page before game code runs, replays keyboard and pointer actions,
captures only the selected canvas, compares PNG pixels with an explicit
tolerance, and writes a self-contained HTML report. It never uploads artifacts.

## Install

```sh
npm install --save-dev canvas-regression-reel playwright
npx playwright install chromium
```

## Usage

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

Create or intentionally replace baselines:

```sh
npx canvas-reel run reel.config.mjs --update
```

Then compare locally or in CI:

```sh
npx canvas-reel run reel.config.mjs
npx canvas-reel run reel.config.mjs --json
```

The command exits `0` when all checkpoints pass and `1` for a visual change,
missing baseline, or run error. `--json` prints one machine-readable result to
stdout. Open the configured report to inspect the first changed frame, baseline,
current render, diff, thresholds, and masked regions. Use `--help` for options.

### In-page recorder

The browser-safe `canvas-regression-reel/recorder` entry exports
`createRecorder()` for tools that need to collect a seeded pointer/keyboard
trace in the browser. `comparePng()`, `buildReport()`, `runReel()`, and all
config/result types are exported from the main Node entry for custom runners.

## Determinism contract

The runner installs a seeded `Math.random` and exposes the string at
`window.__CANVAS_REEL_SEED__` before navigation. A game with other sources of
entropy should provide a `setup(page, seed)` callback in its config. Animation
timing still belongs to the game: use fixed timesteps and explicit `wait`
actions. Masks exclude volatile or user-supplied rectangles from comparison and
redact those rectangles in the HTML report.

## Develop, test, and package

Requires Node.js 20+.

```sh
npm ci
npm test
npm run build       # library -> dist/, site -> dist/site/
npm run build:site  # documentation site only -> dist/site/
npm pack --dry-run
```

`npm run dev` starts the documentation and live comparison demo. The static
deployment root is `dist/site`.

## Privacy and security

There is no telemetry, account, cloud service, or network upload in the package
or site. Reports embed local frames as data URLs and may contain game imagery;
keep CI artifacts private when the game is private. Masks are applied to report
images as well as comparison. See the site privacy and terms pages.

## License

MIT. See [LICENSE](LICENSE). Changes are recorded in [CHANGELOG.md](CHANGELOG.md).
