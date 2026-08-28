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

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} is a semantic legal page`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  })
}
