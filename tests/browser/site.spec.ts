import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('live reel exposes the first changed checkpoint and keyboard navigation', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('#run-status')).toHaveText('Within tolerance')
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  await expect(page.getByText('Visual change found')).toBeVisible()
  await expect(page.locator('#first-change')).toHaveText('02 · Gap')
  const selected = page.getByRole('tab', { selected: true })
  await selected.press('ArrowRight')
  await expect(page.getByRole('tab', { name: /Goal/, selected: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page: page as never }).analyze()
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
})

test('fits a 390px viewport and supports empty-state recovery', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Clear trace' }).click()
  await expect(page.getByRole('heading', { name: 'No checkpoints on the reel' })).toBeVisible()
  await page.getByRole('button', { name: 'Load sample trace' }).click()
  await expect(page.locator('#baseline-canvas')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

test('production cached shell remains interactive after an offline reload', async ({ page, context }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  const cacheKeys = await page.evaluate(async () => caches.keys())
  expect(cacheKeys).toEqual([expect.stringMatching(/^canvas-reel-shell-[a-f0-9]{16}$/)])
  const cachedPaths = await page.evaluate(async ([cacheName]) => (await caches.open(cacheName)).keys().then((requests) => requests.map((request) => new URL(request.url).pathname)), cacheKeys)
  expect(cachedPaths).toEqual(expect.arrayContaining(['/', '/privacy/', '/terms/']))
  expect(cachedPaths.some((path) => path.startsWith('/assets/main-'))).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('#run-status')).toHaveText('Within tolerance')
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  await expect(page.locator('#run-status')).toHaveText('Visual change found')
  expect(errors).toEqual([])
})

test('fingerprinted production assets are immutable while HTML and the worker revalidate', async ({ page, request }) => {
  await page.goto('/')
  const appAsset = await page.locator('script[type="module"]').getAttribute('src')
  const heroAsset = await page.locator('.hero-art img').getAttribute('src')
  expect(appAsset).toMatch(/^\/assets\/main-[\w-]+\.js$/)
  expect(heroAsset).toMatch(/^\/instrument-reel-[a-f0-9]{12}\.webp$/)

  for (const path of [appAsset!, heroAsset!]) {
    const response = await request.get(path)
    expect(response.headers()['cache-control']).toBe('public, max-age=31536000, immutable')
  }
  for (const path of ['/', '/sw.js']) {
    const response = await request.get(path)
    expect(response.headers()['cache-control']).toBe('public, max-age=0, must-revalidate')
  }
})

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} is a semantic legal page`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  })
}
