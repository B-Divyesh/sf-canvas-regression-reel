import type { Page } from 'playwright'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Tolerance {
  /** Maximum per-channel difference (0–255) before a pixel is changed. */
  pixelDelta: number
  /** Maximum fraction of comparable pixels that may change (0–1). */
  changedPixelRatio: number
}

export type ReelAction =
  | { type: 'wait'; ms: number }
  | { type: 'key'; key: string; action: 'down' | 'up' | 'press' }
  | {
      type: 'pointer'
      x: number
      y: number
      action: 'move' | 'down' | 'up' | 'click'
      button?: 'left' | 'middle' | 'right'
    }

export interface Checkpoint {
  name: string
  actions?: ReelAction[]
  masks?: Rect[]
}

export interface ReelConfig {
  url: string
  canvas: string
  seed: string
  viewport?: { width: number; height: number }
  baselineDir?: string
  outputDir?: string
  report?: string
  tolerance?: Partial<Tolerance>
  checkpoints: Checkpoint[]
  /** Runs after navigation. Use this for engine-specific seed/readiness hooks. */
  setup?: (page: Page, seed: string) => Promise<void> | void
}

export type CheckpointStatus = 'pass' | 'changed' | 'missing' | 'updated' | 'error'

export interface CheckpointResult {
  name: string
  status: CheckpointStatus
  changedPixels: number
  comparedPixels: number
  changedPixelRatio: number
  width: number
  height: number
  masks: Rect[]
  baselinePath?: string
  currentPath?: string
  diffPath?: string
  message?: string
}

export interface ReelRunResult {
  ok: boolean
  seed: string
  reportPath: string
  firstDivergence: string | null
  durationMs: number
  tolerance: Tolerance
  checkpoints: CheckpointResult[]
}

export interface RecordedTrace {
  version: 1
  seed: string
  viewport: { width: number; height: number }
  actions: Array<ReelAction & { atMs: number }>
}
