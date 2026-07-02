import { expect, test } from '@playwright/test'

import { signInBusinessPortal } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

test.describe('business owner workflow smoke test', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true or run npm run test:e2e:workflows after local Supabase is seeded.')

  test('owner can sign in and open owner business pages', async ({ page }) => {
    await signInBusinessPortal(page, e2eAccounts.businessOwner)

    for (const path of [
      '/business/products',
      '/business/rewards',
      '/business/promotions',
      '/business/gift-cards',
      '/business/members',
      '/business/settings',
    ]) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
      await expect(page.locator('body')).toContainText(/Velvet Brew|Guatemala Rewards/i)
    }
  })
})
