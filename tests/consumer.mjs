import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)
const workspace = process.cwd()
const temp = await mkdtemp(join(tmpdir(), 'canvas-reel-consumer-'))
const packed = await execFile('npm', ['pack', '--pack-destination', temp], { cwd: workspace })
const tarball = join(temp, packed.stdout.trim().split('\n').at(-1))
const consumer = join(temp, 'consumer')
await execFile('npm', ['init', '--yes'], { cwd: temp })
await writeFile(join(temp, 'package.json'), JSON.stringify({ name: 'canvas-reel-clean-consumer', private: true, type: 'module' }))
await execFile('npm', ['install', '--no-package-lock', tarball, 'playwright@1.58.2'], { cwd: temp })

const dataPage = `data:text/html,${encodeURIComponent(`<!doctype html><canvas id="game" width="16" height="12"></canvas><script>const x=document.querySelector('canvas').getContext('2d');x.fillStyle='rgb('+Math.floor(Math.random()*255)+',30,20)';x.fillRect(0,0,16,12)</script>`)}`
await writeFile(join(temp, 'consumer.mjs'), `
  import { comparePng, defineConfig, runReel } from 'canvas-regression-reel'
  import { compareFrameData } from 'canvas-regression-reel/browser'
  import { createRequire } from 'node:module'
  import { mkdtemp } from 'node:fs/promises'
  import { tmpdir } from 'node:os'
  import { join } from 'node:path'
  const require = createRequire(import.meta.url)
  const cjs = require('canvas-regression-reel')
  if (typeof cjs.comparePng !== 'function' || typeof comparePng !== 'function') throw new Error('ESM or CommonJS entry did not load')
  if (compareFrameData(new Uint8ClampedArray([0,0,0,255]), new Uint8ClampedArray([2,0,0,255]), 1, 1, 0).changedPixels !== 1) throw new Error('Browser entry did not compare pixels')
  const cwd = await mkdtemp(join(tmpdir(), 'canvas-reel-consumer-run-'))
  const config = defineConfig({ url: ${JSON.stringify(dataPage)}, canvas: '#game', seed: 'release-42', checkpoints: [{ name: 'spawn' }] })
  if (!(await runReel(config, { cwd, update: true })).ok) throw new Error('Could not create baseline')
  if (!(await runReel(config, { cwd })).ok) throw new Error('Unchanged run failed')
  const changed = await runReel({ ...config, seed: 'release-43' }, { cwd })
  if (changed.ok || changed.firstDivergence !== 'spawn') throw new Error('Changed run did not identify first divergence')
  const report = await (await import('node:fs/promises')).readFile(changed.reportPath, 'utf8')
  if (!report.includes('data:image/png;base64,')) throw new Error('Report did not embed image evidence')
  console.log('clean consumer: ESM, CJS, browser entry, runner, report: PASS')
`)
await execFile('node', [join(temp, 'consumer.mjs')], { cwd: temp })
const cli = resolve(temp, 'node_modules/canvas-regression-reel/dist/cli.js')
const help = await execFile('node', [cli, '--help'], { cwd: temp })
if (!help.stdout.includes('Exit codes:')) throw new Error('Packaged CLI help is incomplete')
try { await execFile('node', [cli, 'not-a-command'], { cwd: temp }); throw new Error('Invalid CLI command unexpectedly succeeded') }
catch (error) { if (error.code !== 2) throw error }
console.log('clean consumer artifact check: PASS')
