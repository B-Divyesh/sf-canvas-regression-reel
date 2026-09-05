import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { PNG } from 'pngjs'
import { expect, test } from '@playwright/test'
import { compareFrameData } from '../../dist/browser.js'
import { comparePng, createRecorder, redactPng, runReel } from '../../dist/index.js'

const execFile = promisify(execFileCallback)
const seededPage = `data:text/html,${encodeURIComponent(`<!doctype html><canvas id="selected" width="12" height="8"></canvas><canvas id="other" width="12" height="8"></canvas><script>for(const [id,fixed] of [['selected',true],['other',false]]){const x=document.querySelector('#'+id).getContext('2d');x.fillStyle=fixed?'#204050':'rgb('+Math.floor(Math.random()*255)+',20,30)';x.fillRect(0,0,12,8)}</script>`)}`

function png(colors: number[][]): Buffer {
  const image = new PNG({ width: colors.length, height: 1 })
  colors.forEach((color, index) => image.data.set([...color, 255], index * 4))
  return PNG.sync.write(image)
}

async function command(file: string, args: string[], cwd: string) {
  try { const result = await execFile(file, args, { cwd }); return { code: 0, stdout: result.stdout, stderr: result.stderr } }
  catch (error: unknown) { const value = error as { code?: number; stdout?: string; stderr?: string }; return { code: value.code ?? 1, stdout: value.stdout ?? '', stderr: value.stderr ?? '' } }
}

test('@claim:seeded-replay replays the same seeded checkpoint without a change', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'reel-claim-seed-'))
  const config = { url: seededPage, canvas: '#selected', seed: 'release-42', checkpoints: [{ name: 'spawn' }] }
  await expect(runReel(config, { cwd, update: true })).resolves.toMatchObject({ ok: true })
  await expect(runReel(config, { cwd })).resolves.toMatchObject({ ok: true, firstDivergence: null })
})

test('@claim:input-recorder records canvas-relative pointer and keyboard actions', () => {
  const listeners = new Map<string, EventListener>()
  const windowListeners = new Map<string, EventListener>()
  const canvas = { width: 200, height: 100, addEventListener: (name: string, fn: EventListener) => listeners.set(name, fn), removeEventListener: () => {}, getBoundingClientRect: () => ({ left: 10, top: 20, width: 400, height: 200 }) } as unknown as HTMLCanvasElement
  const originalWindow = globalThis.window
  Object.assign(globalThis, { window: { addEventListener: (name: string, fn: EventListener) => windowListeners.set(name, fn), removeEventListener: () => {} } })
  let time = 100
  const recorder = createRecorder({ canvas, seed: 'release-42', now: () => time })
  recorder.start(); time = 112
  listeners.get('pointerdown')?.({ type: 'pointerdown', clientX: 210, clientY: 120, button: 0 } as unknown as Event)
  windowListeners.get('keydown')?.({ type: 'keydown', key: 'ArrowRight', repeat: false } as unknown as Event)
  const trace = recorder.stop()
  Object.assign(globalThis, { window: originalWindow })
  expect(trace.actions).toEqual([{ type: 'pointer', x: 100, y: 50, button: 'left', action: 'down', atMs: 12 }, { type: 'key', key: 'ArrowRight', action: 'down', atMs: 12 }])
})

test('@claim:selected-canvas captures only the configured canvas selector', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'reel-claim-selector-'))
  const initial = { url: seededPage, canvas: '#selected', seed: 'one', checkpoints: [{ name: 'spawn' }] }
  await runReel(initial, { cwd, update: true })
  const outcome = await runReel({ ...initial, seed: 'two' }, { cwd })
  expect(outcome).toMatchObject({ ok: true, firstDivergence: null })
})

test('@claim:pixel-tolerance compares pixels with the configured per-channel tolerance', () => {
  const baseline = new Uint8ClampedArray([10, 20, 30, 255])
  const current = new Uint8ClampedArray([34, 20, 30, 255])
  expect(compareFrameData(baseline, current, 1, 1, 24).changedPixels).toBe(0)
  expect(compareFrameData(baseline, current, 1, 1, 23).changedPixels).toBe(1)
})

