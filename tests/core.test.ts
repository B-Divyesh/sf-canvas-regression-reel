import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'
import { comparePng, createRecorder, defineConfig } from '../src/index.js'

function png(colors: number[][], width = colors.length): Buffer {
  const image = new PNG({ width, height: colors.length / width })
  colors.forEach((color, index) => {
    image.data.set([...color, 255], index * 4)
  })
  return PNG.sync.write(image)
}

describe('comparePng', () => {
  it('passes channel differences at the documented tolerance', () => {
    const baseline = png([[10, 20, 30], [100, 100, 100]])
    const current = png([[30, 20, 30], [100, 100, 100]])
    const result = comparePng(baseline, current, { pixelDelta: 24, changedPixelRatio: 0 })
    expect(result.pass).toBe(true)
    expect(result.changedPixels).toBe(0)
  })

  it('reports changes and excludes masks from both counts', () => {
    const baseline = png([[0, 0, 0], [0, 0, 0]])
    const current = png([[255, 0, 0], [255, 0, 0]])
    const result = comparePng(baseline, current, { pixelDelta: 24, changedPixelRatio: 0 }, [{ x: 0, y: 0, width: 1, height: 1 }])
    expect(result.pass).toBe(false)
    expect(result.changedPixels).toBe(1)
    expect(result.comparedPixels).toBe(1)
  })

  it('explains a canvas size change', () => {
    const result = comparePng(png([[0, 0, 0]]), png([[0, 0, 0], [0, 0, 0]]), { pixelDelta: 24, changedPixelRatio: 0 })
    expect(result.pass).toBe(false)
    expect(result.message).toContain('size changed')
  })
})

it('accepts the README config surface', () => {
  expect(defineConfig({
    url: 'http://127.0.0.1:4173', canvas: '#game', seed: 'release-42',
    checkpoints: [{ name: 'spawn' }, { name: 'jump-apex', actions: [{ type: 'wait', ms: 280 }] }],
  }).checkpoints).toHaveLength(2)
})

it('records canvas-relative pointer and keyboard input', () => {
  const listeners = new Map<string, EventListener>()
  const windowListeners = new Map<string, EventListener>()
  const canvas = {
    width: 200, height: 100,
    addEventListener: (name: string, fn: EventListener) => listeners.set(name, fn),
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 400, height: 200 }),
  } as unknown as HTMLCanvasElement
  const originalWindow = globalThis.window
  Object.assign(globalThis, { window: { addEventListener: (name: string, fn: EventListener) => windowListeners.set(name, fn), removeEventListener: () => {} } })
  let time = 100
  const recorder = createRecorder({ canvas, seed: 'abc', now: () => time })
  recorder.start(); time = 112
  listeners.get('pointerdown')?.({ type: 'pointerdown', clientX: 210, clientY: 120, button: 0 } as unknown as Event)
  windowListeners.get('keydown')?.({ type: 'keydown', key: 'ArrowRight', repeat: false } as unknown as Event)
  const trace = recorder.stop()
  expect(trace.actions).toMatchObject([{ type: 'pointer', x: 100, y: 50, atMs: 12 }, { type: 'key', key: 'ArrowRight', atMs: 12 }])
  Object.assign(globalThis, { window: originalWindow })
})
