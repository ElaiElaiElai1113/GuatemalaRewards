import { expect, test } from '@playwright/test'

import { signInAdmin } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

test.describe('admin workflow smoke test', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true or run npm run test:e2e:workflows after local Supabase is seeded.')

  test('admin can sign in and open operations pages', async ({ page }) => {
    await signInAdmin(page, e2eAccounts.admin)

    await expect(page.locator('body')).toContainText(/Operations|Operaciones|Early Access/i)

    await page.goto('/admin/gift-cards')
    await expect(page).toHaveURL(/\/admin\/gift-cards$/)
    await expect(page.locator('body')).toContainText(/Gift Cards|Tarjetas/i)
  })
})
