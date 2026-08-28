import { readFile } from 'node:fs/promises'
import type { CheckpointResult, ReelRunResult } from './types.js'
import { redactPng } from './compare.js'

const esc = (value: unknown) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

async function image(path: string | undefined, masks: CheckpointResult['masks']): Promise<string | null> {
  if (!path) return null
  try {
    const buffer = redactPng(await readFile(path), masks)
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function buildReport(result: ReelRunResult): Promise<string> {
  const slides = await Promise.all(result.checkpoints.map(async (checkpoint, index) => {
    const [baseline, current, diff] = await Promise.all([
      image(checkpoint.baselinePath, checkpoint.masks),
      image(checkpoint.currentPath, checkpoint.masks),
      image(checkpoint.diffPath, []),
    ])
    const ratio = `${(checkpoint.changedPixelRatio * 100).toFixed(3)}%`
    const frames = [
      ['Baseline', baseline],
      ['Current', current],
      ['Difference', diff],
    ].map(([label, src]) => `<figure><figcaption>${label}</figcaption>${src
      ? `<img src="${src}" alt="${esc(label)} frame for ${esc(checkpoint.name)}">`
      : `<div class="empty">No ${String(label).toLowerCase()} image</div>`}</figure>`).join('')
    return `<section class="slide" data-slide="${index}" ${index ? 'hidden' : ''}>
      <div class="reading"><span class="lamp ${checkpoint.status}"></span><strong>${esc(checkpoint.status)}</strong><span>${ratio} changed · ${checkpoint.changedPixels.toLocaleString()} / ${checkpoint.comparedPixels.toLocaleString()} pixels</span></div>
      ${checkpoint.message ? `<p class="message">${esc(checkpoint.message)}</p>` : ''}
      <div class="frames">${frames}</div>
      ${checkpoint.masks.length ? `<p class="mask-note">▧ ${checkpoint.masks.length} masked region${checkpoint.masks.length === 1 ? '' : 's'} excluded and redacted.</p>` : ''}
    </section>`
  }))
  const tabs = result.checkpoints.map((checkpoint, index) =>
    `<button class="tab" data-tab="${index}" aria-selected="${index === 0}" role="tab"><span>${String(index + 1).padStart(2, '0')}</span>${esc(checkpoint.name)}<i class="lamp ${checkpoint.status}"></i></button>`,
  ).join('')
  const state = result.ok ? 'CLEAR' : 'CHANGE'
  const summary = result.firstDivergence
    ? `First divergence at “${esc(result.firstDivergence)}”.`
    : result.ok ? 'Every checkpoint is within tolerance.' : 'The run did not produce comparable checkpoints.'

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Regression reel · ${state}</title><style>
  :root{color-scheme:light;--paper:#f1ead8;--panel:#ded2b8;--hi:#faf4e5;--ink:#18201e;--muted:#515a55;--bezel:#222a27;--signal:#bd3f2d;--go:#17624e;--amber:#8b5b09;--focus:#006d77}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}header,main,footer{width:min(1180px,calc(100% - 32px));margin:auto}header{padding:42px 0 26px;border-bottom:2px solid var(--ink)}.eyebrow,.label{font:700 12px/1.2 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase}h1{font:800 clamp(38px,8vw,72px)/.92 "Arial Narrow",sans-serif;letter-spacing:-.035em;margin:12px 0}header p{font-size:19px;max-width:64ch}.summary{display:flex;gap:24px;flex-wrap:wrap;padding:18px 0;font-variant-numeric:tabular-nums}.summary strong{font-family:ui-monospace,monospace}.tabs{display:flex;overflow:auto;gap:8px;padding:24px 2px}.tab{min-height:52px;display:flex;align-items:center;gap:10px;border:2px solid var(--ink);background:var(--panel);color:var(--ink);padding:8px 14px;font:700 15px system-ui;box-shadow:0 3px 0 var(--ink);cursor:pointer}.tab span{font:12px ui-monospace,monospace}.tab[aria-selected=true]{background:var(--bezel);color:var(--hi);transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}button:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.lamp{width:10px;height:10px;border:1px solid currentColor;border-radius:50%;display:inline-block;background:var(--amber)}.lamp.pass,.lamp.updated{background:var(--go)}.lamp.changed,.lamp.error{background:var(--signal)}.reading{display:flex;align-items:center;gap:12px;border-top:1px solid var(--ink);padding:20px 0;font-variant-numeric:tabular-nums}.reading strong{text-transform:uppercase}.frames{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.frames figure{margin:0;background:var(--bezel);padding:10px;border-radius:4px;box-shadow:0 5px 0 #0e1311}.frames figcaption{color:var(--hi);padding:2px 4px 10px;font:700 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.frames img{width:100%;height:auto;display:block;background:#111;image-rendering:auto}.empty{aspect-ratio:16/9;display:grid;place-items:center;background:#333;color:var(--hi)}.message,.mask-note{background:var(--panel);border-left:4px solid var(--amber);padding:12px 16px}.mask-note{font-family:ui-monospace,monospace;font-size:14px}footer{padding:48px 0 32px;color:var(--muted);font-size:14px}@media(max-width:720px){header{padding-top:28px}.frames{grid-template-columns:1fr}.reading{align-items:flex-start;flex-wrap:wrap}.tabs{margin-right:-16px}}@media(prefers-reduced-motion:no-preference){.slide{animation:settle .18s ease-out}@keyframes settle{from{opacity:.4;transform:translateY(4px)}}}
  </style></head><body><header><span class="eyebrow">Canvas Regression Reel / run evidence</span><h1>${state}</h1><p>${summary}</p><div class="summary"><span>Seed <strong>${esc(result.seed)}</strong></span><span>Pixel delta <strong>${result.tolerance.pixelDelta}</strong></span><span>Allowed ratio <strong>${(result.tolerance.changedPixelRatio * 100).toFixed(3)}%</strong></span><span>Duration <strong>${result.durationMs}ms</strong></span></div></header><main><nav class="tabs" role="tablist" aria-label="Checkpoints">${tabs}</nav>${slides.join('')}</main><footer>Generated locally by Canvas Regression Reel. Masked regions are redacted. No artifact was uploaded.</footer><script>
  const tabs=[...document.querySelectorAll('[data-tab]')],slides=[...document.querySelectorAll('[data-slide]')];function show(i){tabs.forEach((t,n)=>t.setAttribute('aria-selected',String(n===i)));slides.forEach((s,n)=>s.hidden=n!==i)}tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>show(i));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;show(n);tabs[n].focus()})});
  </script></body></html>`
}
