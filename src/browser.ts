/** Browser-safe pixel comparison for in-page playgrounds and canvas tools. */
export interface BrowserRect {
  x: number
  y: number
  width: number
  height: number
}

export interface BrowserComparison {
  changedPixels: number
  comparedPixels: number
  changedPixelRatio: number
  diff: Uint8ClampedArray
}

function masked(x: number, y: number, masks: BrowserRect[]) {
  return masks.some((mask) => x >= mask.x && y >= mask.y && x < mask.x + mask.width && y < mask.y + mask.height)
}

/**
 * Compare two RGBA frame buffers with the same explicit per-channel threshold.
 * Masked pixels are omitted from the count and marked in the returned diff.
 */
export function compareFrameData(
  baseline: Uint8ClampedArray,
  current: Uint8ClampedArray,
  width: number,
  height: number,
  pixelDelta: number,
  masks: BrowserRect[] = [],
): BrowserComparison {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error('width and height must be positive integers.')
  if (!Number.isFinite(pixelDelta) || pixelDelta < 0 || pixelDelta > 255) throw new Error('pixelDelta must be between 0 and 255.')
  const expected = width * height * 4
  if (baseline.length !== expected || current.length !== expected) throw new Error('Frame buffers must match width and height.')
  const diff = new Uint8ClampedArray(expected)
  let changedPixels = 0
  let comparedPixels = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      if (masked(x, y, masks)) {
        const light = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0
        diff.set(light ? [73, 80, 76, 255] : [40, 48, 44, 255], offset)
        continue
      }
      comparedPixels += 1
      const delta = Math.max(
        Math.abs(baseline[offset] - current[offset]),
        Math.abs(baseline[offset + 1] - current[offset + 1]),
        Math.abs(baseline[offset + 2] - current[offset + 2]),
        Math.abs(baseline[offset + 3] - current[offset + 3]),
      )
      const changed = delta > pixelDelta
      if (changed) changedPixels += 1
      const grey = Math.round(current[offset] * 0.21 + current[offset + 1] * 0.72 + current[offset + 2] * 0.07)
      diff.set(changed ? [225, 62, 40, 255] : [grey, grey, grey, 90], offset)
    }
  }
  return { changedPixels, comparedPixels, changedPixelRatio: comparedPixels ? changedPixels / comparedPixels : 0, diff }
}
