import { expect, test } from '@playwright/test'

import { signInBusinessPortal } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

test.describe('business staff workflow smoke test', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true or run npm run test:e2e:workflows after local Supabase is seeded.')

  test('staff can sign in and sees staff-safe business navigation', async ({ page }) => {
    await signInBusinessPortal(page, e2eAccounts.businessStaff)

    for (const path of ['/business/dashboard', '/business/redemptions', '/business/members', '/business/partners']) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
      await expect(page.locator('body')).toContainText(/Velvet Brew|Guatemala Rewards/i)
    }

    for (const linkName of [/products/i, /^rewards$/i, /promotions/i, /gift cards/i, /settings/i]) {
      await expect(page.getByRole('link', { name: linkName })).toHaveCount(0)
    }
  })

  test('staff direct URLs to owner-only sections return to dashboard', async ({ page }) => {
    await signInBusinessPortal(page, e2eAccounts.businessStaff)

    for (const path of [
      '/business/products',
      '/business/rewards',
      '/business/promotions',
      '/business/gift-cards',
      '/business/settings',
    ]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/business\/dashboard$/)
    }

    await expect(page.getByRole('link', { name: /gift cards/i })).toHaveCount(0)
  })
})
