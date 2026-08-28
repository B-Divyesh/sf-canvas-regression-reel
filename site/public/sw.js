const CACHE = 'canvas-reel-shell-v1'
const PAGES = ['/', '/privacy/', '/terms/']
const MEDIA = ['/instrument-reel.webp', '/instrument-reel-720.webp', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const assets = new Set(MEDIA)
    for (const page of PAGES) {
      const response = await fetch(page)
      await cache.put(page, response.clone())
      const html = await response.text()
      for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) assets.add(match[1])
    }
    await cache.addAll([...assets])
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
    return response
  })))
})
