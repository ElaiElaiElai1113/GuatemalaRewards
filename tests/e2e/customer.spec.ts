import { expect, test } from '@playwright/test'

import { signInCustomer } from './helpers/auth.js'
import { e2eAccounts, e2ePassword, workflowAuthEnabled } from './helpers/env.js'

test.describe('customer workflow smoke test', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true or run npm run test:e2e:workflows after local Supabase is seeded.')

  test('customer can sign in and open core member pages', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.customer)

    await page.goto('/shop')
    await expect(page.locator('body')).toContainText(/Partner Map|Explore Businesses|Mapa de aliados|Explorar negocios/i)
    await expect(page).toHaveURL(/\/shop$/)

    for (const path of ['/membership', '/profile', '/cart']) {
      await page.goto(path)
      await expect(page.locator('body')).toContainText('Guatemala Rewards')
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    }

    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.locator('body')).toContainText(/QR de miembro|member QR|Billetera de recompensas/i)
  })

  test('unverified customer is blocked from reward value actions', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#signin-email').fill(e2eAccounts.unverifiedCustomer)
    await page.locator('#signin-password').fill(e2ePassword)
    await page.locator('form').filter({ has: page.locator('#signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
    await expect(page).toHaveURL(/\/dashboard$|\/agreements\/required$/)

    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/dashboard$|\/agreements\/required$/)
    await expect(page.locator('body')).toContainText(/Verify ID|Verificar ID|Required Agreement|Agreement/i)

    await page.goto('/gift-cards')
    await expect(page.locator('body')).toContainText(/Verify ID to issue|Verifica tu ID para emitir|Verification required|Tu ID fue enviado|Required Agreement|Agreement/i)
  })
})