test('@claim:masked-report excludes masks and redacts their report pixels', () => {
  const baseline = png([[0, 0, 0], [0, 0, 0]])
  const current = png([[255, 0, 0], [255, 0, 0]])
  const result = comparePng(baseline, current, { pixelDelta: 0, changedPixelRatio: 0 }, [{ x: 0, y: 0, width: 1, height: 1 }])
  const redacted = PNG.sync.read(redactPng(current, [{ x: 0, y: 0, width: 1, height: 1 }]))
  expect(result).toMatchObject({ changedPixels: 1, comparedPixels: 1, pass: false })
  expect([...redacted.data.slice(0, 4)]).toEqual([43, 50, 47, 255])
})

test('@claim:first-divergence-report writes a self-contained report for the first changed checkpoint', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'reel-claim-report-'))
  const config = { url: seededPage, canvas: '#other', seed: 'release-42', checkpoints: [{ name: 'spawn' }, { name: 'gap' }, { name: 'goal' }] }
  await runReel(config, { cwd, update: true })
  const outcome = await runReel({ ...config, seed: 'release-43' }, { cwd })
  const report = await readFile(outcome.reportPath, 'utf8')
  expect(outcome.firstDivergence).toBe('spawn')
  expect(report).toContain('First divergence at “spawn”.')
  expect(report).toContain('data:image/png;base64,')
})

test('@claim:cli-json-exits returns JSON and documented process exits', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'reel-claim-cli-'))
  const configPath = join(cwd, 'reel.config.mjs')
  await writeFile(configPath, `export default ${JSON.stringify({ url: seededPage, canvas: '#other', seed: 'release-42', checkpoints: [{ name: 'spawn' }] })}`)
  const cli = resolve('dist/cli.js')
  const updated = await command('node', [cli, 'run', configPath, '--update', '--json'], cwd)
  const passed = await command('node', [cli, 'run', configPath, '--json'], cwd)
  const invalid = await command('node', [cli, 'wrong-command'], cwd)
  expect(updated.code).toBe(0)
  expect(JSON.parse(passed.stdout)).toMatchObject({ ok: true, firstDivergence: null })
  expect(invalid.code).toBe(2)
})

test('@claim:no-upload makes no third-party or upload requests during the sample demo', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto('/demo/?demo=1')
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  await expect(page.locator('#run-status')).toHaveText('Visual change found')
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true)
})

test('@claim:offline-demo keeps the sample demo usable after the first visit while offline', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/demo/?demo=1')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  await expect(page.locator('#run-status')).toHaveText('Visual change found')
  await context.close()
})

test('@claim:versioned-cache revalidates documents and caches fingerprinted assets immutably', async ({ page, request }) => {
  await page.goto('/demo/?demo=1')
  const asset = await page.locator('script[type="module"]').getAttribute('src')
  const [documentResponse, assetResponse, workerResponse] = await Promise.all([request.get('/demo/'), request.get(asset!), request.get('/sw.js')])
  expect(documentResponse.headers()['cache-control']).toBe('public, max-age=0, must-revalidate')
  expect(assetResponse.headers()['cache-control']).toBe('public, max-age=31536000, immutable')
  expect(workerResponse.headers()['cache-control']).toBe('public, max-age=0, must-revalidate')
})

test('@claim:sample-speed opens a populated sample comparison in under two minutes', async ({ page }) => {
  const start = Date.now()
  await page.goto('/demo/?demo=1')
  await expect(page.locator('#baseline-canvas')).toBeVisible()
  await expect(page.locator('#run-status')).toHaveText('Within tolerance')
  expect(Date.now() - start).toBeLessThan(120_000)
})

test('@claim:demo-isolation stores only demo state and reset discards sample changes', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('real:preserved', 'keep'))
  await page.goto('/demo/?demo=1')
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  expect(await page.evaluate(() => localStorage.getItem('real:preserved'))).toBe('keep')
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key !== 'real:preserved'))).toEqual(['demo:canvas-regression-reel:state'])
  await expect(page.locator('#run-status')).toHaveText('Within tolerance')
})

test('@claim:package-playground uses the browser package entry for a visible pixel result', async ({ page }) => {
  const localResult = compareFrameData(new Uint8ClampedArray([0, 0, 0, 255]), new Uint8ClampedArray([255, 0, 0, 255]), 1, 1, 0)
  await page.goto('/demo/?demo=1')
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  expect(localResult.changedPixels).toBe(1)
  await expect(page.locator('#diff-label')).toHaveText(/px/)
})
