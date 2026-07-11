import { expect, test } from '@playwright/test'

import { signInAdmin, signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'
import {
  type E2EMemberTransaction,
  type E2EProfile,
  getEarlyAccessLeadByEmail,
  getLatestMemberTransactionByNote,
  getProfileByEmail,
  getRewardBalance,
  getSupabaseSessionClient,
} from './helpers/supabase.js'

test.describe.serial('platform launch checklist PT001-PT008', () => {
  test.skip(!workflowAuthEnabled, 'Run with npm run test:launch after local Supabase is reset and seeded.')

  const purchaseAmount = 73.21
  const launchRunId = process.env.LAUNCH_TEST_RUN_ID ?? `${Date.now()}`
  const transactionNote = `launch-checklist-PT003-${launchRunId}`
  const earlyAccessEmail = `launch-checklist-${launchRunId}@example.com`
  const earlyAccessWhatsapp = `+502 5555 ${launchRunId.slice(-3).padStart(3, '0')}`

  let memberProfile: E2EProfile
  let startingBalancePoints = 0
  let recordedTransaction: E2EMemberTransaction

  test('PT001 member sign-up flow monthly plan is available while payment settlement remains pending', async ({ page }) => {
    test.info().annotations.push({
      type: 'payment-pending',
      description: 'Real $25/mo payment settlement requires a payment gateway integration.',
    })

    await page.goto('/join')
    await expect(page.locator('body')).toContainText(/Create my account|Crear mi cuenta|Member signup/i)
    await expect(page.locator('#join-name')).toBeVisible()
    await expect(page.locator('#join-email')).toBeVisible()
    await expect(page.locator('#join-password')).toBeVisible()
  })

  test('PT002 VIP sign-up flow is tracked as pending until paid VIP gateway exists', async ({ page }) => {
    test.info().annotations.push({
      type: 'payment-pending',
      description: 'Real $100/yr VIP payment settlement requires a payment gateway integration.',
    })

    await page.goto('/landing-page')
    await expect(page.locator('body')).toContainText(/Early adopter monthly subscription|Monthly subscription/i)
    await expect(page.locator('body')).toContainText(/\$100,000 in Rewards|\$100,000 Bonus/i)
  })

  test('PT003 business QR code scan triggers a member transaction', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    memberProfile = await getProfileByEmail(customerClient, e2eAccounts.customer)
    const startingBalance = await getRewardBalance(customerClient, memberProfile.id)
    startingBalancePoints = startingBalance.points

    expect(memberProfile.memberQrToken).toBeTruthy()

    await signInBusinessPortal(page, e2eAccounts.businessStaff)
    await page.goto(`/business/member-sale/${memberProfile.memberQrToken}`)
    await expect(page.locator('body')).toContainText(/Record Member Sale|Purchase Details/i)
    await page.locator('#purchaseAmount').fill(String(purchaseAmount))
    await page.locator('#receiptNumber').fill(`E2E-${transactionNote}`)
    await page.locator('#note').fill(transactionNote)
    await page.getByRole('button', { name: /Record Sale/i }).click()
    await expect(page.locator('body')).toContainText(/Transaction recorded/i)

    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    recordedTransaction = await getLatestMemberTransactionByNote(staffClient, transactionNote)

    expect(recordedTransaction.profileId).toBe(memberProfile.id)
    expect(recordedTransaction.purchaseAmount).toBe(purchaseAmount)
    expect(recordedTransaction.pointsAwarded).toBeGreaterThan(0)
  })

  test('PT004 rewards points are credited to the member account', async () => {
    expect(recordedTransaction).toBeTruthy()

    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const updatedBalance = await getRewardBalance(customerClient, memberProfile.id)

    expect(updatedBalance.points).toBeGreaterThanOrEqual(startingBalancePoints + recordedTransaction.pointsAwarded)
  })

  test('PT005 member can view updated balance and transaction history', async ({ page }) => {
    expect(recordedTransaction).toBeTruthy()
    const formattedPoints = new Intl.NumberFormat('en-US').format(recordedTransaction.pointsAwarded)

    await signInCustomer(page, e2eAccounts.customer)
    await expect(page.locator('body')).toContainText(formattedPoints)

    await page.goto('/activity')
    await expect(page.locator('body')).toContainText(/Purchase at|\$73\.21|Points Earned/i)
  })

  test('PT006 business dashboard shows member scan activity', async ({ page }) => {
    expect(recordedTransaction).toBeTruthy()

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/dashboard')
    await expect(page.locator('body')).toContainText(/QR Transactions|Commission Owed|QR Revenue/i)

    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const ownerVisibleTransaction = await getLatestMemberTransactionByNote(ownerClient, transactionNote)
    expect(ownerVisibleTransaction.id).toBe(recordedTransaction.id)
  })

  test.skip('PT007 100 simultaneous members stress test requires a dedicated k6 or Artillery load-testing slice', async () => {
    expect(true).toBe(false)
  })

  test('PT008 early subscriber form stores a lead visible to admin', async ({ page }) => {
    await page.goto('/invitation')
    await page.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    await page.locator('#early-access-name').fill('Launch Checklist Lead')
    await page.locator('#early-access-whatsapp').fill(earlyAccessWhatsapp)
    await page.locator('#early-access-instagram').fill('@launchchecklist')
    await page.locator('#early-access-email').fill(earlyAccessEmail)
    await page.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    await expect(page.locator('body')).toContainText(/early list|lista/i)

    const adminClient = await getSupabaseSessionClient(e2eAccounts.admin)
    const lead = await getEarlyAccessLeadByEmail(adminClient, earlyAccessEmail)
    expect(lead.email).toBe(earlyAccessEmail)

    await signInAdmin(page, e2eAccounts.admin)
    await expect(page.locator('body')).toContainText(/Early Access|Operaciones|Operations/i)
  })
})
