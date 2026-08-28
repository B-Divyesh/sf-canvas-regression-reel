import { createHash } from 'node:crypto'
import { readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const siteDir = resolve(import.meta.dirname, '../dist/site')
const hash = (value) => createHash('sha256').update(value).digest('hex')

async function fingerprintHero(file) {
  const original = resolve(siteDir, file)
  const contents = await readFile(original)
  const extensionAt = file.lastIndexOf('.')
  const fingerprinted = `${file.slice(0, extensionAt)}-${hash(contents).slice(0, 12)}${file.slice(extensionAt)}`
  await rename(original, resolve(siteDir, fingerprinted))
  return { original: `/${file}`, fingerprinted: `/${fingerprinted}` }
}

async function filesIn(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    const name = `${prefix}${entry.name}`
    return entry.isDirectory() ? filesIn(resolve(directory, entry.name), `${name}/`) : [name]
  }))
  return paths.flat()
}

const heroes = await Promise.all([
  fingerprintHero('instrument-reel.webp'),
  fingerprintHero('instrument-reel-720.webp'),
])
let index = await readFile(resolve(siteDir, 'index.html'), 'utf8')
for (const hero of heroes) index = index.replaceAll(hero.original, hero.fingerprinted)
await writeFile(resolve(siteDir, 'index.html'), index)

const files = await filesIn(siteDir)
const precache = ['/', '/privacy/', '/terms/', ...files
  .filter((file) => file.startsWith('assets/') || file.startsWith('instrument-reel-') || file === 'favicon.svg')
  .map((file) => `/${file}`)]
const manifest = await Promise.all(precache.map(async (path) => {
  const localPath = path === '/' ? 'index.html' : path.endsWith('/') ? `${path.slice(1)}index.html` : path.slice(1)
  return `${path}:${hash(await readFile(resolve(siteDir, localPath)))}`
}))
const version = hash(manifest.join('\n')).slice(0, 16)
const template = await readFile(resolve(import.meta.dirname, 'sw-template.js'), 'utf8')
const worker = template
  .replace('__CANVAS_REEL_CACHE__', `canvas-reel-shell-${version}`)
  .replace('__CANVAS_REEL_PRECACHE__', JSON.stringify(precache))
await writeFile(resolve(siteDir, 'sw.js'), worker)
