import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test('welcome, venue view, and booking path (local demo)', async ({ page }) => {
    await page.goto('/welcome')
    await page.getByRole('button', { name: /Player/i }).click()
    await expect(page).toHaveURL('http://127.0.0.1:5173/')

    await page.getByRole('link', { name: /4B/i }).first().click()
    await expect(page).toHaveURL(/\/venue\/4b/)
    await expect(page.locator('h1')).toHaveText('4B', { timeout: 15_000 })

    await page.getByRole('link', { name: 'Book Now' }).first().click()
    await expect(page).toHaveURL(/\/match\/m1/)

    await page.goto('/match/m1?team=team1&role=attacker')
    await page.getByRole('button', { name: 'Book This Spot' }).click()
    await expect(page.getByPlaceholder('Full Name')).toBeVisible()

    await page.getByPlaceholder('Full Name').fill('E2E Player')
    await page.getByPlaceholder('+961 XX XXX XXX').fill('+96171111111')
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/payment\//)

    const localSkip = page.getByRole('button', { name: /local demo/i })
    if (await localSkip.isVisible()) {
      await localSkip.click()
      await expect(page.getByText(/You're in!/)).toBeVisible({ timeout: 10_000 })
    }
  })
})
