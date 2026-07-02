import { expect, test } from '@playwright/test'

import { signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'
import {
  ensureActiveMembership,
  fulfillRewardRedemption,
  getBusinessBySlug,
  getFirstRewardForBusiness,
  getLatestRedemptionForCustomer,
  getProfileByEmail,
  getRewardBalance,
  getSupabaseSessionClient,
  recordMemberQrSale,
  redeemRewardForCustomer,
} from './helpers/supabase.js'

test.describe.serial('reward redemption and fulfillment workflow automation', () => {
  test.skip(!workflowAuthEnabled, 'Run with npm run test:rewards against a seeded Supabase project.')

  const runId = process.env.WORKFLOW_TEST_RUN_ID ?? `${Date.now()}`
  const fundingNote = `reward-workflow-funding-${runId}`
  const redemptionNote = `reward-workflow-redemption-${runId}`

  let businessId = ''
  let customerProfileId = ''
  let redemptionId = ''

  test('RW001 verified customer can browse rewards after earning enough points', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const business = await getBusinessBySlug(ownerClient, 'velvet-brew')
    const customer = await getProfileByEmail(customerClient, e2eAccounts.customer)
    businessId = business.id
    customerProfileId = customer.id

    await ensureActiveMembership(customerClient)
    await recordMemberQrSale(staffClient, customer.memberQrToken!, 85, fundingNote)
    const reward = await getFirstRewardForBusiness(customerClient, businessId)
    const balance = await getRewardBalance(customerClient, customerProfileId)
    expect(balance.points).toBeGreaterThanOrEqual(reward.points_cost)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.locator('body')).toContainText(/QR de miembro|member QR|Billetera de recompensas/i)
    await expect(page.locator('body')).toContainText(/Puntos totales|Total Points/i)
  })

  test('RW002 verified customer can redeem a reward and see activity', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const reward = await getFirstRewardForBusiness(customerClient, businessId)
    const redeemed = await redeemRewardForCustomer(customerClient, reward.id, redemptionNote)
    const latestRedemption = await getLatestRedemptionForCustomer(customerClient, customerProfileId)
    redemptionId = latestRedemption.id as string

    expect(latestRedemption.id).toBe(redeemed.id)
    expect(latestRedemption.status).toBe('ready')

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/activity')
    await expect(page.locator('body')).toContainText(/Redeemed|Rewards redeemed|Activity/i)
  })

  test('RW003 business can see and fulfill the reward redemption', async ({ page }) => {
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/dashboard')
    await expect(page.locator('body')).toContainText(/Fulfillment Queue|Cola de cumplimiento/i)
    await expect(page.locator('body')).toContainText(/Pending Fulfillment|Cumplimiento pendiente/i)

    await fulfillRewardRedemption(ownerClient, redemptionId)
    const fulfilledRedemption = await getLatestRedemptionForCustomer(ownerClient, customerProfileId)
    expect(fulfilledRedemption.status).toBe('fulfilled')
  })
})
