# Canvas Regression Reel — visual thesis

## Direction

**Mid-century instrument panel.** A regression run should feel like reading a
purpose-built bench instrument: calm cream enamel, near-black bezels, measured
ticks, and one unmistakable signal lamp. This suits canvas developers because
the report is evidence, not decoration; every visual treatment helps locate a
frame, read a tolerance, or distinguish expected from changed output.

The treatment is intentionally single-mode. The warm, opaque workbench surface
is part of the evidence-review metaphor and gives screenshots one stable viewing
environment regardless of OS theme.

## Tokens

- `--paper: #f1ead8` — warm calibration-card background.
- `--panel: #ded2b8` and `--panel-hi: #faf4e5` — enamel surfaces.
- `--ink: #18201e` — charcoal-green primary text (12.9:1 on paper).
- `--muted: #515a55` — secondary labels (5.8:1 on paper).
- `--bezel: #222a27` — dark optical surround.
- `--signal: #bd3f2d` — vermilion change lamp; always paired with a label/icon.
- `--go: #17624e` — stable/pass lamp; always paired with a label/icon.
- `--amber: #8b5b09` — warnings and unreviewed baselines.
- `--focus: #006d77` — 3px focus ring with offset.

## Type

Headings use **Arial Narrow / Franklin Gothic Medium / system sans** in compact,
uppercase instrument labels. Body and code use the system UI and ui-monospace
stacks. No font files or third-party requests are needed. Numeric readouts use
tabular figures. Scale: 14, 16, 20, 28, and fluid 48–76px; body never drops
below 16px.

## Spacing and shape

An 8px grid with 4px for fine alignment. Sections breathe at 64–112px; control
groups at 16–24px. Corners are restrained (2–12px), with mechanical borders and
offset shadows instead of generic floating cards. Minimum targets are 44px.

## Interaction grammar

Controls act like physical selectors: an inset resting state, 2px downward
travel when pressed, and a high-contrast label. The live demo advances through
a horizontal checkpoint reel; arrow keys move the selector and status text is
announced. Comparison overlays are direct, adjacent evidence rather than modal
chrome. Code samples have a labeled copy switch and immediate status feedback.

## Motion

State changes use a 180ms opacity/transform settle, matching a damped gauge
needle. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms,
smooth scrolling, and transitions are removed; state remains clear through
labels, shape, and contrast.

## Responsive intent

Desktop shows baseline/current evidence side by side. At 390px it stacks the
frames, makes checkpoint selectors horizontally scrollable, and drops ornamental
tick marks—not instructions, status, tolerance, or actions. Safe-area padding is
included.

## Original asset plan and provenance

- `site/public/instrument-reel.webp`: generated specifically for this product
  with the factory image deployment via `/opt/fleet/lib/gen-image.sh`, then
  resized/compressed locally to WebP. It is a text-free editorial still life of
  a 1950s canvas diagnostic instrument, used to establish the product world.
  Prompt: “Use case: stylized-concept. Asset type: wide landing-page hero
  illustration. Primary request: an original mid-century industrial instrument
  panel used to inspect three sequential browser-game frames. Scene: cream
  enamel workbench machine with three square optical viewfinders, calibration
  ticks, one small vermilion signal lamp, tactile black knobs, and paper trace
  tape. Style: refined screen-printed editorial illustration, subtle ink grain,
  precise mechanical geometry, authentic 1950s scientific equipment, not
  photorealistic. Composition: wide landscape, instrument weighted to the right,
  generous calm negative space on the left, straight-on slight overhead view.
  Palette: warm ivory, charcoal green, muted brass, vermilion accent. Lighting:
  soft studio light, confident and quiet. Constraints: no people, no words,
  letters, numbers, logos, gradients, UI screenshots, watermark, or illegible
  pseudo-text.” Deployment metadata is stored next to the source PNG during
  generation. Rights: original generated asset created for this repository.
- The production build fingerprints both responsive WebP derivatives before
  deployment, so their long-lived immutable cache entries can never point at a
  later image revision.
- `site/public/social-card.jpg` and `site/public/apple-touch-icon.png` are
  local crops of that same original generated instrument illustration. They
  carry no required text and provide the required social and device-preview
  assets without introducing a second asset source.
- Demo game frames are rendered at runtime from original Canvas 2D code. Icons
  are hand-authored inline SVG with `currentColor`; no external icon set.
