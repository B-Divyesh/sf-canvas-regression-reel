import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('landing names the job, audience, and sample action before scrolling', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Canvas Regression Reel — find changed canvas frames')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Find changed canvas frames' })).toBeVisible()
  await expect(page.getByText('For solo browser-game developers who need visual evidence before they ship.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible()
  await expect(page.getByText('Opens a seeded three-frame comparison in a separate demo.')).toBeVisible()
  await expect(page.getByText('No account or upload')).toBeVisible()
  await expect(page.getByText('Works offline after first visit')).toBeVisible()
})

test('demo has populated sample output, keyboard navigation, empty recovery, and reset', async ({ page }) => {
  await page.goto('/demo/?demo=1')
  await expect(page).toHaveTitle('Demo — Canvas Regression Reel')
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.locator('#run-status')).toHaveText('Within tolerance')
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  await expect(page.locator('#run-status')).toHaveText('Visual change found')
  await expect(page.locator('#first-change')).toHaveText('02 · Gap')
  await page.getByRole('tab', { selected: true }).press('ArrowRight')
  await expect(page.getByRole('tab', { name: /Goal/, selected: true })).toBeVisible()
  await page.getByRole('button', { name: 'Clear trace' }).click()
  await expect(page.getByRole('heading', { name: 'No checkpoints on the reel' })).toBeVisible()
  await page.getByRole('button', { name: 'Restore sample trace' }).click()
  await expect(page.locator('#baseline-canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.locator('#run-status')).toHaveText('Within tolerance')
  await expect(page.getByRole('tab', { name: /Spawn/, selected: true })).toBeVisible()
})

test('site has no serious accessibility violations on landing or demo', async ({ page }) => {
  for (const path of ['/', '/demo/?demo=1']) {
    await page.goto(path)
    const results = await new AxeBuilder({ page: page as never }).analyze()
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  }
})

test('mobile layout and 200 percent equivalent have no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/demo/?demo=1')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.setViewportSize({ width: 195, height: 422 })
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('legal routes have route titles and missing paths render the designed 404', async ({ page, request }) => {
  for (const [path, title] of [['/privacy/', 'Privacy — Canvas Regression Reel'], ['/terms/', 'Terms — Canvas Regression Reel']] as const) {
    await page.goto(path)
    await expect(page).toHaveTitle(title)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  }
  const response = await request.get('/not-a-real-page')
  expect(response.status()).toBe(404)
  expect(await response.text()).toContain('Find an existing page')
  await page.goto('/not-a-real-page')
  await expect(page).toHaveTitle('Page not found — Canvas Regression Reel')
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible()
})

test('production cached demo remains interactive after an offline reload', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/demo/?demo=1')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('#run-status')).toHaveText('Within tolerance')
  await page.getByRole('button', { name: 'Introduce regression' }).click()
  await expect(page.locator('#run-status')).toHaveText('Visual change found')
  expect(errors).toEqual([])
  await context.close()
})

test('fingerprinted assets cache immutably and security headers are present', async ({ page, request }) => {
  await page.goto('/')
  const appAsset = await page.locator('script[type="module"]').getAttribute('src')
  const heroAsset = await page.locator('.hero-art img').getAttribute('src')
  for (const path of [appAsset!, heroAsset!]) {
    const response = await request.get(path)
    expect(response.headers()['cache-control']).toBe('public, max-age=31536000, immutable')
  }
  const root = await request.get('/')
  expect(root.headers()['content-security-policy']).toContain("default-src 'self'")
  expect(root.headers()['permissions-policy']).toContain('camera=()')
  expect(root.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
})
