import { expect, test, type Page } from '@playwright/test'

import { signInAdmin } from './helpers/auth.js'
import { e2eAccounts, e2ePassword, workflowAuthEnabled } from './helpers/env.js'
import {
  getAgreementAcceptancesForProfile,
  getProfileByEmail,
  getSupabaseSessionClient,
} from './helpers/supabase.js'

async function submitAgreementForm(page: Page) {
  await page.getByRole('button', { name: /Sign and Continue/i }).click()
}

async function acceptAgreementCheckboxes(page: Page) {
  await page.getByLabel(/electronic records and electronic signatures/i).check()
  await page.getByLabel(/read, understood, and agree/i).check()
}

async function drawSignature(page: Page) {
  const pad = page.getByRole('img', { name: /drawn signature/i })
  await expect(pad).toBeVisible()
  const box = await pad.boundingBox()

  if (!box) {
    throw new Error('Signature pad bounding box was not available.')
  }

  await page.mouse.move(box.x + 40, box.y + 128)
  await page.mouse.down()
  await page.mouse.move(box.x + 96, box.y + 88)
  await page.mouse.move(box.x + 176, box.y + 124)
  await page.mouse.move(box.x + 264, box.y + 76)
  await page.mouse.move(box.x + 360, box.y + 118)
  await page.mouse.move(box.x + 520, box.y + 86)
  await page.mouse.up()
}

async function completeAgreement(page: Page, typedSignature: string) {
  await acceptAgreementCheckboxes(page)
  await page.locator('#typedSignature').fill(typedSignature)
  await drawSignature(page)
  await expect(page.getByText(/Signature captured/i)).toBeVisible()
  await submitAgreementForm(page)
}

test.describe.serial('agreement e-signature frontend QA', () => {
  test.skip(!workflowAuthEnabled, 'Run with npm run test:agreements after local Supabase is reset and Edge Functions are served.')

  test('AGR001 unsigned customer signs member agreement with drawn signature', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#signin-email').fill(e2eAccounts.agreementPendingCustomer)
    await page.locator('#signin-password').fill(e2ePassword)
    await page.locator('form').filter({ has: page.locator('#signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
    await expect(page).toHaveURL(/\/dashboard$|\/agreements\/required$/)

    const client = await getSupabaseSessionClient(e2eAccounts.agreementPendingCustomer)
    const profile = await getProfileByEmail(client, e2eAccounts.agreementPendingCustomer)

    if (page.url().endsWith('/dashboard')) {
      const existingAcceptances = await getAgreementAcceptancesForProfile(client, profile.id)
      expect(existingAcceptances.some((acceptance) => acceptance.signatureSvg?.includes('data-signature="drawn"'))).toBe(true)
      return
    }

    await expect(page.locator('body')).toContainText('Member Agreement')
    await expect(page.getByRole('heading', { name: /Sign Electronically/i })).toBeVisible()
    await expect(page.getByText(/Draw your signature/i)).toBeVisible()

    await submitAgreementForm(page)
    await expect(page.getByText('Electronic records consent is required')).toBeVisible()
    await expect(page.getByText('Agreement confirmation is required')).toBeVisible()
    await expect(page.getByText('Type your full legal name')).toBeVisible()
    await expect(page.getByText('Draw your signature')).toBeVisible()

    await acceptAgreementCheckboxes(page)
    await page.locator('#typedSignature').fill('E2E Agreement Pending Customer')
    await submitAgreementForm(page)
    await expect(page.getByText('Draw your signature')).toBeVisible()
    await expect(page).toHaveURL(/\/agreements\/required$/)

    await drawSignature(page)
    await expect(page.getByText(/Signature captured/i)).toBeVisible()
    await submitAgreementForm(page)
    await expect(page).toHaveURL(/\/dashboard$/)

    const acceptances = await getAgreementAcceptancesForProfile(client, profile.id)

    expect(acceptances.some((acceptance) => acceptance.signatureSvg?.includes('data-signature="drawn"'))).toBe(true)
  })

  test('AGR002 unsigned business owner signs affiliate agreement with drawn signature', async ({ page }) => {
    await page.goto('/business/login')
    await page.locator('#staff-signin-email').fill(e2eAccounts.agreementPendingBusinessOwner)
    await page.locator('#staff-signin-password').fill(e2ePassword)
    await page.locator('form').filter({ has: page.locator('#staff-signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
    await expect(page).toHaveURL(/\/business\/dashboard$|\/agreements\/required$/)

    if (page.url().endsWith('/business/dashboard')) {
      const client = await getSupabaseSessionClient(e2eAccounts.agreementPendingBusinessOwner)
      const profile = await getProfileByEmail(client, e2eAccounts.agreementPendingBusinessOwner)
      const existingAcceptances = await getAgreementAcceptancesForProfile(client, profile.id)
      expect(existingAcceptances.some((acceptance) => acceptance.signatureSvg?.includes('data-signature="drawn"'))).toBe(true)
      return
    }

    await expect(page.locator('body')).toContainText('Business Affiliate Agreement')
    await completeAgreement(page, 'E2E Agreement Pending Owner')
    await expect(page).toHaveURL(/\/business\/dashboard$/)
  })

  test('AGR003 admin agreements panel shows signed and unsigned users with signature previews', async ({ page }) => {
    await signInAdmin(page, e2eAccounts.admin)
    await page.goto('/admin/portal#agreements')

    await expect(page.getByRole('heading', { name: /Signed Agreements/i })).toBeVisible()

    const signedRow = page.locator('tr', { hasText: 'E2E Verified Customer' })
    await expect(signedRow).toContainText('Signed')
    await expect(signedRow.locator('img[alt*="E2E Verified Customer"]')).toBeVisible()

    const unsignedRow = page.locator('tr', { hasText: 'E2E Unsigned Agreement Customer' })
    await expect(unsignedRow).toContainText('Unsigned')
    await expect(unsignedRow).toContainText('Awaiting signature')
  })
})
