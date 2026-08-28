import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { Browser, Page } from 'playwright'
import { buildReport } from './report.js'
import { comparePng } from './compare.js'
import type { CheckpointResult, ReelAction, ReelConfig, ReelRunResult, Tolerance } from './types.js'

const defaults: Tolerance = { pixelDelta: 24, changedPixelRatio: 0.001 }

export function defineConfig(config: ReelConfig): ReelConfig {
  return config
}

function validate(config: ReelConfig): void {
  if (!config.url || !config.canvas || !config.seed) throw new Error('Config requires url, canvas, and seed.')
  if (!config.checkpoints?.length) throw new Error('Config requires at least one checkpoint.')
  const names = new Set<string>()
  for (const checkpoint of config.checkpoints) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(checkpoint.name)) {
      throw new Error(`Checkpoint “${checkpoint.name}” must use letters, numbers, dashes, or underscores.`)
    }
    if (names.has(checkpoint.name)) throw new Error(`Duplicate checkpoint “${checkpoint.name}”.`)
    names.add(checkpoint.name)
  }
}

async function act(page: Page, canvas: string, action: ReelAction): Promise<void> {
  if (action.type === 'wait') {
    await page.waitForTimeout(action.ms)
  } else if (action.type === 'key') {
    if (action.action === 'down') await page.keyboard.down(action.key)
    else if (action.action === 'up') await page.keyboard.up(action.key)
    else await page.keyboard.press(action.key)
  } else {
    const box = await page.locator(canvas).first().boundingBox()
    if (!box) throw new Error(`Canvas “${canvas}” has no visible bounds.`)
    const x = box.x + (action.x / Number(await page.locator(canvas).first().getAttribute('width') || box.width)) * box.width
    const y = box.y + (action.y / Number(await page.locator(canvas).first().getAttribute('height') || box.height)) * box.height
    if (action.action === 'move') await page.mouse.move(x, y)
    else if (action.action === 'down') { await page.mouse.move(x, y); await page.mouse.down({ button: action.button }) }
    else if (action.action === 'up') { await page.mouse.move(x, y); await page.mouse.up({ button: action.button }) }
    else await page.mouse.click(x, y, { button: action.button })
  }
}

export async function runReel(config: ReelConfig, options: { update?: boolean; cwd?: string } = {}): Promise<ReelRunResult> {
  validate(config)
  const started = Date.now()
  const cwd = options.cwd ?? process.cwd()
  const baselineDir = resolve(cwd, config.baselineDir ?? '.reel/baseline')
  const outputDir = resolve(cwd, config.outputDir ?? '.reel/run')
  const reportPath = resolve(cwd, config.report ?? '.reel/report.html')
  const tolerance = { ...defaults, ...config.tolerance }
  if (tolerance.pixelDelta < 0 || tolerance.pixelDelta > 255) throw new Error('pixelDelta must be between 0 and 255.')
  if (tolerance.changedPixelRatio < 0 || tolerance.changedPixelRatio > 1) throw new Error('changedPixelRatio must be between 0 and 1.')
  await Promise.all([mkdir(baselineDir, { recursive: true }), mkdir(outputDir, { recursive: true }), mkdir(dirname(reportPath), { recursive: true })])

  let browser: Browser | undefined
  const checkpoints: CheckpointResult[] = []
  try {
    let chromium
    try {
      ;({ chromium } = await import('playwright'))
    } catch {
      throw new Error('Playwright is required to run a reel. Install it with: npm install --save-dev playwright')
    }
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: config.viewport ?? { width: 960, height: 540 }, deviceScaleFactor: 1 })
    await page.addInitScript((seed: string) => {
      let h = 2166136261
      for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
      let state = h >>> 0
      Math.random = () => {
        state += 0x6d2b79f5
        let t = state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
      Object.defineProperty(window, '__CANVAS_REEL_SEED__', { value: seed, configurable: false })
    }, config.seed)
    await page.goto(config.url, { waitUntil: 'load' })
    await config.setup?.(page, config.seed)
    const canvas = page.locator(config.canvas).first()
    await canvas.waitFor({ state: 'visible' })

    for (const checkpoint of config.checkpoints) {
      for (const action of checkpoint.actions ?? []) await act(page, config.canvas, action)
      const currentPath = resolve(outputDir, `${checkpoint.name}.png`)
      const baselinePath = resolve(baselineDir, `${checkpoint.name}.png`)
      await canvas.screenshot({ path: currentPath, type: 'png' })
      const current = await readFile(currentPath)
      const base: CheckpointResult = { name: checkpoint.name, status: 'pass', changedPixels: 0, comparedPixels: 0, changedPixelRatio: 0, width: 0, height: 0, masks: checkpoint.masks ?? [], baselinePath, currentPath }
      if (options.update) {
        await writeFile(baselinePath, current)
        checkpoints.push({ ...base, status: 'updated', message: 'Baseline written intentionally.' })
        continue
      }
      let baseline: Buffer
      try { baseline = await readFile(baselinePath) } catch {
        checkpoints.push({ ...base, status: 'missing', message: 'No baseline exists. Run again with --update after reviewing this frame.' })
        continue
      }
      const comparison = comparePng(baseline, current, tolerance, checkpoint.masks)
      const diffPath = resolve(outputDir, `${checkpoint.name}.diff.png`)
      await writeFile(diffPath, comparison.diff)
      checkpoints.push({
        ...base,
        status: comparison.pass ? 'pass' : 'changed',
        changedPixels: comparison.changedPixels,
        comparedPixels: comparison.comparedPixels,
        changedPixelRatio: comparison.changedPixelRatio,
        width: comparison.width,
        height: comparison.height,
        diffPath,
        message: comparison.message,
      })
    }
  } catch (error) {
    checkpoints.push({ name: 'run-error', status: 'error', changedPixels: 0, comparedPixels: 0, changedPixelRatio: 0, width: 0, height: 0, masks: [], message: error instanceof Error ? error.message : String(error) })
  } finally {
    await browser?.close()
  }
  const failed = checkpoints.find((item) => ['changed', 'missing', 'error'].includes(item.status))
  const result: ReelRunResult = {
    ok: !failed,
    seed: config.seed,
    reportPath,
    firstDivergence: failed?.name ?? null,
    durationMs: Date.now() - started,
    tolerance,
    checkpoints,
  }
  await writeFile(reportPath, await buildReport(result), 'utf8')
  return result
}
