# Canvas Regression Reel demo sandbox

## URL

Open `https://canvas-regression-reel.sociobot.in/demo/?demo=1` or use the
landing-page **Try it with sample data** action.

## Sample data

The playground draws three original 480 × 270 Canvas 2D checkpoints from the
seed `release-42`: Spawn, Gap, and Goal. Introducing the sample regression
changes Gap first. The page compares the sample frame buffers through the
package's `canvas-regression-reel/browser` entry.

## Isolation and reset

Demo state is stored only at `demo:canvas-regression-reel:state` in browser
local storage. The demo does not read or write non-`demo:` keys. **Reset demo**
restores Spawn, tolerance 24, and the unchanged sample; **Start for real**
returns to the local package setup instructions. No sample game frame or report
is uploaded.

## Offline

After the first visit, the generated service worker precaches the demo shell
and assets. A fresh controlled browser context can reload the demo offline and
introduce the supplied regression.
