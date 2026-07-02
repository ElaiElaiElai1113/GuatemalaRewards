import { expect, test } from '@playwright/test'

import { signInAdmin, signInBusinessPortal } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

test.describe('authenticated platform guide workflow', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true after local Supabase is seeded to test portal guide routes.')

  test('admin can open the guide from the portal shell', async ({ page }) => {
    await signInAdmin(page, e2eAccounts.admin)

    await page.goto('/admin/guide')
    await expect(page).toHaveURL(/\/admin\/guide$/)
    await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Guia' })).toHaveAttribute('href', '/admin/guide')
  })

  test('business staff can open the guide from the business shell', async ({ page }) => {
    await signInBusinessPortal(page, e2eAccounts.businessStaff)

    await page.goto('/business/guide')
    await expect(page).toHaveURL(/\/business\/guide$/)
    await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Guia' })).toHaveAttribute('href', '/business/guide')
  })
})
