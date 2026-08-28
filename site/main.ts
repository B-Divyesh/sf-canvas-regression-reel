import './styles.css'

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-checkpoint]')]
const baseline = $('#baseline-canvas') as HTMLCanvasElement | null
const current = $('#current-canvas') as HTMLCanvasElement | null
const diff = $('#diff-canvas') as HTMLCanvasElement | null
const regressionToggle = $('#regression-toggle') as HTMLButtonElement | null
const tolerance = $('#tolerance') as HTMLInputElement | null
let active = 0
let regressed = false

function drawGame(canvas: HTMLCanvasElement, frame: number, changed: boolean) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = '#d7ceb3'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#a6b69f'
  ctx.fillRect(0, 0, w, 145)
  ctx.fillStyle = '#bcc8b1'
  ctx.beginPath(); ctx.arc(84, 72, 44, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#222a27'
  for (let x = -20; x < w; x += 52) {
    const top = 210 - ((x + frame * 23) % 70)
    ctx.fillRect(x, top, 48, h - top)
    ctx.fillStyle = '#59645b'; ctx.fillRect(x + 5, top + 6, 38, 5); ctx.fillStyle = '#222a27'
  }
  const heroX = 76 + frame * 116
  const heroY = frame === 1 ? 118 : 172
  ctx.fillStyle = '#18201e'
  ctx.fillRect(heroX - 7, heroY - 12, 14, 22)
  ctx.beginPath(); ctx.arc(heroX, heroY - 18, 8, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#18201e'; ctx.lineWidth = 5; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(heroX - 4, heroY + 7); ctx.lineTo(heroX - 13, heroY + 20); ctx.moveTo(heroX + 4, heroY + 7); ctx.lineTo(heroX + 15, heroY + 18); ctx.stroke()
  if (frame === 2) { ctx.fillStyle = '#bd3f2d'; ctx.fillRect(405, 80, 8, 92); ctx.beginPath(); ctx.moveTo(413, 80); ctx.lineTo(448, 94); ctx.lineTo(413, 108); ctx.fill() }
  if (changed && frame >= 1) {
    ctx.fillStyle = '#bd3f2d'
    ctx.fillRect(frame === 1 ? 277 : 338, frame === 1 ? 160 : 154, 34, 16)
  }
  ctx.fillStyle = '#18201e'; ctx.font = '700 13px ui-monospace, monospace'; ctx.fillText(`SEED release-42  /  F${frame + 1}`, 16, 24)
}

function compareCanvases() {
  if (!baseline || !current || !diff || !tolerance) return { ratio: 0, changed: 0 }
  const a = baseline.getContext('2d')!.getImageData(0, 0, baseline.width, baseline.height)
  const b = current.getContext('2d')!.getImageData(0, 0, current.width, current.height)
  const out = diff.getContext('2d')!.createImageData(diff.width, diff.height)
  let changed = 0
  const threshold = Number(tolerance.value)
  for (let i = 0; i < a.data.length; i += 4) {
    const delta = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]))
    const isChanged = delta > threshold
    if (isChanged) changed += 1
    const grey = Math.round(b.data[i] * .21 + b.data[i + 1] * .72 + b.data[i + 2] * .07)
    out.data[i] = isChanged ? 225 : grey
    out.data[i + 1] = isChanged ? 62 : grey
    out.data[i + 2] = isChanged ? 40 : grey
    out.data[i + 3] = isChanged ? 255 : 90
  }
  diff.getContext('2d')!.putImageData(out, 0, 0)
  return { ratio: changed / (baseline.width * baseline.height), changed }
}

function render() {
  if (!baseline || !current || !diff || !tolerance) return
  drawGame(baseline, active, false)
  drawGame(current, active, regressed)
  const result = compareCanvases()
  const frameChanged = result.changed > 0
  const anyChanged = regressed
  const names = ['Spawn', 'Gap', 'Goal']
  const first = anyChanged ? '02 · Gap' : 'None'
  tabs.forEach((tab, index) => {
    tab.setAttribute('aria-selected', String(index === active))
    tab.querySelector('i')?.classList.toggle('changed', regressed && index >= 1)
  })
  $('#pixel-count')!.textContent = `${(result.ratio * 100).toFixed(3)}%`
  $('#first-change')!.textContent = first
  $('#run-status')!.textContent = anyChanged ? 'Visual change found' : 'Within tolerance'
  $('#signal-lamp')!.classList.toggle('clear', !anyChanged)
  $('#signal-lamp')!.classList.toggle('changed', anyChanged)
  $('#current-label')!.textContent = frameChanged ? 'Changed' : 'Matched'
  $('#diff-label')!.textContent = frameChanged ? `${result.changed.toLocaleString()} px` : 'Quiet'
  $('#tolerance-value')!.textContent = tolerance.value
  $('#canvas-description')!.textContent = `Checkpoint ${names[active]}: the baseline and current frame ${frameChanged ? `differ by ${result.changed.toLocaleString()} pixels` : 'match'} at a per-channel delta of ${tolerance.value}. ${anyChanged ? 'The first divergent checkpoint is Gap.' : 'All checkpoints are within tolerance.'}`
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => { active = index; render() })
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    active = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    tabs[active].focus(); render()
  })
})
regressionToggle?.addEventListener('click', () => {
  regressed = !regressed
  regressionToggle.setAttribute('aria-pressed', String(regressed))
  regressionToggle.lastChild!.textContent = regressed ? ' Remove regression' : ' Introduce regression'
  if (regressed && active === 0) active = 1
  render()
})
tolerance?.addEventListener('input', render)
$('#clear-demo')?.addEventListener('click', () => { $('#reel-demo')?.setAttribute('hidden', ''); $('#empty-demo')?.removeAttribute('hidden') })
$('#restore-demo')?.addEventListener('click', () => { $('#empty-demo')?.setAttribute('hidden', ''); $('#reel-demo')?.removeAttribute('hidden'); render(); tabs[0]?.focus() })

$('#copy-code')?.addEventListener('click', async () => {
  const value = $('#config-code')?.textContent ?? ''
  const status = $('#copy-status')!
  try { await navigator.clipboard.writeText(value); status.textContent = 'Config copied. Paste it into reel.config.mjs.' }
  catch { status.textContent = 'Copy was blocked. Select the code and copy it manually.' }
})

function connection() {
  const el = $('#connection-state')
  if (el) el.textContent = navigator.onLine ? 'Local-only · online' : 'Local-only · offline'
}
window.addEventListener('online', connection)
window.addEventListener('offline', connection)
connection()
render()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }) })
}
