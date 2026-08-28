import type { RecordedTrace, ReelAction } from './types.js'

export interface Recorder {
  start(): void
  stop(): RecordedTrace
  clear(): void
}

export interface RecorderOptions {
  canvas: HTMLCanvasElement
  seed: string
  now?: () => number
}

/** Collect canvas-relative pointer and keyboard input for a repeatable trace. */
export function createRecorder(options: RecorderOptions): Recorder {
  const now = options.now ?? (() => performance.now())
  let startedAt = 0
  let running = false
  let actions: RecordedTrace['actions'] = []

  const record = (action: ReelAction) => {
    if (!running) return
    actions.push({ ...action, atMs: Math.round(now() - startedAt) })
  }
  const pointer = (event: PointerEvent) => {
    const bounds = options.canvas.getBoundingClientRect()
    const x = Math.round(((event.clientX - bounds.left) / bounds.width) * options.canvas.width)
    const y = Math.round(((event.clientY - bounds.top) / bounds.height) * options.canvas.height)
    const action = event.type === 'pointerdown' ? 'down' : event.type === 'pointerup' ? 'up' : 'move'
    record({ type: 'pointer', x, y, action, button: event.button === 1 ? 'middle' : event.button === 2 ? 'right' : 'left' })
  }
  const key = (event: KeyboardEvent) => {
    if (event.repeat) return
    record({ type: 'key', key: event.key, action: event.type === 'keydown' ? 'down' : 'up' })
  }

  return {
    start() {
      if (running) return
      running = true
      startedAt = now()
      options.canvas.addEventListener('pointerdown', pointer)
      options.canvas.addEventListener('pointerup', pointer)
      options.canvas.addEventListener('pointermove', pointer)
      window.addEventListener('keydown', key)
      window.addEventListener('keyup', key)
    },
    stop() {
      running = false
      options.canvas.removeEventListener('pointerdown', pointer)
      options.canvas.removeEventListener('pointerup', pointer)
      options.canvas.removeEventListener('pointermove', pointer)
      window.removeEventListener('keydown', key)
      window.removeEventListener('keyup', key)
      return {
        version: 1,
        seed: options.seed,
        viewport: { width: options.canvas.width, height: options.canvas.height },
        actions: [...actions],
      }
    },
    clear() {
      actions = []
      startedAt = now()
    },
  }
}
