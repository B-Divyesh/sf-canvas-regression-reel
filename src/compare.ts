import { PNG } from 'pngjs'
import type { Rect, Tolerance } from './types.js'

export interface PngComparison {
  pass: boolean
  changedPixels: number
  comparedPixels: number
  changedPixelRatio: number
  width: number
  height: number
  diff: Buffer
  message?: string
}

function isMasked(x: number, y: number, masks: Rect[]): boolean {
  return masks.some((mask) =>
    x >= mask.x && y >= mask.y && x < mask.x + mask.width && y < mask.y + mask.height,
  )
}

export function redactPng(input: Buffer, masks: Rect[]): Buffer {
  if (!masks.length) return input
  const png = PNG.sync.read(input)
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (!isMasked(x, y, masks)) continue
      const i = (y * png.width + x) * 4
      const light = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0
      png.data[i] = light ? 43 : 24
      png.data[i + 1] = light ? 50 : 32
      png.data[i + 2] = light ? 47 : 30
      png.data[i + 3] = 255
    }
  }
  return PNG.sync.write(png)
}

export function comparePng(
  baselineBuffer: Buffer,
  currentBuffer: Buffer,
  tolerance: Tolerance,
  masks: Rect[] = [],
): PngComparison {
  const baseline = PNG.sync.read(baselineBuffer)
  const current = PNG.sync.read(currentBuffer)

  if (baseline.width !== current.width || baseline.height !== current.height) {
    const diff = new PNG({ width: current.width, height: current.height })
    for (let i = 0; i < current.data.length; i += 4) {
      diff.data[i] = 189
      diff.data[i + 1] = Math.round(current.data[i + 1] * 0.2)
      diff.data[i + 2] = Math.round(current.data[i + 2] * 0.2)
      diff.data[i + 3] = 255
    }
    return {
      pass: false,
      changedPixels: current.width * current.height,
      comparedPixels: current.width * current.height,
      changedPixelRatio: 1,
      width: current.width,
      height: current.height,
      diff: PNG.sync.write(diff),
      message: `Canvas size changed from ${baseline.width}×${baseline.height} to ${current.width}×${current.height}.`,
    }
  }

  const diff = new PNG({ width: current.width, height: current.height })
  let changedPixels = 0
  let comparedPixels = 0
  for (let y = 0; y < current.height; y += 1) {
    for (let x = 0; x < current.width; x += 1) {
      const i = (y * current.width + x) * 4
      if (isMasked(x, y, masks)) {
        const light = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0
        diff.data[i] = light ? 73 : 40
        diff.data[i + 1] = light ? 80 : 48
        diff.data[i + 2] = light ? 76 : 44
        diff.data[i + 3] = 255
        continue
      }

      comparedPixels += 1
      const delta = Math.max(
        Math.abs(baseline.data[i] - current.data[i]),
        Math.abs(baseline.data[i + 1] - current.data[i + 1]),
        Math.abs(baseline.data[i + 2] - current.data[i + 2]),
        Math.abs(baseline.data[i + 3] - current.data[i + 3]),
      )
      const changed = delta > tolerance.pixelDelta
      if (changed) changedPixels += 1
      const grey = Math.round(
        current.data[i] * 0.21 + current.data[i + 1] * 0.72 + current.data[i + 2] * 0.07,
      )
      diff.data[i] = changed ? 225 : grey
      diff.data[i + 1] = changed ? 62 : grey
      diff.data[i + 2] = changed ? 40 : grey
      diff.data[i + 3] = changed ? 255 : 90
    }
  }
  const changedPixelRatio = comparedPixels === 0 ? 0 : changedPixels / comparedPixels
  return {
    pass: changedPixelRatio <= tolerance.changedPixelRatio,
    changedPixels,
    comparedPixels,
    changedPixelRatio,
    width: current.width,
    height: current.height,
    diff: PNG.sync.write(diff),
  }
}
