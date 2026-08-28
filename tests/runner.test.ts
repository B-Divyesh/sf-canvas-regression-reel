import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runReel, type ReelConfig } from '../src/index.js'

const page = `data:text/html,${encodeURIComponent(`<!doctype html><canvas id="game" width="32" height="24"></canvas><script>const c=document.querySelector('canvas');const x=c.getContext('2d');x.fillStyle='#18201e';x.fillRect(0,0,32,24);x.fillStyle='rgb('+Math.floor(Math.random()*255)+',30,20)';x.fillRect(8,8,8,8)</script>`)}`

describe('runReel', () => {
  it('updates, passes, then identifies a changed first checkpoint', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'canvas-reel-'))
    const config: ReelConfig = { url: page, canvas: '#game', seed: 'release-42', checkpoints: [{ name: 'spawn' }] }
    const updated = await runReel(config, { cwd, update: true })
    expect(updated.ok).toBe(true)
    expect(updated.checkpoints[0].status).toBe('updated')
    const passed = await runReel(config, { cwd })
    expect(passed.ok).toBe(true)
    const changed = await runReel({ ...config, seed: 'release-43' }, { cwd })
    expect(changed.ok).toBe(false)
    expect(changed.firstDivergence).toBe('spawn')
    expect(await readFile(changed.reportPath, 'utf8')).toContain('First divergence at “spawn”.')
  }, 30_000)
})
