/* This file is rendered by site/postbuild.mjs. Do not serve it directly. */
const CACHE = '__CANVAS_REEL_CACHE__'
const PRECACHE = __CANVAS_REEL_PRECACHE__

const cacheKey = (request) => new URL(request.url).pathname

async function fetchAndStore(cache, path, bustCache = false) {
  const requestUrl = bustCache ? `${path}?canvas-reel-precache=${CACHE}` : path
  const response = await fetch(requestUrl, { cache: 'reload' })
  if (!response.ok) throw new Error(`Could not precache ${path}: ${response.status}`)
  await cache.put(path, response.clone())
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    // A previous worker may have cached document URLs. The cache-busting query
    // ensures an installing worker receives this release's HTML instead.
    await Promise.all(PRECACHE.map((path) => fetchAndStore(cache, path, path.endsWith('/'))))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('canvas-reel-shell-') && key !== CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

async function navigationResponse(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(cacheKey(request), response.clone())
    return response
  } catch {
    const cached = await cache.match(cacheKey(request))
    if (cached) return cached
    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(navigationResponse(event.request))
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(event.request)
    return cached || fetch(event.request)
  })())
})
