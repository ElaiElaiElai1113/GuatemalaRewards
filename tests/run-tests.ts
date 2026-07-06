import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  earlyAccessMessageLines,
  earlyAccessSubscribePrompt,
  earlyAccessSubscribeButtonLabel,
  earlyAccessSubscribeFields,
} from '../src/features/early-access/early-access-content.js'
import {
  ambassadorCreatorSignals,
  ambassadorFormIntro,
  ambassadorPerks,
  ambassadorPrimaryCta,
  ambassadorSuccessMessage,
  ambassadorSuccessTitle,
  ambassadorVipHeadline,
  ambassadorVipSupportingCopy,
} from '../src/features/ambassadors/ambassador-content.js'
import {
  landingBody,
  landingClientHero,
  landingEarlySubscriberBenefits,
  landingFaqQuestions,
  landingHeroEyebrow,
  landingHeroHeadline,
  landingHeroInfoRows,
  landingHeroPills,
  landingMembershipAdvantages,
  landingJoinButtonLabel,
  landingOfferLines,
  landingRewardsSteps,
  landingTagline,
  landingTags,
  landingWhyJoinItems,
} from '../src/features/auth/landing-content.js'
import { isPickupWindow, normalizeCheckoutItems } from '../src/features/critical-flows/critical-flow.js'
import {
  calculateMemberTransaction,
  calculateRewardablePurchaseAmount,
} from '../src/features/critical-flows/member-transaction.js'

function runTest(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return getSourceFiles(entryPath)
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

function getFilesByExtension(directory: string, extension: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return getFilesByExtension(entryPath, extension)
    }

    return entry.name.endsWith(extension) ? [entryPath] : []
  })
}

runTest('normalizeCheckoutItems aggregates duplicate products for one business', () => {
  const result = normalizeCheckoutItems([
    { productId: 'prod-1', businessId: 'biz-1', quantity: 1 },
    { productId: 'prod-1', businessId: 'biz-1', quantity: 2 },
    { productId: 'prod-2', businessId: 'biz-1', quantity: 1 },
  ])

  assert.equal(result.businessId, 'biz-1')
  assert.deepEqual(result.items, [
    { productId: 'prod-1', quantity: 3 },
    { productId: 'prod-2', quantity: 1 },
  ])
})

runTest('normalizeCheckoutItems rejects mixed-business carts', () => {
  assert.throws(
    () =>
      normalizeCheckoutItems([
        { productId: 'prod-1', businessId: 'biz-1', quantity: 1 },
        { productId: 'prod-2', businessId: 'biz-2', quantity: 1 },
      ]),
    /one business at a time/i,
  )
})

runTest('normalizeCheckoutItems rejects invalid quantities', () => {
  assert.throws(
    () =>
      normalizeCheckoutItems([
        { productId: 'prod-1', businessId: 'biz-1', quantity: 0 },
      ]),
    /invalid item/i,
  )
})

runTest('isPickupWindow only accepts supported redemption windows', () => {
  assert.equal(isPickupWindow('Now'), true)
  assert.equal(isPickupWindow('Within 30 mins'), true)
  assert.equal(isPickupWindow('Tonight'), false)
})

runTest('calculateMemberTransaction converts outside purchase amount into reward value, points, and commission', () => {
  const result = calculateMemberTransaction({
    purchaseAmount: 50,
    rewardRatePercent: 20,
    commissionRatePercent: 10,
  })

  assert.deepEqual(result, {
    rewardValue: 10,
    pointsAwarded: 10,
    commissionAmount: 5,
  })
})

runTest('calculateRewardablePurchaseAmount adds included tax to customer total without rewarding tax', () => {
  const result = calculateRewardablePurchaseAmount({
    receiptTotal: 230,
    taxRate: 0.126,
    taxIncludedInBill: true,
    serviceChargeRate: 0,
    serviceChargeEnabled: false,
    giftCardAmount: 0,
  })

  assert.deepEqual(result, {
    originalReceiptTotal: 230,
    giftCardAmount: 0,
    amountAfterGiftCard: 230,
    taxableChargeAmount: 28.98,
    serviceChargeAmount: 0,
    finalPriceAmount: 258.98,
    rewardableAmount: 230,
  })

  assert.equal(calculateMemberTransaction({
    purchaseAmount: result.rewardableAmount,
    rewardRatePercent: 20,
    commissionRatePercent: 10,
  }).pointsAwarded, 46)

  const resultWithGiftCard = calculateRewardablePurchaseAmount({
    receiptTotal: 230,
    taxRate: 0.126,
    taxIncludedInBill: true,
    serviceChargeRate: 0,
    serviceChargeEnabled: false,
    giftCardAmount: 230,
  })

  assert.deepEqual(resultWithGiftCard, {
    originalReceiptTotal: 230,
    giftCardAmount: 230,
    amountAfterGiftCard: 0,
    taxableChargeAmount: 28.98,
    serviceChargeAmount: 0,
    finalPriceAmount: 28.98,
    rewardableAmount: 230,
  })

  assert.equal(calculateMemberTransaction({
    purchaseAmount: resultWithGiftCard.rewardableAmount,
    rewardRatePercent: 20,
    commissionRatePercent: 10,
  }).pointsAwarded, 46)
})

runTest('early access content preserves the approved conversion copy', () => {
  assert.deepEqual(earlyAccessMessageLines, [
    'Hey,',
    'We are tired of watching people work hard and still struggle to pay for the lifestyle they want: vacations, financial freedom, and the extras that make life more enjoyable.',
    'That is why we are creating Guatemala Rewards, the highest-paying rewards program. Get between 20% and 100% back on many of the purchases you already make every day.',
    'No overspending. No complications. Just real value back to help you enjoy more of what you love.',
    'We are currently preparing our launch and inviting the first members before anyone else.',
    'When we officially launch, subscribers will be the first to know and will get access to exclusive benefits, updates, and special opportunities to maximize their rewards.',
  ])
})

runTest('early access subscribe form only exposes WhatsApp and email contact fields', () => {
  assert.deepEqual(earlyAccessSubscribeFields.map((field) => field.name), ['whatsapp', 'email'])
  assert.equal(earlyAccessSubscribeButtonLabel, 'Subscribe')
  assert.equal(earlyAccessSubscribePrompt, 'Enter your WhatsApp number and email')
})

runTest('ambassador content uses approved VIP creator positioning', () => {
  assert.equal(ambassadorVipHeadline, 'Join the VIP Creator Circle.')
  assert.equal(
    ambassadorVipSupportingCopy,
    'Guatemala Rewards is building a private network of creators, promoters, hosts, and social connectors who can introduce people to the best local businesses while unlocking exclusive rewards, VIP perks, and selected paid opportunities.',
  )
  assert.deepEqual(ambassadorCreatorSignals, [
    'Lifestyle creators',
    'Promoters',
    'Social connectors',
    'Hosts and community builders',
  ])
})

runTest('ambassador content keeps first-version offer and form language scoped', () => {
  assert.deepEqual(
    ambassadorPerks.map((perk) => [perk.title, perk.body]),
    [
      ['VIP rewards access', 'Get early access to member rewards, local offers, and private partner perks.'],
      [
        'Paid promoter opportunities',
        'Selected creators may be invited into paid campaigns and higher-value VIP options as the network grows.',
      ],
      ['Business discovery', 'Help people find places worth visiting, sharing, and coming back to.'],
    ],
  )
  assert.equal(ambassadorFormIntro, 'Tell us where you share recommendations and how we can reach you.')
  assert.equal(ambassadorSuccessTitle, "You're on the VIP creator list.")
  assert.equal(
    ambassadorSuccessMessage,
    'We saved your details. Our team will review your socials and contact you when creator opportunities open.',
  )
  assert.equal(ambassadorPrimaryCta, 'Submit VIP creator request')
})

runTest('global CSS restores the brand theme outside early access', () => {
  const css = readFileSync('src/index.css', 'utf8')

  assert.match(css, /--background:\s*#fbefe2/)
  assert.match(css, /--foreground:\s*#24190f/)
  assert.match(css, /--champagne:\s*#f2c978/)
  assert.doesNotMatch(css, /#root\s*\{[^}]*filter:\s*grayscale\(1\)/)
  assert.doesNotMatch(css, /App-wide neutral mode/)
  assert.match(css, /\.early-access-neutral/)
})

runTest('Guatemala Rewards logo assets use the exact transparent upload', () => {
  const fullLogo = readFileSync('public/guatemala-rewards-logo.png')
  const markLogo = readFileSync('public/guatemala-rewards-mark.png')
  const manifest = readFileSync('public/site.webmanifest', 'utf8')
  const brandLogo = readFileSync('src/components/brand-logo.tsx', 'utf8')

  assert.equal(existsSync('public/guatemala-rewards-logo.png'), true)
  assert.equal(existsSync('public/guatemala-rewards-mark.png'), true)
  assert.equal(fullLogo.subarray(1, 4).toString('ascii'), 'PNG')
  assert.equal(markLogo.subarray(1, 4).toString('ascii'), 'PNG')
  assert.equal(fullLogo[25], 6)
  assert.equal(markLogo[25], 6)
  assert.deepEqual(fullLogo, markLogo)
  assert.match(manifest, /\/guatemala-rewards-logo\.png/)
  assert.match(manifest, /"theme_color": "#F6F7F8"/)
  assert.match(brandLogo, /\/guatemala-rewards-logo\.png/)
  assert.doesNotMatch(brandLogo, /guatemala-rewards-(logo|mark)\.svg/)
  assert.match(brandLogo, /sr-only">Guatemala Rewards/)
})

runTest('admin portal header uses the restored warm theme', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const headerStart = adminPage.indexOf('warm-hero-muted relative min-w-0')
  const tabsStart = adminPage.indexOf('<Tabs value={activeAdminTab}')

  assert.ok(headerStart > -1)
  assert.ok(tabsStart > headerStart)

  const headerMarkup = adminPage.slice(headerStart, tabsStart)

  assert.match(headerMarkup, /text-\[var\(--cream\)\]/)
  assert.match(headerMarkup, /text-\[var\(--champagne\)\]/)
  assert.match(headerMarkup, /bg-\[var\(--cream\)\]\/12/)
  assert.doesNotMatch(headerMarkup, /border-neutral-200/)
  assert.doesNotMatch(headerMarkup, /bg-neutral-50/)
})

runTest('admin portal exposes early access lead workflow', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const earlyAccessService = readFileSync('src/integrations/supabase/services/early-access-service.ts', 'utf8')
  const adminHooks = readFileSync('src/hooks/use-admin-data.ts', 'utf8')

  assert.match(adminPage, /value="early-access"/)
  assert.match(adminPage, /Early Access Leads/)
  assert.match(adminPage, /earlyAccessLeadStatusOptions/)
  assert.match(earlyAccessService, /async getLeads\(/)
  assert.match(earlyAccessService, /async updateLeadStatus\(/)
  assert.match(adminHooks, /useAdminEarlyAccessLeads/)
  assert.match(adminHooks, /useUpdateEarlyAccessLeadStatus/)
})

runTest('admin early access rows label captured contact details', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const sectionStart = adminPage.indexOf('<TabsContent value="early-access"')
  const sectionEnd = adminPage.indexOf('<TabsContent value="referrals"')

  assert.ok(sectionStart > -1)
  assert.ok(sectionEnd > sectionStart)

  const earlyAccessSection = adminPage.slice(sectionStart, sectionEnd)

  assert.match(earlyAccessSection, /Contact Details/)
  assert.match(earlyAccessSection, /Name/)
  assert.match(earlyAccessSection, /Email/)
  assert.match(earlyAccessSection, /WhatsApp/)
  assert.match(earlyAccessSection, /Instagram/)
  assert.match(earlyAccessSection, /lead\.whatsapp/)
  assert.match(earlyAccessSection, /lead\.email/)
  assert.match(earlyAccessSection, /lead\.notes/)
})

runTest('reward cards use branded luxe artwork', () => {
  const cardFiles = [
    'src/features/rewards/components/reward-card.tsx',
    'src/features/shop/components/product-card.tsx',
    'src/features/gift-cards/components/gift-card-tile.tsx',
  ]

  for (const file of cardFiles) {
    const card = readFileSync(file, 'utf8')

    assert.match(card, /luxe-art/)
    assert.match(card, /text-\[var\(--cream\)\]/)
    assert.match(card, /--champagne/)
    assert.doesNotMatch(card, /bg-neutral-100/)
  }
})

runTest('promotion cards avoid overlapping admin badges and use branded contrast', () => {
  const promotionCard = readFileSync('src/features/rewards/components/promotion-card.tsx', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')

  assert.match(promotionCard, /businessName\?: string/)
  assert.match(promotionCard, /text-\[var\(--champagne\)\]/)
  assert.match(promotionCard, /bg-\[var\(--espresso-soft\)\]/)
  assert.match(promotionCard, /hover:border-primary\/30/)
  assert.doesNotMatch(promotionCard, /bg-neutral-100/)
  assert.match(adminPage, /businessName=\{businessNameById\.get\(promotion\.businessId\) \?\? 'Unknown partner'\}/)
  assert.doesNotMatch(adminPage, /absolute top-4 left-4 border-outline-variant\/20 bg-white\/90/)
})

runTest('referral approval can award credits before ID verification but still blocks credit use', () => {
  const migration = readFileSync('supabase/migrations/20260519000200_fix_referral_approval_credit_awards.sql', 'utf8')

  assert.match(migration, /create or replace function public\.enforce_verified_profile_value_action/)
  assert.match(migration, /new\.available_credits >= old\.available_credits/)
  assert.match(migration, /insert into public\.reward_balances \(profile_id\)/)
  assert.match(migration, /on conflict \(profile_id\) do nothing/)
  assert.match(migration, /create or replace function public\.approve_referral/)
  assert.match(migration, /grant execute on function public\.approve_referral\(uuid, uuid\) to authenticated/)
})

runTest('landing page content follows the approved QR-first wording', () => {
  assert.equal(landingHeroEyebrow, 'BUSINESS-CODED QR REWARDS FOR GUATEMALA')
  assert.deepEqual(landingHeroHeadline, {
    beforeHighlight: 'Scan once. ',
    highlight: 'Join locally.',
    afterHighlight: ' Earn rewards with Guatemala partners.',
  })
  assert.equal(landingTagline, 'Scan once. Join locally. Earn rewards with Guatemala partners.')
  assert.equal(
    landingBody,
    'Guatemala Rewards gives each partner business its own scannable on-site entry point, so customers can learn, join, and start earning from the place they already visited.',
  )
  assert.deepEqual(landingHeroInfoRows.map((row) => row.text), [
    'Individually coded 5x5 inch QR stickers for each partner business',
    'Business-specific landing pages that explain the program and capture member signups',
  ])
  assert.deepEqual(landingHeroPills.map((pill) => pill.label), [
    'Cafes, hotels & restaurants',
    'Local member rewards',
    'Business-coded QR stickers',
    'Built for Guatemala',
  ])
  assert.equal(landingJoinButtonLabel, 'Join Guatemala Rewards')
  assert.deepEqual(landingTags, [
    'Individually coded 5x5 inch QR stickers for each partner business',
    'Business-specific landing pages that explain the program and capture member signups',
  ])
  assert.deepEqual(landingOfferLines, [
    'Partner QR rollout',
    'Business-specific code',
    '5x5 inch sticker',
    'Scan. Join. Earn.',
  ])
  assert.deepEqual(landingFaqQuestions, [
    'What does each partner QR do?',
    'Where should the QR sticker go?',
    'Does the customer need an app first?',
    'How does the business flow work?',
  ])
})

runTest('landing page content covers the client requested topics', () => {
  const landingContent = readFileSync('src/features/auth/landing-content.ts', 'utf8')

  assert.match(landingContent, /landingWhyJoinItems/)
  assert.match(landingContent, /landingEarlySubscriberBenefits/)
  assert.match(landingContent, /landingRewardsSteps/)
  assert.match(landingContent, /landingMembershipAdvantages/)
})

runTest('landing page FAQs are clickable and include answers', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /<details/)
  assert.match(landingPage, /<summary/)
  assert.match(landingPage, /faqs\.map/)
  assert.match(landingPage, /answer:/)
  assert.match(landingPage, /business-specific Guatemala Rewards landing page/)
  assert.match(landingPage, /member QR/)
})

runTest('landing FAQ and footer follow the Figma lower page', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /id="faq"/)
  assert.match(landingPage, /max-w-\[700px\]/)
  assert.match(landingPage, /min-h-\[58px\]/)
  assert.match(landingPage, /rounded-\[7px\] border border-\[#dfe3e8\] bg-\[#ffffff\]/)
  assert.match(landingPage, /MapPin/)
  assert.match(landingPage, /BadgeCheck/)
  assert.match(landingPage, /DollarSign/)
  assert.doesNotMatch(landingPage, /ChevronRight/)
  assert.match(landingPage, /min-h-\[86px\]/)
  assert.match(landingPage, /md:grid-cols-\[1fr_auto_1fr\]/)
  assert.match(landingPage, /max-w-\[1336px\]/)
})

runTest('client landing page renders the screenshot sections', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')

  assert.match(landingPage, /Earn rewards<\/span>/)
  assert.match(landingPage, /Partner QR sticker rollout/)
  assert.match(landingPage, /Scan\. Join\. Earn\./)
  assert.match(landingPage, /id="how-it-works"/)
  assert.match(landingPage, /steps\.map/)
  assert.match(landingPage, /faqs\.map/)
})

runTest('landing Figma reference asset is stored with app assets', () => {
  assert.equal(existsSync('src/assets/guatemala-landing.png'), true)
})

runTest('member signup page uses the compact member portal layout', () => {
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')
  const compactJoinStart = joinPage.indexOf('export function CompactJoinRewardsPage')
  const splitJoinStart = joinPage.indexOf('export function SplitJoinRewardsPage')
  const compactJoin = joinPage.slice(compactJoinStart, splitJoinStart)

  assert.match(joinPage, /export function JoinRewardsPage\(\) {\s*return <CompactJoinRewardsPage \/>/)
  assert.match(compactJoin, /AuthPortalShell activeTab="signup"/)
  assert.match(compactJoin, /Guatemala Rewards/)
  assert.match(compactJoin, /t\('Member Portal'\)\.toUpperCase\(\)/)
  assert.match(compactJoin, /Create my account/)
  assert.match(compactJoin, /Already have an account\?/)
  assert.doesNotMatch(compactJoin, /heroImage/)
  assert.doesNotMatch(compactJoin, /Spend \$X locally/)
  assert.doesNotMatch(compactJoin, /Why we verify members/)
  assert.doesNotMatch(compactJoin, /bg-\[#24150e\]/)
})

runTest('member signup schema no longer requires member QR fields', () => {
  const forms = readFileSync('src/types/forms.ts', 'utf8')
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')
  const referralPage = readFileSync('src/features/referrals/pages/referral-register-page.tsx', 'utf8')
  const authService = readFileSync('src/integrations/supabase/services/auth-service.ts', 'utf8')

  assert.match(forms, /export const memberSignUpSchema = authSchema\.extend\(\{[\s\S]*role: z\.literal\('customer'\)/)
  assert.match(forms, /phone: z\.string\(\)\.trim\(\)\.min\(8, 'Enter your WhatsApp or phone number'\)/)
  assert.match(forms, /export type MemberSignUpSubmission = MemberSignUpFormValues/)
  assert.match(joinPage, /WhatsApp or phone/)
  assert.match(referralPage, /WhatsApp or phone/)
  assert.match(authService, /phone,\s*\n\s*\}/)
  assert.doesNotMatch(forms, /MemberSignUpSubmission = MemberSignUpFormValues & \{\s*verificationDocument: File/)
  assert.doesNotMatch(joinPage, /verificationDocument/)
  assert.doesNotMatch(joinPage, /verificationIdNumber/)
  assert.doesNotMatch(referralPage, /verificationDocument/)
  assert.doesNotMatch(referralPage, /verificationIdNumber/)
  assert.doesNotMatch(authService, /validateVerificationDocument\(input\.verificationDocument\)/)
  assert.doesNotMatch(authService, /MEMBER_VERIFICATION_BUCKET/)
})

runTest('profile verification remains an optional future ID upload path after signup', () => {
  const profilePage = readFileSync('src/features/profile/pages/profile-page.tsx', 'utf8')
  const profileService = readFileSync('src/integrations/supabase/services/profile-service.ts', 'utf8')
  const forms = readFileSync('src/types/forms.ts', 'utf8')

  assert.match(forms, /export const memberVerificationSchema/)
  assert.match(forms, /export type MemberVerificationSubmission = MemberVerificationFormValues & \{\s*verificationDocument: File\s*\}/)
  assert.match(profilePage, /Future ID verification/)
  assert.match(profilePage, /Submit optional ID/)
  assert.match(profilePage, /ID is not required during launch/)
  assert.match(profilePage, /verificationForm\.register\('verificationIdNumber'\)/)
  assert.match(profileService, /validateVerificationDocument\(values\.verificationDocument\)/)
  assert.match(profileService, /submit_member_verification/)
})

runTest('new customer auth trigger allows account creation before ID submission', () => {
  const migration = readFileSync('supabase/migrations/20260512000000_member_identity_verification.sql', 'utf8')
  const forwardMigration = readFileSync(
    'supabase/migrations/20260608000000_allow_member_signup_without_verification_id.sql',
    'utf8',
  )
  const launchMigration = readFileSync(
    'supabase/migrations/20260705010000_launch_contact_signup_relax_id_verification.sql',
    'utf8',
  )

  assert.doesNotMatch(migration, /Verification ID is required for member signup/)
  assert.doesNotMatch(migration, /Verification document is required for member signup/)
  assert.match(migration, /else 'not_submitted'/)
  assert.match(forwardMigration, /create or replace function public\.handle_new_user/)
  assert.doesNotMatch(forwardMigration, /Verification ID is required for member signup/)
  assert.doesNotMatch(forwardMigration, /Verification document is required for member signup/)
  assert.match(forwardMigration, /else 'not_submitted'/)
  assert.match(launchMigration, /new_phone/)
  assert.match(launchMigration, /phone,/)
  assert.match(launchMigration, /coalesce\(new_phone, ''\)/)
})

runTest('landing Join CTAs go to invitation', () => {
  const landingPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  const authPageStart = landingPage.indexOf('export function LegacyAuthPage')
  const landingMarkup = landingPage.slice(0, authPageStart)

  assert.ok((landingMarkup.match(/to="\/invitation"/g) ?? []).length >= 2)
  assert.doesNotMatch(landingMarkup, /to="\/early-access"/)
  assert.doesNotMatch(landingMarkup, /to="\/join"/)
  assert.match(landingPage, /min-h-\[61px\]/)
  assert.match(landingPage, /How it works/)
  assert.match(landingPage, /Businesses/)
  assert.match(landingPage, /FAQ/)
  assert.match(landingPage, /Join now/)
  assert.match(landingPage, /Join Guatemala Rewards/)
  assert.match(landingPage, /Partner QR sticker rollout/)
  assert.doesNotMatch(landingPage, /leadModalOpen/)
  assert.doesNotMatch(landingPage, /memberLeadSchema/)
})

runTest("landing QR rollout section follows the client-focused design", () => {
  const landingPage = readFileSync("src/features/auth/pages/landing-page.tsx", "utf8")

  assert.match(landingPage, /Partner QR sticker rollout/)
  assert.match(landingPage, /5x5 inch sticker/)
  assert.match(landingPage, /Business-specific code/)
  assert.match(landingPage, /Scan\. Join\. Earn\./)
  assert.match(landingPage, /View member terms/)
})

runTest("landing rewards system section explains the QR-first flow", () => {
  const landingPage = readFileSync("src/features/auth/pages/landing-page.tsx", "utf8")

  assert.match(landingPage, /id="how-it-works"/)
  assert.match(landingPage, /steps\.map/)
  assert.match(landingPage, /lg:grid-cols-4/)
  assert.match(landingPage, /rounded-\[10px\] border border-\[#dfe3e8\] bg-\[#ffffff\]/)
  assert.match(landingPage, /size-\[36px\]/)
  assert.match(landingPage, /The QR-first path Shaun wants finished first/)
  assert.match(landingPage, /Partner staff scan the member QR/)
})

runTest('early access CTA opens a lead capture modal', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')

  assert.match(earlyAccessPage, /early-access-neutral/)
  assert.match(earlyAccessPage, /Dialog open=\{leadModalOpen\}/)
  assert.match(earlyAccessPage, /earlyAccessModalSchema/)
  assert.match(earlyAccessPage, /earlyAccessService\.createLead/)
  assert.match(earlyAccessPage, /leadForm\.register\('fullName'\)/)
  assert.match(earlyAccessPage, /leadForm\.register\('whatsapp'\)/)
  assert.match(earlyAccessPage, /leadForm\.register\('instagram'\)/)
  assert.match(earlyAccessPage, /leadForm\.register\('email'\)/)
  assert.match(earlyAccessPage, /Instagram/)
  assert.match(earlyAccessPage, /email: z\.string\(\)\.trim\(\)\.min\(1, 'Enter your email'\)\.pipe\(z\.email\('Enter a valid email'\)\)/)
  assert.ok((earlyAccessPage.match(/bg-\[#16a34a\]/g) ?? []).length >= 2)
})

runTest('early access sends welcome email after saving lead without blocking success', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')
  const emailClient = readFileSync('src/features/early-access/welcome-email-service.ts', 'utf8')

  assert.match(earlyAccessPage, /sendEarlyAccessWelcomeEmail/)
  assert.match(emailClient, /\/api\/send-welcome-email/)

  const createLeadIndex = earlyAccessPage.indexOf('earlyAccessService.createLead')
  const sendEmailIndex = earlyAccessPage.indexOf('await sendEarlyAccessWelcomeEmail')
  const resetIndex = earlyAccessPage.indexOf('leadForm.reset(defaultValues)')
  const emailFailureStart = earlyAccessPage.indexOf('catch (emailError)')
  const emailFailureEnd = earlyAccessPage.indexOf('leadForm.reset(defaultValues)')
  const emailFailureBlock = earlyAccessPage.slice(emailFailureStart, emailFailureEnd)

  assert.ok(createLeadIndex > -1)
  assert.ok(sendEmailIndex > createLeadIndex)
  assert.ok(resetIndex > sendEmailIndex)
  assert.match(earlyAccessPage, /email: lead\.email/)
  assert.match(emailFailureBlock, /console\.warn/)
  assert.doesNotMatch(emailFailureBlock, /setSubmitError/)
})

runTest('early access public lead capture submits through the same-origin API', () => {
  const earlyAccessService = readFileSync('src/integrations/supabase/services/early-access-service.ts', 'utf8')
  const createLeadStart = earlyAccessService.indexOf('async createLead')
  const getLeadsStart = earlyAccessService.indexOf('async getLeads')
  const createLeadBlock = earlyAccessService.slice(createLeadStart, getLeadsStart)

  assert.ok(createLeadStart > -1)
  assert.ok(getLeadsStart > createLeadStart)
  assert.match(createLeadBlock, /fetch\('\/api\/early-access-leads'/)
  assert.doesNotMatch(createLeadBlock, /\.rpc\('create_early_access_lead'/)
})

runTest('early access API creates leads through Supabase server-side', () => {
  assert.ok(existsSync('api/early-access-leads.ts'))

  const api = readFileSync('api/early-access-leads.ts', 'utf8')

  assert.match(api, /createClient/)
  assert.match(api, /rpc\('create_early_access_lead'/)
  assert.match(api, /process\.env\.SUPABASE_URL/)
  assert.match(api, /process\.env\.SUPABASE_ANON_KEY/)
})

runTest('early access lead capture hides raw browser load failures', () => {
  const earlyAccessService = readFileSync('src/integrations/supabase/services/early-access-service.ts', 'utf8')
  const createLeadStart = earlyAccessService.indexOf('async createLead')
  const getLeadsStart = earlyAccessService.indexOf('async getLeads')
  const createLeadBlock = earlyAccessService.slice(createLeadStart, getLeadsStart)

  assert.match(createLeadBlock, /catch \(/)
  assert.match(createLeadBlock, /Unable to join the early access list\./)
  assert.doesNotMatch(createLeadBlock, /throw new Error\(error\.message\)/)
})

runTest('public invitation route renders the early access page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const invitationRouteStart = router.indexOf("path: '/invitation'")
  const earlyAccessRouteStart = router.indexOf("path: '/early-access'")
  const invitationRoute = router.slice(invitationRouteStart, earlyAccessRouteStart)

  assert.ok(invitationRouteStart > -1)
  assert.match(invitationRoute, /element: <EarlyAccessPage \/>/)
})

runTest('legacy early access route redirects to invitation', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const earlyAccessRouteStart = router.indexOf("path: '/early-access'")
  const landingRouteStart = router.indexOf("path: '/landing-page'")
  const legacyRoute = router.slice(earlyAccessRouteStart, landingRouteStart)

  assert.ok(earlyAccessRouteStart > -1)
  assert.match(legacyRoute, /<Navigate replace to="\/invitation" \/>/)
})

runTest('welcome email does not expose the legacy early access URL', () => {
  const api = readFileSync('api/send-welcome-email.ts', 'utf8')

  assert.doesNotMatch(api, /\/early-access/)
})

runTest('welcome email API uses server-only Hostinger SMTP settings', () => {
  const api = readFileSync('api/send-welcome-email.ts', 'utf8')
  const envExample = readFileSync('.env.example', 'utf8')
  const packageJson = readFileSync('package.json', 'utf8')

  assert.match(api, /nodemailer/)
  assert.match(api, /createTransport/)
  assert.match(api, /process\.env\.SMTP_HOST/)
  assert.match(api, /process\.env\.SMTP_PORT/)
  assert.match(api, /process\.env\.SMTP_SECURE/)
  assert.match(api, /process\.env\.SMTP_USER/)
  assert.match(api, /process\.env\.SMTP_PASS/)
  assert.match(api, /process\.env\.SMTP_FROM/)
  assert.match(api, /Welcome to Guatemala Rewards/)
  assert.match(api, /private rewards experience for women who enjoy beautiful places/)
  assert.match(api, /elevated moments/)
  assert.match(api, /lifestyle they already love/)
  assert.match(api, /selected invitations, rewards opportunities, and member updates/)
  assert.match(api, /Selected invitations and early rewards opportunities will be shared/)
  assert.match(api, /html:/)
  assert.match(api, /text:/)
  assert.match(envExample, /SMTP_HOST=smtp\.hostinger\.com/)
  assert.match(envExample, /SMTP_USER=info@guatemalarewards\.com/)
  assert.match(packageJson, /"nodemailer"/)

  for (const source of [api, envExample, packageJson]) {
    assert.doesNotMatch(source, /VITE_SMTP/)
  }
})

runTest('root route redirects to the actual landing page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const rootRouteStart = router.indexOf('function RootRoute()')
  const protectedRouteStart = router.indexOf('function ProtectedCustomerRoute()')
  const rootRoute = router.slice(rootRouteStart, protectedRouteStart)

  assert.match(rootRoute, /<Navigate replace to="\/landing-page" \/>/)
  assert.doesNotMatch(rootRoute, /<EarlyAccessPage \/>/)
  assert.doesNotMatch(rootRoute, /<LandingPage \/>/)
  assert.doesNotMatch(rootRoute, /landing-header-figma/)
})

runTest('client landing page is available at /landing-page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')

  assert.match(router, /path: '\/landing-page'/)
  assert.match(router, /element: <LandingPage \/>/)
})

runTest('platform guide is a Spanish-first video-ready onboarding page', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const guidePage = readFileSync('src/features/platform-guide/pages/platform-guide-page.tsx', 'utf8')
  const simpleWalkthrough = readFileSync('docs/spanish-team-walkthrough-copy-paste.md', 'utf8')
  const completeWalkthrough = readFileSync('docs/complete-role-walkthrough.md', 'utf8')
  const summaryWalkthrough = readFileSync('docs/spanish-team-walkthrough-summary.md', 'utf8')
  const publicLayout = readFileSync('src/layouts/public-browse-layout.tsx', 'utf8')
  const adminLayout = readFileSync('src/layouts/admin-layout.tsx', 'utf8')
  const businessLayout = readFileSync('src/layouts/business-owner-layout.tsx', 'utf8')
  const businessPolicy = readFileSync('src/lib/business-role-policy.ts', 'utf8')
  const packageJson = readFileSync('package.json', 'utf8')
  const guideConfig = readFileSync('playwright.guide.config.ts', 'utf8')
  const localConfig = readFileSync('playwright.local.config.ts', 'utf8')
  const guideRunner = readFileSync('scripts/run-guide-playwright.mjs', 'utf8')
  const localRunner = readFileSync('scripts/run-playwright-local.mjs', 'utf8')
  const guideSpec = readFileSync('tests/e2e/platform-guide.spec.ts', 'utf8')
  const guideAuthSpec = readFileSync('tests/e2e/platform-guide-auth.spec.ts', 'utf8')

  assert.match(router, /path: '\/guide', element: <PlatformGuidePage \/>/)
  assert.match(router, /path: '\/admin\/guide', element: <PlatformGuidePage \/>/)
  assert.match(router, /path: '\/business\/guide', element: <PlatformGuidePage \/>/)

  assert.match(guidePage, /Guia de la plataforma/)
  assert.match(guidePage, /Video aqui proximamente/)
  assert.doesNotMatch(guidePage, /Guion en espanol/)
  assert.doesNotMatch(guidePage, /Script base para grabar/)
  assert.doesNotMatch(guidePage, /Recording script/)
  assert.doesNotMatch(guidePage, /Presentation notes/)
  assert.match(guidePage, /Storyboard con pantallas/)
  assert.match(guidePage, /English version/)
  assert.doesNotMatch(guidePage, /scriptsByLanguage/)
  assert.match(guidePage, /guideContent/)
  assert.match(guidePage, /useLanguage/)
  assert.match(guidePage, /storyboard/)
  assert.match(guidePage, /\/shop/)
  assert.match(guidePage, /\/business\/redemptions/)
  assert.match(guidePage, /with or without a gift card/)
  assert.match(guidePage, /Optional gift card/)
  assert.match(guidePage, /\/admin\/portal#members/)

  for (const walkthrough of [simpleWalkthrough, completeWalkthrough, summaryWalkthrough]) {
    assert.match(walkthrough, /\/business\/redemptions/)
    assert.match(walkthrough, /Process Without Gift Card|without a gift card/i)
    assert.match(walkthrough, /Process With Gift Card|gift-card sale|gift card sales/i)
    assert.match(walkthrough, /Rewards Rate|reward rate/i)
    assert.match(walkthrough, /tax/i)
    assert.match(walkthrough, /service charge/i)
    assert.match(walkthrough, /Transaction History/i)
  }

  assert.match(publicLayout, /to: '\/guide', label: 'Guia'/)
  assert.match(adminLayout, /to: '\/admin\/guide', label: 'Guia'/)
  assert.match(adminLayout, /to="\/admin\/guide"/)
  assert.match(businessLayout, /to: '\/business\/guide', label: 'Guia'/)
  assert.match(businessPolicy, /'\/business\/guide'/)
  assert.match(packageJson, /"test:guide": "node scripts\/run-guide-playwright\.mjs"/)
  assert.match(packageJson, /"test:playwright": "node scripts\/run-playwright-local\.mjs"/)
  assert.match(guideConfig, /defineConfig/)
  assert.match(guideConfig, /Desktop Chrome/)
  assert.doesNotMatch(guideConfig, /webServer/)
  assert.match(localConfig, /defineConfig/)
  assert.match(localConfig, /Desktop Chrome/)
  assert.doesNotMatch(localConfig, /webServer/)
  assert.match(guideRunner, /createServer/)
  assert.match(guideRunner, /platform-guide\.spec\.ts/)
  assert.match(guideRunner, /platform-guide-auth\.spec\.ts/)
  assert.match(guideRunner, /E2E_AUTH_ENABLED/)
  assert.match(guideRunner, /server\.close/)
  assert.match(localRunner, /createServer/)
  assert.match(localRunner, /process\.argv\.slice\(2\)/)
  assert.match(localRunner, /playwright\.local\.config\.ts/)
  assert.match(localRunner, /server\.close/)
  assert.match(guideSpec, /public guide explains the platform with Spanish-first video-ready content/)
  assert.match(guideSpec, /public guide follows the English language preference without Spanish guide copy/)
  assert.match(guideSpec, /guatemalarewards-language/)
  assert.match(guideAuthSpec, /authenticated platform guide workflow/)
  assert.match(guideAuthSpec, /workflowAuthEnabled/)
})

runTest('app version is installable as a PWA with online-required messaging', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    devDependencies?: Record<string, string>
  }
  const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8')) as {
    display?: string
    orientation?: string
    shortcuts?: Array<{ url?: string }>
  }
  const viteConfig = readFileSync('vite.config.ts', 'utf8')
  const indexHtml = readFileSync('index.html', 'utf8')
  const main = readFileSync('src/main.tsx', 'utf8')
  const app = readFileSync('src/App.tsx', 'utf8')
  const installPrompt = readFileSync('src/components/app-install-prompt.tsx', 'utf8')
  const offlineNotice = readFileSync('src/components/offline-notice.tsx', 'utf8')

  assert.ok(packageJson.devDependencies?.['vite-plugin-pwa'])
  assert.match(viteConfig, /VitePWA/)
  assert.match(viteConfig, /registerType: 'autoUpdate'/)
  assert.match(viteConfig, /manifest: false/)
  assert.match(viteConfig, /navigateFallback: '\/index\.html'/)
  assert.match(main, /registerSW/)
  assert.match(app, /<OfflineNotice \/>/)
  assert.match(app, /<AppInstallPrompt \/>/)
  assert.match(indexHtml, /apple-mobile-web-app-capable/)
  assert.match(indexHtml, /apple-mobile-web-app-status-bar-style/)

  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.orientation, 'portrait')
  assert.ok(manifest.shortcuts?.some((shortcut) => shortcut.url === '/profile?source=pwa-shortcut'))
  assert.ok(manifest.shortcuts?.some((shortcut) => shortcut.url === '/business/dashboard?source=pwa-shortcut'))
  assert.ok(manifest.shortcuts?.some((shortcut) => shortcut.url === '/guide?source=pwa-shortcut'))

  assert.match(installPrompt, /beforeinstallprompt/)
  assert.match(installPrompt, /Add to Home Screen/)
  assert.match(installPrompt, /localStorage/)
  assert.match(offlineNotice, /navigator\.onLine/)
  assert.match(offlineNotice, /QR sale recording/)
  assert.match(offlineNotice, /admin operations/)
})

runTest('native app wrapper is configured for Android and iOS distribution', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const capacitorConfig = readFileSync('capacitor.config.ts', 'utf8')
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const androidManifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8')
  const androidStrings = readFileSync('android/app/src/main/res/values/strings.xml', 'utf8')
  const iosInfo = readFileSync('ios/App/App/Info.plist', 'utf8')

  for (const dependency of ['@capacitor/core', '@capacitor/cli', '@capacitor/android', '@capacitor/ios', '@capacitor/app']) {
    assert.ok(packageJson.devDependencies?.[dependency])
  }

  assert.equal(packageJson.scripts?.['native:sync'], 'npm run build && cap sync')
  assert.equal(packageJson.scripts?.['android:sync'], 'npm run build && cap sync android')
  assert.equal(packageJson.scripts?.['ios:sync'], 'npm run build && cap sync ios')
  assert.match(capacitorConfig, /appId: 'com\.guatemalarewards\.app'/)
  assert.match(capacitorConfig, /appName: 'Guatemala Rewards'/)
  assert.match(capacitorConfig, /webDir: 'dist'/)

  assert.match(router, /@capacitor\/app/)
  assert.match(router, /appUrlOpen/)
  assert.match(router, /url\.protocol === 'guatemalarewards:'/)
  assert.match(router, /navigate\(path\)/)

  assert.match(androidManifest, /android:name="android\.permission\.CAMERA"/)
  assert.match(androidManifest, /android:screenOrientation="portrait"/)
  assert.match(androidManifest, /android:scheme="guatemalarewards"/)
  assert.match(androidStrings, /<string name="custom_url_scheme">guatemalarewards<\/string>/)
  assert.match(iosInfo, /CFBundleURLTypes/)
  assert.match(iosInfo, /<string>guatemalarewards<\/string>/)
  assert.match(iosInfo, /NSCameraUsageDescription/)
})

runTest('responsive audit covers mobile access across public and protected routes', () => {
  const responsiveAudit = readFileSync('scripts/audit-responsive.mjs', 'utf8')
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

  assert.equal(packageJson.scripts?.['test:responsive'], 'node scripts/audit-responsive.mjs')
  assert.match(responsiveAudit, /small-mobile/)
  assert.match(responsiveAudit, /width:\s*360/)
  assert.match(responsiveAudit, /clippedInteractiveElements/)
  assert.match(responsiveAudit, /process\.exitCode = 1/)

  for (const route of [
    '/signin',
    '/reset-password',
    '/business/login',
    '/admin',
    '/promo/register',
    '/ambassadors',
    '/privacy',
    '/reward-terms',
    '/verification-policy',
    '/cost-calculator',
    '/shop',
    '/dashboard',
    '/wallet/gift-cards/demo-card',
    '/admin/portal',
    '/business/member-sale/demo-token',
    '/business/members',
    '/business/settings',
  ]) {
    assert.match(responsiveAudit, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

runTest('member auth pages use the approved portal layouts', () => {
  const authShell = readFileSync('src/features/auth/components/auth-portal-shell.tsx', 'utf8')
  const authPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')
  const staffPage = readFileSync('src/features/auth/pages/staff-login-page.tsx', 'utf8')

  assert.match(authShell, /auth-portal-shell/)
  assert.match(authShell, /auth-portal-backdrop/)
  assert.match(authShell, /radial-gradient/)
  assert.match(authShell, /linear-gradient/)
  assert.doesNotMatch(authShell, /<main className="auth-portal-shell[^"]*bg-\[#000000\]/)
  assert.match(authShell, /ThemeToggle/)
  assert.match(authShell, /LanguagePicker/)
  assert.match(authShell, /useLanguage/)
  assert.match(authShell, /color-mix\(in_srgb,var\(--surface-container-lowest\)/)
  assert.match(authShell, /border-\[#d1ad4a\]/)
  assert.match(authShell, /to="\/signin"/)
  assert.match(authShell, /to="\/join"/)
  assert.match(authShell, /activeTab === 'signin'/)
  assert.match(authShell, /activeTab === 'signup'/)
  assert.match(authPage, /export function AuthPage\(\) {\s*return <CompactAuthPage \/>/)
  assert.match(joinPage, /export function JoinRewardsPage\(\) {\s*return <CompactJoinRewardsPage \/>/)
  assert.match(joinPage, /activeTab="signup"/)
  assert.match(staffPage, /AuthPortalShell showTabs=\{false\}/)
  assert.match(staffPage, /t\('Admin Portal'\)/)
  assert.match(staffPage, /t\('Business Portal'\)/)
  assert.doesNotMatch(staffPage, /Business Access/)
  assert.doesNotMatch(staffPage, /min-h-\[31rem\]/)
})

runTest('member sign in page follows the compact member portal layout', () => {
  const authPage = readFileSync('src/features/auth/pages/landing-page.tsx', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')
  const authSectionStart = authPage.indexOf('export function CompactAuthPage')
  const authSectionEnd = authPage.indexOf('export function AuthPage')
  const authSection = authPage.slice(authSectionStart, authSectionEnd)

  assert.match(authSection, /AuthPortalShell activeTab="signin"/)
  assert.match(authSection, /Guatemala Rewards/)
  assert.match(authSection, /t\('Member Portal'\)\.toUpperCase\(\)/)
  assert.doesNotMatch(authSection, /Back to landing page/)
  assert.doesNotMatch(authSection, /Welcome Back/)
  assert.match(authSection, /id="signin-email"/)
  assert.match(authSection, /id="signin-password"/)
  assert.match(authSection, /t\('Forgot password\?'\)/)
  assert.match(authSection, /t\('Sign in to my account'\)/)
  assert.match(authSection, /t\("Don't have an account\?"\)/)
  assert.match(authSection, /t\('Join Guatemala Rewards'\)/)
  assert.match(language, /'Member Portal': 'Portal de miembro'/)
  assert.match(authSection, /Eye/)
  assert.doesNotMatch(authSection, /min-h-\[31rem\]/)
})

runTest('member signup page follows the compact member portal layout', () => {
  const joinPage = readFileSync('src/features/join/pages/join-rewards-page.tsx', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')
  const compactJoinStart = joinPage.indexOf('export function CompactJoinRewardsPage')
  const splitJoinStart = joinPage.indexOf('export function SplitJoinRewardsPage')
  const activeJoin = joinPage.slice(compactJoinStart, splitJoinStart)

  assert.match(joinPage, /export function JoinRewardsPage\(\) {\s*return <CompactJoinRewardsPage \/>/)
  assert.match(activeJoin, /AuthPortalShell activeTab="signup"/)
  assert.match(activeJoin, /Guatemala Rewards/)
  assert.match(activeJoin, /t\('Member Portal'\)\.toUpperCase\(\)/)
  assert.match(activeJoin, /id="join-name"/)
  assert.match(activeJoin, /id="join-email"/)
  assert.match(activeJoin, /id="join-password"/)
  assert.match(activeJoin, /t\('Create my account'\)/)
  assert.match(activeJoin, /t\('Already have an account\?'\)/)
  assert.match(activeJoin, /t\('Sign in'\)/)
  assert.match(language, /'Create my account': 'Crear mi cuenta'/)
  assert.match(language, /'Already have an account\?': 'Ya tienes cuenta\?'/)
  assert.match(activeJoin, /Eye/)
  assert.doesNotMatch(activeJoin, /min-h-\[31rem\]/)
  assert.doesNotMatch(activeJoin, /soft-luxe-shell/)
  assert.doesNotMatch(activeJoin, /gold-frame/)
})

runTest('early access typography keeps the launch copy readable', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')

  assert.match(earlyAccessPage, /font-sans/)
  assert.match(earlyAccessPage, /earlyAccessParagraphClass/)
  assert.match(earlyAccessPage, /earlyAccessMessageLines\.slice\(0, 6\)\.map/)
  assert.match(earlyAccessPage, /earlyAccessMessageLines\.slice\(6, 8\)\.map/)
  assert.doesNotMatch(earlyAccessPage, /text-\[clamp\(/)
  assert.doesNotMatch(earlyAccessPage, /text-3xl/)
  assert.doesNotMatch(earlyAccessPage, /text-2xl/)
  assert.doesNotMatch(earlyAccessPage, /text-8xl/)
  assert.doesNotMatch(earlyAccessPage, /text-7xl/)
  assert.doesNotMatch(earlyAccessPage, /text-6xl/)
})

runTest('early access page defaults to Spanish and exposes language picker', () => {
  const earlyAccessPage = readFileSync('src/features/early-access/pages/early-access-page.tsx', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')
  const languagePicker = readFileSync('src/components/language-picker.tsx', 'utf8')

  assert.match(language, /if \(typeof window === 'undefined'\) return 'es'/)
  assert.match(language, /=== 'en' \? 'en' : 'es'/)
  assert.match(languagePicker, /\(\['es', 'en'\] as Language\[\]\)/)
  assert.match(earlyAccessPage, /LanguagePicker/)
  assert.match(earlyAccessPage, /t\(line\)/)
  assert.match(language, /'Hey,': 'Hola,'/)
  assert.match(language, /'Subscribe': 'Suscribirse'/)
  assert.match(language, /'When we officially launch, subscribers will be the first to know/)
})

runTest('early access English source copy has Spanish translations', () => {
  const content = readFileSync('src/features/early-access/early-access-content.ts', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')

  assert.equal(earlyAccessMessageLines[0], 'Hey,')
  assert.doesNotMatch(content, /'Hola:'/)
  assert.doesNotMatch(content, /Estamos cansados/)
  assert.match(language, /'Hey,': 'Hola,'/)
  assert.match(language, /We are tired of watching people work hard/)
  assert.match(language, /That is why we are creating Guatemala Rewards/)
  assert.match(language, /No overspending\. No complications/)
  assert.match(language, /We are currently preparing our launch/)
})

runTest('all literal translated UI strings have Spanish entries', () => {
  const languageSource = readFileSync('src/lib/language.tsx', 'utf8')
  const translationsSource = languageSource.match(
    /const spanishTranslations: Record<string, string> = \{([\s\S]*?)\n\}/,
  )?.[1]

  assert.ok(translationsSource)

  const translatedKeys = new Set<string>()
  const translationKeyPattern =
    /(?:^|\n)\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z][A-Za-z0-9_]*))\s*:/g

  for (const match of translationsSource.matchAll(translationKeyPattern)) {
    translatedKeys.add(match[1] ?? match[2] ?? match[3])
  }

  const usedKeys = new Set<string>()
  const literalTranslationPattern = /\bt\(\s*(?:'([^']+)'|"([^"]+)")/g

  for (const value of Object.values(landingClientHero)) {
    usedKeys.add(value)
  }

  for (const item of [
    ...landingWhyJoinItems,
    ...landingEarlySubscriberBenefits,
    ...landingRewardsSteps,
    ...landingMembershipAdvantages,
  ]) {
    usedKeys.add(item.title)
    usedKeys.add(item.body)
  }

  for (const filePath of getSourceFiles('src')) {
    const source = readFileSync(filePath, 'utf8')

    for (const match of source.matchAll(literalTranslationPattern)) {
      usedKeys.add(match[1] ?? match[2])
    }
  }

  const missingKeys = [...usedKeys].filter((key) => !translatedKeys.has(key)).sort()

  if (missingKeys.length > 0) {
    console.error(`Missing Spanish translation keys:\n${missingKeys.join('\n')}`)
  }

  assert.deepEqual(missingKeys, [])
})

runTest('supabase seed can be rerun without duplicate seeded rows', () => {
  const seed = readFileSync('supabase/seed.sql', 'utf8')

  assert.match(seed, /insert into public\.businesses[\s\S]*on conflict \(slug\) do update/i)
  assert.match(seed, /to_regclass\('public\.business_branding'\)/i)
  assert.match(seed, /insert into public\.business_branding/i)
  assert.match(seed, /unsupported_required_columns/i)
  assert.match(seed, /array_append\(insert_columns, 'slug'\)/i)
  assert.match(seed, /status_data_type = 'USER-DEFINED'/i)
  assert.match(seed, /status_udt_schema/i)
  assert.match(seed, /select id from public\.businesses where slug = 'velvet-brew'/i)
  assert.match(seed, /select id from public\.businesses where slug = 'mystic-coffee'/i)
  assert.match(seed, /delete from public\.rewards[\s\S]*Signature Velvet Latte/i)
  assert.match(seed, /delete from public\.products[\s\S]*Oat Milk Latte/i)
  assert.match(seed, /delete from public\.promotions[\s\S]*Double points after 3 PM/i)
  assert.match(seed, /insert into auth\.users[\s\S]*on conflict \(id\) do update/i)
  assert.match(seed, /insert into auth\.identities[\s\S]*on conflict \(id\) do update/i)
})

runTest('member transaction migration creates QR tokens, transaction ledger, and secure RPCs', () => {
  const migration = readFileSync('supabase/migrations/20260521000000_member_transactions.sql', 'utf8')
  const rewardValueMigration = readFileSync('supabase/migrations/20260701050000_reward_points_are_reward_value.sql', 'utf8')
  const launchContactMigration = readFileSync('supabase/migrations/20260705010000_launch_contact_signup_relax_id_verification.sql', 'utf8')

  assert.match(migration, /add column if not exists member_qr_token/i)
  assert.match(migration, /add column if not exists reward_rate_percent/i)
  assert.match(migration, /add column if not exists commission_rate_percent/i)
  assert.match(migration, /create type public\.member_transaction_commission_status/i)
  assert.match(migration, /create table if not exists public\.member_transactions/i)
  assert.match(migration, /purchase_amount/i)
  assert.match(migration, /reward_value/i)
  assert.match(migration, /points_awarded/i)
  assert.match(migration, /commission_amount/i)
  assert.match(migration, /client_request_id/i)
  assert.match(migration, /create or replace function public\.get_member_by_qr_token/)
  assert.match(migration, /create or replace function public\.record_member_transaction/)
  assert.match(launchContactMigration, /create or replace function public\.record_member_transaction/)
  assert.match(launchContactMigration, /perform public\.assert_member_verified\(member_profile\.id\)/)
  assert.doesNotMatch(launchContactMigration, /verification_status::text <> 'verified'/)
  assert.match(launchContactMigration, /member_contact_required/)
  assert.match(migration, /create or replace function public\.mark_member_transaction_commission_paid/)
  assert.match(rewardValueMigration, /points_awarded_value := floor\(reward_value_value\)/i)
  assert.match(rewardValueMigration, /points_awarded <> floor\(reward_value\)::integer/i)
  assert.match(migration, /commission_rate_percent >= 10/i)
})

runTest('customer profile exposes the scannable member QR during launch', () => {
  const profilePage = readFileSync('src/features/profile/pages/profile-page.tsx', 'utf8')
  const qrSectionStart = profilePage.indexOf('<h2 className="font-serif text-2xl text-primary">Member QR</h2>')
  const preferencesStart = profilePage.indexOf('<span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t(\'Preferences\')}</span>')

  assert.ok(qrSectionStart > -1)
  assert.ok(preferencesStart > qrSectionStart)

  const qrSection = profilePage.slice(qrSectionStart, preferencesStart)

  assert.match(profilePage, /const isMemberVerified = Boolean\(profile\.data\?\.memberQrToken\)/)
  assert.match(qrSection, /isMemberVerified && memberQrUrl/)
  assert.match(qrSection, /<QRCodeSVG value=\{memberQrUrl\}/)
  assert.match(profilePage, /Your member QR is active now\./)
  assert.match(profilePage, /ID verification is optional during launch/)
  assert.doesNotMatch(profilePage, /Verify your ID to activate your member QR\./)
  assert.doesNotMatch(qrSection, /href="#id-verification"/)
  assert.match(qrSection, /disabled=\{!memberQrUrl\}/)
})

runTest('profile verification submit persists unsaved contact fields first', () => {
  const profilePage = readFileSync('src/features/profile/pages/profile-page.tsx', 'utf8')

  assert.match(profilePage, /form\.formState\.isDirty/)
  assert.match(profilePage, /updateProfile\.mutateAsync\(form\.getValues\(\)\)/)
  assert.match(profilePage, /syncProfile\(savedProfile\)/)
  assert.match(profilePage, /disabled=\{submitVerification\.isPending \|\| updateProfile\.isPending\}/)
})

runTest('business member-sale page allows launch member QR transactions', () => {
  const page = readFileSync('src/features/business-owner/pages/member-sale-page.tsx', 'utf8')

  assert.match(page, /const isMemberEligible = Boolean\(member\.data\.id\)/)
  assert.match(page, /disabled=\{!preview \|\| recordTransaction\.isPending\}/)
  assert.match(page, /Launch member/)
  assert.doesNotMatch(page, /complete member QR before recording rewards/)
})

runTest('business dashboard keeps transaction scanning out of the dashboard tab', () => {
  const layout = readFileSync('src/layouts/business-owner-layout.tsx', 'utf8')
  const dashboard = readFileSync('src/features/business-owner/pages/business-dashboard-page.tsx', 'utf8')
  const sharedScanner = readFileSync('src/components/qr-scanner.tsx', 'utf8')
  const giftCardScanner = readFileSync('src/features/gift-cards/components/qr-scanner.tsx', 'utf8')
  const transactionsPage = readFileSync('src/features/gift-cards/pages/redemptions-page.tsx', 'utf8')

  assert.match(sharedScanner, /BarcodeDetector/)
  assert.match(sharedScanner, /navigator\.mediaDevices\?\.getUserMedia/)
  assert.match(sharedScanner, /createImageBitmap/)
  assert.match(giftCardScanner, /export \{ QrScanner \} from '@\/components\/qr-scanner'/)
  assert.match(transactionsPage, /<QrScanner/)
  assert.match(transactionsPage, /Point the camera at the customer member QR or gift card QR\./)
  assert.match(layout, /label: 'Dashboard'/)
  assert.doesNotMatch(layout, /label: 'QR Sales'/)

  assert.doesNotMatch(dashboard, /import \{ QrScanner \} from '@\/components\/qr-scanner'/)
  assert.doesNotMatch(dashboard, /Customer QR Sales/)
  assert.doesNotMatch(dashboard, /Reward Credit Scanner/)
  assert.doesNotMatch(dashboard, /Validate Reward Credit/)
  assert.doesNotMatch(dashboard, /<QrScanner/)
  assert.match(dashboard, /space-y-5 xl:space-y-7/)
  assert.match(dashboard, /grid gap-3 sm:grid-cols-2 xl:grid-cols-4/)
  assert.ok(
    dashboard.indexOf("t('See the business walkthrough')") <
      dashboard.indexOf('{/* Metrics Grid */}'),
    'Business walkthrough callout should render before dashboard metrics.',
  )
})

runTest('router exposes protected business member-sale route', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')

  assert.match(router, /MemberSalePage/)
  assert.match(router, /path: '\/business\/member-sale\/:token'/)
})

runTest('business transaction page previews rewards and commission before recording sale', () => {
  const page = readFileSync('src/features/business-owner/pages/member-sale-page.tsx', 'utf8')

  assert.match(page, /calculateMemberTransaction/)
  assert.match(page, /purchaseAmount/)
  assert.match(page, /rewardValue/)
  assert.match(page, /pointsAwarded/)
  assert.match(page, /commissionAmount/)
  assert.match(page, /recordTransaction/)
})

runTest('admin members profile panel uses compact stats and action tabs instead of one long vertical card', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const membersStart = adminPage.indexOf('<TabsContent value="members"')
  const catalogStart = adminPage.indexOf('<TabsContent value="catalog"')
  const membersSection = adminPage.slice(membersStart, catalogStart)

  assert.match(membersSection, /member-action-panel/)
  assert.match(membersSection, /member-stat-grid/)
  assert.match(membersSection, /member-action-tabs/)
  assert.match(membersSection, /value="award-points"/)
  assert.match(membersSection, /value="use-credit"/)
  assert.match(membersSection, /value="verification"/)
  assert.match(membersSection, /Profile Summary/)
  assert.match(membersSection, /Recent Value/)
  const profileSummaryIndex = membersSection.indexOf('Profile Summary')
  const actionTabsIndex = membersSection.indexOf('member-action-tabs')
  const summaryBeforeTabs = membersSection.slice(profileSummaryIndex, actionTabsIndex)

  assert.doesNotMatch(summaryBeforeTabs, /Verification ID/)
  assert.doesNotMatch(summaryBeforeTabs, /\{t\('Phone'\)\}/)
})

runTest('admin member action tabs use short labels that fit the compact panel', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const tabsStart = adminPage.indexOf('member-action-tabs')
  const tabsEnd = adminPage.indexOf('<TabsContent value="award-points"')
  const actionTabs = adminPage.slice(tabsStart, tabsEnd)

  assert.match(actionTabs, /grid-cols-\[1fr_1fr_1fr\]/)
  assert.match(actionTabs, /min-w-0/)
  assert.match(actionTabs, /whitespace-normal/)
  assert.match(actionTabs, />ID<\/TabsTrigger>/)
  assert.doesNotMatch(actionTabs, />Verification<\/TabsTrigger>/)
})

runTest('platform admins can remove customer accounts from the member list', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const adminHooks = readFileSync('src/hooks/use-admin-data.ts', 'utf8')
  const adminService = readFileSync('src/integrations/supabase/services/admin-service.ts', 'utf8')
  const migration = readFileSync('supabase/migrations/20260705020000_admin_delete_customer.sql', 'utf8')
  const membersStart = adminPage.indexOf('<TabsContent value="members"')
  const catalogStart = adminPage.indexOf('<TabsContent value="catalog"')
  const membersSection = adminPage.slice(membersStart, catalogStart)

  assert.match(membersSection, /customerPendingDelete/)
  assert.match(membersSection, /Remove Customer/)
  assert.match(membersSection, /deleteCustomer\.mutateAsync/)
  assert.match(adminPage, /useDeleteCustomer/)
  assert.match(adminHooks, /export function useDeleteCustomer/)
  assert.match(adminHooks, /adminService\.deleteCustomer/)
  assert.match(adminService, /admin_delete_customer/)
  assert.match(migration, /create or replace function public\.admin_delete_customer/)
  assert.match(migration, /actor_profile\.role <> 'platform-admin'/)
  assert.match(migration, /target_profile\.role <> 'customer'/)
  assert.match(migration, /delete from auth\.users/)
  assert.match(migration, /grant execute on function public\.admin_delete_customer\(uuid\) to authenticated/)
})

runTest('admin layout renders admin portal section navigation inside the sidebar', () => {
  const adminLayout = readFileSync('src/layouts/admin-layout.tsx', 'utf8')

  assert.match(adminLayout, /adminPortalSections/)
  assert.match(adminLayout, /isAdminPortal \? \(/)
  assert.match(adminLayout, /href=\{`\/admin\/portal#\$\{item\.value\}`\}/)
  assert.match(adminLayout, /overflow-y-auto/)
  assert.match(adminLayout, /flex-1 min-h-0/)
  assert.doesNotMatch(adminLayout, /isAdminPortal \? \(\s*<div className="flex-1" \/>/)
})

runTest('admin portal page uses controlled tab content without duplicating sidebar navigation', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const tabsStart = adminPage.indexOf('<Tabs value={activeAdminTab}')
  const membersStart = adminPage.indexOf('<TabsContent value="members"')
  const tabsShell = adminPage.slice(tabsStart, membersStart)

  assert.match(adminPage, /activeAdminTab/)
  assert.match(adminPage, /onValueChange=\{handleAdminTabChange\}/)
  assert.match(adminPage, /hashchange/)
  assert.match(tabsShell, /className="min-w-0 space-y-12"/)
  assert.doesNotMatch(adminPage, /admin-portal-tabs/)
  assert.doesNotMatch(tabsShell, /TabsTrigger value="members"/)
  assert.doesNotMatch(tabsShell, /fixed/)
})

runTest('customer layout exposes full desktop navigation in the header', () => {
  const customerLayout = readFileSync('src/layouts/customer-layout.tsx', 'utf8')
  const headerStart = customerLayout.indexOf('<header')
  const mainStart = customerLayout.indexOf('<main')
  const headerMarkup = customerLayout.slice(headerStart, mainStart)

  assert.match(customerLayout, /customerNavigation/)
  assert.match(customerLayout, /useLocation/)
  assert.match(customerLayout, /pathname\.startsWith\('\/gift-cards'\)/)
  assert.match(customerLayout, /to: '\/wallet\/gift-cards'/)
  assert.match(headerMarkup, /hidden items-center gap-0\.5 xl:flex/)
  assert.match(headerMarkup, /customerNavigation\.map/)
  for (const path of ['/dashboard', '/shop', '/rewards', '/gift-cards', '/activity', '/profile']) {
    assert.match(headerMarkup, new RegExp(`to: '${path}'|to=\\{item\\.to\\}`))
  }
  assert.doesNotMatch(headerMarkup, /<span className="hidden text-xs[^>]*>\s*Home\s*<\/span>/)
})

runTest('customer mobile bottom nav exposes core routes and active QR status', () => {
  const bottomNav = readFileSync('src/components/customer-bottom-nav.tsx', 'utf8')
  const customerLayout = readFileSync('src/layouts/customer-layout.tsx', 'utf8')

  for (const route of ['/dashboard', '/shop', '/activity', '/profile']) {
    assert.match(bottomNav, new RegExp(`to: '${route}'`))
  }

  for (const label of ['Home', 'Businesses', 'QR', 'Activity']) {
    assert.match(bottomNav, new RegExp(`label: '${label}'`))
  }

  assert.match(bottomNav, /grid-cols-4/)
  assert.doesNotMatch(bottomNav, /label: 'Shop'/)
  assert.doesNotMatch(bottomNav, /ShoppingCart/)
  assert.match(bottomNav, /xl:hidden/)
  assert.match(bottomNav, /verificationStatus\?: Profile\['verificationStatus'\] \| null/)
  assert.match(bottomNav, /Member QR active/)
  assert.match(bottomNav, /\/profile/)
  assert.doesNotMatch(bottomNav, /\/profile#id-verification/)
  assert.doesNotMatch(bottomNav, /Verification required/)
  assert.match(bottomNav, /pathname\.startsWith\(prefix\)/)

  assert.match(customerLayout, /<CustomerBottomNav verificationStatus=\{profile\?\.verificationStatus\} \/>/)
  assert.match(customerLayout, /pb-32/)
})

runTest('customer shop route is a partner business map', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const shopPage = readFileSync('src/features/shop/pages/shop-page.tsx', 'utf8')
  const customerLayout = readFileSync('src/layouts/customer-layout.tsx', 'utf8')

  assert.match(router, /path: '\/shop'[\s\S]*<ShopPage \/>/)
  assert.match(shopPage, /Partner Map/)
  assert.match(shopPage, /Explore Businesses/)
  assert.match(shopPage, /Guatemala_BOUNDS/)
  assert.match(shopPage, /PREVIEW_PIN_POSITIONS/)
  assert.match(shopPage, /getMapPosition/)
  assert.match(shopPage, /getPreviewMapPosition/)
  assert.match(shopPage, /partnerBusinesses\.map/)
  assert.match(shopPage, /Preview/)
  assert.match(shopPage, /Partners without coordinates are shown with preview pins/)
  assert.match(shopPage, /DialogContent/)
  assert.match(shopPage, /useAddToCart/)
  assert.match(shopPage, /useLoginGate/)
  assert.match(shopPage, /selectedQuantity/)
  assert.doesNotMatch(shopPage, /BusinessFilter/)
  assert.doesNotMatch(shopPage, /Curated Social Catalog/)
  assert.match(customerLayout, /label: 'Businesses'/)
  assert.doesNotMatch(customerLayout, /label: 'Shop'/)
})

runTest('customer dashboard exposes a guided onboarding checklist', () => {
  const dashboardPage = readFileSync('src/features/dashboard/pages/dashboard-page.tsx', 'utf8')
  const checklist = readFileSync('src/features/dashboard/components/customer-onboarding-checklist.tsx', 'utf8')

  assert.match(dashboardPage, /CustomerOnboardingChecklist/)
  assert.match(dashboardPage, /verificationStatus=\{verificationStatus\}/)
  assert.match(dashboardPage, /points=\{points\}/)
  assert.match(dashboardPage, /recentActivity=\{recentActivity\}/)

  for (const label of ['Account created', 'Contact saved', 'Unlock member QR', 'Make first QR sale', 'Review activity']) {
    assert.match(checklist, new RegExp(label))
  }

  assert.doesNotMatch(checklist, /\/profile#id-verification/)
  assert.match(checklist, /\/profile/)
  assert.match(checklist, /\/activity/)
  assert.match(checklist, /WhatsApp or phone/)
})

runTest('customer dashboard exposes a guided wallet summary', () => {
  const dashboardPage = readFileSync('src/features/dashboard/pages/dashboard-page.tsx', 'utf8')
  const walletSummary = readFileSync('src/features/dashboard/components/customer-wallet-summary.tsx', 'utf8')

  assert.match(dashboardPage, /CustomerWalletSummary/)
  assert.match(dashboardPage, /verificationStatus=\{verificationStatus\}/)
  assert.match(dashboardPage, /points=\{points\}/)

  for (const label of ['Show member QR', 'Total Points', 'QR status', 'Account status', 'Launch ready']) {
    assert.match(walletSummary, new RegExp(label))
  }

  assert.doesNotMatch(walletSummary, /\/profile#id-verification/)
  assert.match(walletSummary, /\/profile/)
  assert.match(walletSummary, /Reward wallet/)
  assert.match(walletSummary, /Ready to earn/)
  assert.match(walletSummary, /Start earning/)

  assert.doesNotMatch(dashboardPage, /<MetricCard[\s\S]*Reward Credits/)
  assert.doesNotMatch(dashboardPage, /<MetricCard[\s\S]*Gift Cards/)
})

runTest('customer header exposes active QR status pill', () => {
  const customerLayout = readFileSync('src/layouts/customer-layout.tsx', 'utf8')
  const pill = readFileSync('src/features/membership/components/verification-status-pill.tsx', 'utf8')

  assert.match(customerLayout, /VerificationStatusPill/)
  assert.match(customerLayout, /status=\{profile\?\.verificationStatus\}/)
  assert.match(pill, /QR active/)
  assert.match(pill, /Verified/)
  assert.doesNotMatch(pill, /\/profile#id-verification/)
  assert.match(pill, /\/profile/)
})

runTest('reward cards keep locked redemption copy concise', () => {
  const rewardCard = readFileSync('src/features/rewards/components/reward-card.tsx', 'utf8')

  assert.match(rewardCard, /Unlock the treat/)
  assert.doesNotMatch(rewardCard, /\? 'Verify ID'\s*:/)
})

runTest('activity feedback uses clear labels and customer empty actions', () => {
  const activityList = readFileSync('src/features/activity/components/activity-list.tsx', 'utf8')
  const dashboardPage = readFileSync('src/features/dashboard/pages/dashboard-page.tsx', 'utf8')
  const activityPage = readFileSync('src/features/activity/pages/activity-page.tsx', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')

  for (const label of ['Earned', 'Redeemed', 'Bonus', 'Adjusted', 'Gift card issued', 'Gift card redeemed']) {
    assert.match(activityList, new RegExp(label))
  }

  assert.match(activityList, /emptyActionTo\?: string/)
  assert.match(activityList, /emptyActionLabel\?: string/)
  assert.match(activityList, /Pending/)
  assert.match(activityList, /<Button asChild/)
  assert.match(activityList, /<Link to=\{emptyActionTo\}/)

  assert.match(dashboardPage, /emptyActionTo="\/shop"/)
  assert.match(dashboardPage, /emptyActionLabel="Browse businesses"/)
  assert.match(activityPage, /emptyActionTo="\/shop"/)
  assert.match(activityPage, /emptyActionLabel="Browse businesses"/)
  assert.doesNotMatch(adminPage, /emptyActionTo="\/shop"/)
})

runTest('gift card tiles explain contact-details locked issuance', () => {
  const giftCardTile = readFileSync('src/features/gift-cards/components/gift-card-tile.tsx', 'utf8')

  assert.match(giftCardTile, /Contact details required/)
  assert.match(giftCardTile, /Add contact details/)
  assert.doesNotMatch(giftCardTile, /\? t\('Verify ID'\) : t\('Issue'\)/)
})

runTest('gift card issuing uses RPC row if private detail reload is unavailable', () => {
  const service = readFileSync('src/integrations/supabase/services/gift-cards-service.ts', 'utf8')
  const hook = readFileSync('src/features/gift-cards/hooks/use-gift-cards.ts', 'utf8')

  assert.match(service, /giftCard \?\? mapGiftCard\(row\)/)
  assert.doesNotMatch(service, /Issued gift card could not be loaded/)
  assert.doesNotMatch(service, /profiles!gift_cards_customer_id_fkey/)
  assert.match(service, /\.select\('\*'\)/)
  assert.match(service, /enrichedRow\.gift_card_catalog/)
  assert.match(service, /enrichedRow\.businesses/)
  assert.match(hook, /queryClient\.setQueryData\(giftCardKeys\.detail\(giftCard\.id\), giftCard\)/)
})

runTest('gift card redemption validates pasted codes through token lookup', () => {
  const service = readFileSync('src/integrations/supabase/services/gift-cards-service.ts', 'utf8')
  const redemptionsPage = readFileSync('src/features/gift-cards/pages/redemptions-page.tsx', 'utf8')

  assert.match(service, /findGiftCardByTokenOrCode/)
  assert.match(service, /getPublicGiftCard\(tokenOrCode\)/)
  assert.match(redemptionsPage, /giftCardsService\.findGiftCardByTokenOrCode\(needle\)/)
  assert.match(redemptionsPage, /preloadedCard \?\? await giftCardsService\.findGiftCardByTokenOrCode\(needle\)/)
})

runTest('business transactions page shows transaction history with optional gift card usage', () => {
  const service = readFileSync('src/integrations/supabase/services/gift-cards-service.ts', 'utf8')
  const memberTransactionsService = readFileSync('src/integrations/supabase/services/member-transactions-service.ts', 'utf8')
  const redemptionsPage = readFileSync('src/features/gift-cards/pages/redemptions-page.tsx', 'utf8')
  const migration = readFileSync('supabase/migrations/20260701000000_business_gift_card_history_rpc.sql', 'utf8')
  const memberTransactionHistoryMigration = readFileSync('supabase/migrations/20260702020000_business_member_transaction_history_rpc.sql', 'utf8')
  const transactionMigration = readFileSync('supabase/migrations/20260701010000_redeem_gift_card_records_transaction.sql', 'utf8')
  const discountMigration = readFileSync('supabase/migrations/20260701020000_gift_card_discount_transaction_history.sql', 'utf8')
  const backfillMigration = readFileSync('supabase/migrations/20260701040000_backfill_gift_card_redemption_transactions.sql', 'utf8')
  const rewardValueMigration = readFileSync('supabase/migrations/20260701050000_reward_points_are_reward_value.sql', 'utf8')
  const giftCardAfterTaxMigration = readFileSync('supabase/migrations/20260701070000_gift_card_applies_after_tax_reward_base_bill.sql', 'utf8')

  assert.match(service, /get_business_gift_cards/)
  assert.match(service, /mapBusinessGiftCard/)
  assert.match(redemptionsPage, /Business Transactions/)
  assert.match(redemptionsPage, /Transaction History/)
  assert.match(redemptionsPage, /transactionRows/)
  assert.match(redemptionsPage, /gift_card_redemption/)
  assert.match(redemptionsPage, /usedGiftCardCodes/)
  assert.match(redemptionsPage, /extractGiftCardCode/)
  assert.match(redemptionsPage, /Standard sale/)
  assert.match(redemptionsPage, /Gift card used/)
  assert.match(redemptionsPage, /Gift card redeemed/)
  assert.match(redemptionsPage, /Process Without Gift Card/)
  assert.match(redemptionsPage, /Process With Gift Card/)
  assert.match(redemptionsPage, /New Transaction/)
  assert.match(redemptionsPage, /scanTransactionQr/)
  assert.match(redemptionsPage, /isGiftCardQrValue/)
  assert.match(redemptionsPage, /Point the camera at the customer member QR or gift card QR\./)
  assert.match(redemptionsPage, /hasGiftCardEntry \?/)
  assert.match(redemptionsPage, /canProcessWithGiftCard/)
  assert.match(redemptionsPage, /canProcessWithoutGiftCard/)
  assert.match(redemptionsPage, /refreshTransactionHistory/)
  assert.match(redemptionsPage, /recordStandardTransaction/)
  assert.match(memberTransactionsService, /get_business_member_transactions/)
  assert.match(memberTransactionsService, /memberFullName/)
  assert.match(memberTransactionHistoryMigration, /create or replace function public\.get_business_member_transactions/)
  assert.match(memberTransactionHistoryMigration, /from public\.member_transactions mt/)
  assert.match(memberTransactionHistoryMigration, /actor_profile\.role not in \('business-owner', 'business-staff'\)/)
  assert.match(redemptionsPage, /useScannedMember/)
  assert.match(redemptionsPage, /useRecordMemberTransaction/)
  assert.match(redemptionsPage, /calculateRewardablePurchaseAmount/)
  assert.match(redemptionsPage, /taxIncludedInBill: business\.taxIncludedInBill/)
  assert.match(redemptionsPage, /Bill before tax\/service/)
  assert.match(redemptionsPage, /Tax added to customer total/)
  assert.match(redemptionsPage, /Tax not charged/)
  assert.match(redemptionsPage, /Service charge added/)
  assert.match(redemptionsPage, /Customer total/)
  assert.match(redemptionsPage, /totalAmountLabel/)
  assert.match(redemptionsPage, /discountLabel/)
  assert.match(redemptionsPage, /finalPriceLabel/)
  assert.match(redemptionsPage, /Gift Card Discount/)
  assert.match(redemptionsPage, /Final Price/)
  assert.match(redemptionsPage, /After staff redeem a gift card or scan a member QR/)
  assert.match(redemptionsPage, /No transactions yet/)
  assert.match(migration, /create or replace function public\.get_business_gift_cards/)
  assert.match(migration, /actor_profile\.role not in \('business-owner', 'business-staff'\)/)
  assert.match(migration, /gc\.redeemed_at/)
  assert.match(service, /p_original_bill/)
  assert.match(service, /p_receipt_number/)
  assert.match(service, /p_gift_card_amount/)
  assert.match(transactionMigration, /drop function if exists public\.redeem_gift_card\(uuid, uuid\)/)
  assert.match(transactionMigration, /p_original_bill numeric default null/)
  assert.match(transactionMigration, /insert into public\.member_transactions/)
  assert.match(transactionMigration, /set points = points \+ points_awarded_value/)
  assert.match(transactionMigration, /Gift card code: %s/)
  assert.match(discountMigration, /redemption_original_bill/)
  assert.match(discountMigration, /Final bill after gift card: %s\./)
  assert.match(backfillMigration, /Backfilled from gift card redemption/)
  assert.match(backfillMigration, /not exists \(/)
  assert.match(backfillMigration, /set points = points \+ points_awarded_value/)
  assert.match(rewardValueMigration, /tax_included_in_bill/)
  assert.match(rewardValueMigration, /points_awarded_value := floor\(reward_value_value\)/)
  assert.doesNotMatch(rewardValueMigration, /reward_value_value \* 100/)
  assert.match(giftCardAfterTaxMigration, /tax_charge_value := case/)
  assert.match(giftCardAfterTaxMigration, /original_bill_value \* coalesce\(business_row\.tax_rate, 0\)/)
  assert.match(giftCardAfterTaxMigration, /total_before_gift_card_value := round\(\(original_bill_value \+ tax_charge_value \+ service_charge_value\)::numeric, 2\)/)
  assert.match(giftCardAfterTaxMigration, /gift_card_amount_value := round\(least\(greatest\(coalesce\(p_gift_card_amount, 0\), 0\), total_before_gift_card_value\)::numeric, 2\)/)
  assert.match(giftCardAfterTaxMigration, /final_bill_value := round\(greatest\(total_before_gift_card_value - gift_card_amount_value, 0\)::numeric, 2\)/)
  assert.match(giftCardAfterTaxMigration, /if original_bill_value is not null and original_bill_value > 0 then/)
  assert.match(giftCardAfterTaxMigration, /purchase_amount_value := original_bill_value/)
  assert.match(giftCardAfterTaxMigration, /Tax added: %s/)
  assert.doesNotMatch(giftCardAfterTaxMigration, /final_bill_value \/ charge_multiplier/)
  assert.doesNotMatch(giftCardAfterTaxMigration, /purchase_amount_value := bill_after_gift_card_value/)
})

runTest('gift card display keeps QR code bounded on customer screens', () => {
  const display = readFileSync('src/features/gift-cards/components/gift-card-display.tsx', 'utf8')

  assert.match(display, /max-w-64/)
  assert.match(display, /size=\{224\}/)
  assert.match(display, /size-56/)
  assert.match(display, /max-w-\[56vw\]/)
  assert.doesNotMatch(display, /QRCodeSVG[^>]+w-full/)
})

runTest('gift card catalog exposes claimable filtering and summary feedback', () => {
  const giftCardsPage = readFileSync('src/features/gift-cards/pages/gift-cards-page.tsx', 'utf8')

  assert.match(giftCardsPage, /showClaimableOnly/)
  assert.match(giftCardsPage, /setShowClaimableOnly/)
  assert.match(giftCardsPage, /const catalogItems = catalog\.data \?\? \[\]/)
  assert.match(giftCardsPage, /const claimableGiftCards = catalogItems\.filter/)
  assert.match(giftCardsPage, /balancePoints >= item\.pointsCost/)
  assert.match(giftCardsPage, /!rewardActionsLocked/)
  assert.match(giftCardsPage, /const visibleGiftCards = showClaimableOnly/)
  assert.match(giftCardsPage, /Claimable/)

  for (const label of ['Gift card summary', 'Available points', 'Total gift cards', 'Claimable gift cards', 'Active business']) {
    assert.match(giftCardsPage, new RegExp(label))
  }

  assert.match(giftCardsPage, /No claimable gift cards yet/)
  assert.match(giftCardsPage, /No gift cards for this business/)
  assert.match(giftCardsPage, /Earn more points, add contact details, or check back when new gift cards are available\./)
  assert.match(giftCardsPage, /Try another business or clear the business filter\./)
})

runTest('checkout and order pages explain purchase feedback and next actions', () => {
  const cartPage = readFileSync('src/features/shop/pages/cart-page.tsx', 'utf8')
  const checkoutPage = readFileSync('src/features/shop/pages/checkout-page.tsx', 'utf8')
  const confirmationPage = readFileSync('src/features/shop/pages/order-confirmation-page.tsx', 'utf8')
  const ordersPage = readFileSync('src/features/shop/pages/orders-page.tsx', 'utf8')

  assert.match(cartPage, /Pick products from participating businesses before checking out\./)
  assert.match(cartPage, /Browse businesses/)

  for (const label of [
    'Checkout summary',
    'Items in order',
    'Estimated total',
    'Estimated reward impact',
    'Add WhatsApp or phone in your profile before earning rewards',
  ]) {
    assert.match(checkoutPage, new RegExp(label))
  }
  assert.match(checkoutPage, /resolvedItems\.reduce\(\(sum, \{ quantity \}\) => sum \+ quantity, 0\)/)

  assert.match(confirmationPage, /to="\/orders"/)
  assert.match(confirmationPage, /to="\/shop"/)
  assert.match(confirmationPage, /Explore businesses/)

  assert.match(ordersPage, /Purchases placed from partner businesses will appear here together with their posted points\./)
  assert.match(ordersPage, /Browse businesses/)
  assert.match(ordersPage, /to="\/shop"/)
})

runTest('reward catalog exposes claimable filtering and summary feedback', () => {
  const rewardsPage = readFileSync('src/features/rewards/pages/rewards-page.tsx', 'utf8')

  assert.match(rewardsPage, /'Claimable'/)
  assert.match(rewardsPage, /const allRewards = rewards\.data \?\? \[\]/)
  assert.match(rewardsPage, /const claimableRewards = allRewards\.filter/)
  assert.match(rewardsPage, /reward\.inventory > 0/)
  assert.match(rewardsPage, /balancePoints >= reward\.pointsCost/)
  assert.match(rewardsPage, /!rewardActionsLocked/)
  assert.match(rewardsPage, /isMembershipActive/)
  assert.match(rewardsPage, /activeFilter === 'Claimable'/)

  for (const label of ['Catalog summary', 'Available points', 'Total rewards', 'Claimable rewards', 'Active filter']) {
    assert.match(rewardsPage, new RegExp(label))
  }

  assert.match(rewardsPage, /No claimable rewards yet/)
  assert.match(rewardsPage, /No rewards match this filter/)
  assert.match(rewardsPage, /Earn more points, add contact details, or check back when new rewards are available\./)
  assert.match(rewardsPage, /Try a different category or business filter\./)
})

runTest('admin partners page uses table-first operations layout with modal create flow', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const partnersStart = adminPage.indexOf('<TabsContent value="partners"')
  const nextSectionStart = adminPage.indexOf('<TabsContent value="activity"')
  const partnersSection = adminPage.slice(partnersStart, nextSectionStart)

  assert.match(partnersSection, /partner-operations-layout/)
  assert.match(partnersSection, /partner-create-dialog/)
  assert.match(partnersSection, /partner-management-table/)
  assert.match(partnersSection, /lg:hidden/)
  assert.match(partnersSection, /hidden w-full lg:block/)
  assert.match(partnersSection, /min-w-\[960px\]/)
  assert.match(partnersSection, /whitespace-nowrap">QR Sales/)
  assert.match(partnersSection, /whitespace-nowrap">Commission/)
  assert.match(partnersSection, /data-testid="partner-row-actions"/)
  assert.match(partnersSection, /Owner email:/)
  assert.match(partnersSection, /Staff email/)
  assert.match(partnersSection, /business\.staffEmails\.join\(', '\)/)
  assert.match(partnersSection, /Partner Operations/)
  assert.match(partnersSection, /Create Partner/)
  assert.match(partnersSection, /Recent Referral Activity/)
  assert.match(partnersSection, /Commission Owed/)
  assert.doesNotMatch(partnersSection, /2xl:grid-cols-\[420px_minmax\(0,1fr\)\]/)
  assert.doesNotMatch(partnersSection, /min-w-\[1180px\]/)
  assert.doesNotMatch(partnersSection, /Partner Cards/)
})

runTest('admin partner creation treats tax as percent and provisions partner owner credentials', () => {
  const forms = readFileSync('src/types/forms.ts', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const adminService = readFileSync('src/integrations/supabase/services/admin-service.ts', 'utf8')
  const adminHooks = readFileSync('src/hooks/use-admin-data.ts', 'utf8')
  const provisionPartnerOwnerFunction = readFileSync('supabase/functions/provision-partner-owner/index.ts', 'utf8')

  assert.match(forms, /taxRate:[\s\S]*max\(50, 'Maximum 50% tax rate'\)/)
  assert.match(forms, /address:[\s\S]*Keep the address under 180 characters/)
  assert.match(forms, /latitude: optionalCoordinate\('Latitude', -90, 90\)/)
  assert.match(forms, /longitude: optionalCoordinate\('Longitude', -180, 180\)/)
  assert.match(forms, /ownerEmail:\s*z\.email\('Enter a valid partner owner email'\)/)
  assert.match(adminService, /taxRate:\s*input\.taxRate \/ 100/)
  assert.match(adminService, /p_tax_rate:\s*normalized\.taxRate/)
  assert.match(adminService, /p_address:\s*normalized\.address/)
  assert.match(adminService, /p_latitude:\s*normalized\.latitude/)
  assert.match(adminService, /p_longitude:\s*normalized\.longitude/)
  assert.match(adminService, /isMissingCreateBusinessRpcError/)
  assert.match(adminService, /\.from\('businesses'\)[\s\S]*\.insert\(/)
  assert.match(adminService, /functions\.invoke\('provision-partner-owner'/)
  assert.match(adminService, /staffEmailsByBusiness/)
  assert.match(adminService, /staffEmails:\s*staffEmailsByBusiness\.get\(businessId\) \?\? \[\]/)
  assert.match(adminHooks, /useProvisionPartnerOwner/)
  assert.match(adminPage, /Tax Rate \(%\)/)
  assert.match(adminPage, /Address/)
  assert.match(adminPage, /Latitude/)
  assert.match(adminPage, /Longitude/)
  assert.match(adminPage, /Partner Login Email/)
  assert.match(adminPage, /default password/)
  assert.match(adminPage, /provisionPartnerOwner\.mutateAsync/)
  assert.match(adminPage, /Missing coordinates/)
  assert.match(adminPage, /values\.ownerEmail\.trim\(\)/)
  assert.match(provisionPartnerOwnerFunction, /admin\.auth\.admin\.createUser/)
  assert.match(provisionPartnerOwnerFunction, /password:\s*defaultPassword/)
  assert.match(provisionPartnerOwnerFunction, /role:\s*'business-owner'/)
  assert.match(provisionPartnerOwnerFunction, /owner_profile_id:\s*userId/)
})

runTest('business location fields are migrated, typed, and seeded for the partner map', () => {
  const migrations = getFilesByExtension('supabase/migrations', '.sql')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const seed = readFileSync('supabase/seed.sql', 'utf8')
  const domain = readFileSync('src/types/domain.ts', 'utf8')
  const businessService = readFileSync('src/integrations/supabase/services/business-service.ts', 'utf8')

  assert.match(migrations, /add column if not exists address text not null default ''/)
  assert.match(migrations, /add column if not exists latitude numeric/)
  assert.match(migrations, /add column if not exists longitude numeric/)
  assert.match(migrations, /businesses_latitude_range/)
  assert.match(migrations, /businesses_longitude_range/)
  assert.match(migrations, /p_address text default ''/)
  assert.match(migrations, /p_latitude numeric default null/)
  assert.match(migrations, /p_longitude numeric default null/)
  assert.match(seed, /address, latitude, longitude/)
  assert.match(seed, /Cra\. 37 #10-32, El Poblado, Guatemala/)
  assert.match(seed, /Cl\. 10B #36-14, Provenza, Guatemala/)
  assert.match(domain, /address: string/)
  assert.match(domain, /latitude: number \| null/)
  assert.match(domain, /longitude: number \| null/)
  assert.match(businessService, /toNullableNumber\(business\.latitude\)/)
  assert.match(businessService, /toNullableNumber\(business\.longitude\)/)
})

runTest('admin member verification queue prioritizes submitted IDs and exposes review details', () => {
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')

  assert.match(adminPage, /pendingVerificationMembers/)
  assert.match(adminPage, /verificationSubmittedAt/)
  assert.match(adminPage, /verificationPriority/)
  assert.match(adminPage, /IDs awaiting review/)
  assert.match(adminPage, /Copy ID number/)
  assert.match(adminPage, /verificationIdNumber/)
})

runTest('admin and business owner operational lists expose compact search filters', () => {
  const compactSearch = readFileSync('src/components/ui/compact-search.tsx', 'utf8')
  const compactFilter = readFileSync('src/components/ui/compact-filter.tsx', 'utf8')
  const searchHelper = readFileSync('src/lib/search.ts', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const businessOwnerHooks = readFileSync('src/hooks/use-business-owner-data.ts', 'utf8')
  const businessMembersPage = readFileSync('src/features/business-owner/pages/members-page.tsx', 'utf8')
  const businessProductsPage = readFileSync('src/features/business-owner/pages/products-page.tsx', 'utf8')
  const businessRewardsPage = readFileSync('src/features/business-owner/pages/rewards-page.tsx', 'utf8')
  const businessPromotionsPage = readFileSync('src/features/business-owner/pages/promotions-page.tsx', 'utf8')
  const businessPartnersPage = readFileSync('src/features/business-owner/pages/partners-page.tsx', 'utf8')

  assert.match(compactSearch, /function CompactSearch/)
  assert.match(compactFilter, /function CompactFilter/)
  assert.match(compactFilter, /options: CompactFilterOption\[\]/)
  assert.match(searchHelper, /function searchMatches/)

  for (const token of [
    'memberSearch',
    'memberVerificationFilter',
    'memberVerificationFilterOptions',
    'matchesMemberVerificationFilter',
    'filteredCustomerMembers',
    'rewardSearch',
    'filteredRewards',
    'productSearch',
    'filteredAdminProducts',
    'promotionSearch',
    'filteredPromotions',
    'partnerSearch',
    'partnerListFilter',
    'partnerListFilterOptions',
    'matchesPartnerListFilter',
    'filteredBusinesses',
    "placeholder={t('Search members')}",
    "aria-label={t('Filter members by verification status')}",
    "placeholder={t('Search partners')}",
    "aria-label={t('Filter partners by status')}",
    "label: t('Under review')",
    "label: t('Approved')",
    "label: t('Missing ID')",
    "label: t('Missing coordinates')",
  ]) {
    assert.match(adminPage, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.match(businessOwnerHooks, /verificationStatus: profile\.verification_status/)

  for (const [source, tokens] of [
    [
      businessMembersPage,
      [
        'memberSearch',
        'customerStatusFilter',
        'customerStatusFilterOptions',
        'matchesCustomerStatusFilter',
        'filteredMembers',
        "placeholder={t('Search customers')}",
        "aria-label={t('Filter customers by verification status')}",
        'getVerificationStatusLabel',
      ],
    ],
    [businessProductsPage, ['productSearch', 'filteredProducts', "placeholder={t('Search products')}"]],
    [businessRewardsPage, ['rewardSearch', 'filteredRewards', "placeholder={t('Search rewards')}"]],
    [businessPromotionsPage, ['campaignSearch', 'filteredPromotions', "placeholder={t('Search campaigns')}"]],
    [
      businessPartnersPage,
      [
        'leadSearch',
        'visibleActiveAmbassadorLeads',
        'partnerContactSearch',
        'visibleActiveReferrers',
        'referralSearch',
        'filteredReferrals',
        'creditSearch',
        'filteredUnredeemedCredits',
      ],
    ],
  ] as const) {
    for (const token of tokens) {
      assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
  }
})

runTest('password reset uses configured public reset route and update-password page', () => {
  const authService = readFileSync('src/integrations/supabase/services/auth-service.ts', 'utf8')
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const envExample = readFileSync('.env.example', 'utf8')

  assert.match(authService, /VITE_PUBLIC_SITE_URL/)
  assert.match(authService, /\/reset-password/)
  assert.match(authService, /updatePassword/)
  assert.doesNotMatch(authService, /redirectTo:\s*window\.location\.origin/)
  assert.match(router, /ResetPasswordPage/)
  assert.match(router, /path: '\/reset-password'/)
  assert.match(envExample, /VITE_PUBLIC_SITE_URL=/)
})

runTest('business owner catalog and settings writes use owner-scoped RPCs', () => {
  const migrations = getFilesByExtension('supabase/migrations', '.sql')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const forms = readFileSync('src/types/forms.ts', 'utf8')
  const productsPage = readFileSync('src/features/business-owner/pages/products-page.tsx', 'utf8')
  const promotionsPage = readFileSync('src/features/business-owner/pages/promotions-page.tsx', 'utf8')
  const giftCardsPage = readFileSync('src/features/gift-cards/pages/business-gift-cards-page.tsx', 'utf8')
  const settingsPage = readFileSync('src/features/business-owner/pages/settings-page.tsx', 'utf8')
  const productsService = readFileSync('src/integrations/supabase/services/products-service.ts', 'utf8')
  const promotionsService = readFileSync('src/integrations/supabase/services/promotions-service.ts', 'utf8')
  const giftCardService = readFileSync('src/integrations/supabase/services/gift-card-catalog-service.ts', 'utf8')
  const businessService = readFileSync('src/integrations/supabase/services/business-service.ts', 'utf8')

  for (const rpc of [
    'create_owner_product',
    'create_owner_promotion',
    'create_owner_gift_card_catalog_item',
    'update_owner_business_settings',
  ]) {
    assert.match(migrations, new RegExp(`create or replace function public\\.${rpc}`))
  }

  assert.match(forms, /ownerProductDraftSchema/)
  assert.match(forms, /ownerGiftCardCatalogItemSchema/)
  assert.match(productsPage, /ownerProductDraftSchema/)
  assert.match(productsPage, /inventory: 50/)
  assert.match(productsPage, /useCreateOwnerProduct/)
  assert.doesNotMatch(productsPage, /business!\.id/)
  assert.match(promotionsPage, /useCreateOwnerPromotion/)
  assert.doesNotMatch(promotionsPage, /business!\.id/)
  assert.match(giftCardsPage, /ownerGiftCardCatalogItemSchema/)
  assert.match(giftCardsPage, /useCreateOwnerGiftCardCatalogItem/)
  assert.doesNotMatch(giftCardsPage, /businessId: business\?\.id/)
  assert.match(settingsPage, /useUpdateOwnerBusinessSettings/)
  assert.match(settingsPage, /updateSettings\.error/)
  assert.match(settingsPage, /Rewards Rate/)
  assert.doesNotMatch(settingsPage, /Points Rate/)
  assert.match(productsService, /createOwnerProduct/)
  assert.match(promotionsService, /createOwnerPromotion/)
  assert.match(giftCardService, /createOwnerCatalogItem/)
  assert.match(businessService, /updateOwnerSettings/)
})

runTest('register customer surfaces edge function messages and persists business attribution', () => {
  const adminService = readFileSync('src/integrations/supabase/services/admin-service.ts', 'utf8')
  const registerCustomerFunction = readFileSync('supabase/functions/register-customer/index.ts', 'utf8')
  const migrations = getFilesByExtension('supabase/migrations', '.sql')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  assert.match(adminService, /readFunctionErrorMessage/)
  assert.match(adminService, /context/)
  assert.match(registerCustomerFunction, /registered_by_business_id/)
  assert.match(registerCustomerFunction, /upsert/)
  assert.match(registerCustomerFunction, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(migrations, /new_registered_by_business_id/)
  assert.match(migrations, /registered_by_business_id/)
})

runTest('business staff role policy is centralized and marks catalog management owner-only', () => {
  const policy = readFileSync('src/lib/business-role-policy.ts', 'utf8')

  assert.match(policy, /businessOwnerOnlyPaths/)
  assert.match(policy, /businessStaffOperationalPaths/)
  assert.match(policy, /canAccessBusinessPath/)

  for (const path of ['/business/products', '/business/rewards', '/business/promotions', '/business/gift-cards', '/business/settings']) {
    assert.match(policy, new RegExp(`'${path}'`))
  }

  for (const path of ['/business/dashboard', '/business/redemptions', '/business/member-sale', '/business/members', '/business/partners']) {
    assert.match(policy, new RegExp(`'${path}'`))
  }
})

runTest('business staff owner-only routes are guarded and hidden from navigation', () => {
  const router = readFileSync('src/routes/router.tsx', 'utf8')
  const layout = readFileSync('src/layouts/business-owner-layout.tsx', 'utf8')

  assert.match(router, /OwnerOnlyBusinessRoute/)
  for (const path of ['/business/products', '/business/rewards', '/business/promotions', '/business/gift-cards', '/business/settings']) {
    assert.match(router, new RegExp(`path: '${path.replaceAll('/', '\\/')}'[\\s\\S]*<OwnerOnlyBusinessRoute>`))
  }

  assert.match(layout, /canAccessBusinessPath/)
  assert.match(layout, /businessNavigationItems/)
  assert.doesNotMatch(layout, /\.filter\(\(item\) => !item\.ownerOnly \|\| profile\?\.role === 'business-owner'\)/)
})

runTest('public business page follows the clean landing-page format', () => {
  const layout = readFileSync('src/layouts/public-browse-layout.tsx', 'utf8')
  const page = readFileSync('src/features/business/pages/for-businesses-page.tsx', 'utf8')

  assert.match(layout, /useLocation/)
  assert.match(layout, /isBusinessOnboarding/)
  assert.match(layout, /bg-\[#ffffff\]/)
  assert.match(layout, /max-w-\[1336px\]/)
  assert.match(layout, /How it works/)
  assert.match(layout, /Business tools/)
  assert.match(layout, /md:hidden/)
  assert.match(layout, /Start Onboarding/)
  assert.match(layout, /Business Login/)
  assert.match(layout, /<Outlet \/>/)
  assert.doesNotMatch(layout, /headerContainerClassName = isBusinessOnboarding/)

  assert.match(page, /screenshot-landing/)
  assert.match(page, /Business onboarding/)
  assert.match(page, /Join the <span className="text-\[#cfaa44\]">rewards network<\/span>/)
  assert.match(page, /id="how-it-works"/)
  assert.match(page, /id="business-tools"/)
  assert.match(page, /id="faq"/)
  assert.match(page, /href="#book-demo"/)
  assert.match(page, /to="\/business\/login"/)
  assert.match(layout, /isBusinessOnboarding[\s\S]*Start Onboarding/)
  assert.match(layout, /isBusinessOnboarding[\s\S]*Business Login/)
  assert.doesNotMatch(page, /ornate-page/)
  assert.doesNotMatch(page, /ornate-frame/)
})

runTest('business and admin login pages follow the compact auth layout', () => {
  const page = readFileSync('src/features/auth/pages/staff-login-page.tsx', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')

  assert.match(page, /AuthPortalShell showTabs=\{false\}/)
  assert.match(page, /Guatemala Rewards/)
  assert.match(page, /portalLabel\.toUpperCase\(\)/)
  assert.match(page, /id="staff-signin-email"/)
  assert.match(page, /id="staff-signin-password"/)
  assert.match(page, /t\('Forgot password\?'\)/)
  assert.match(page, /t\('Sign in'\)/)
  assert.match(page, /Eye/)
  assert.match(language, /'Admin Portal': 'Portal admin'/)
  assert.match(language, /'Business Portal': 'Portal de negocio'/)
  assert.doesNotMatch(page, /Public member sign in[\s\S]*to="\/signin"/)
  assert.doesNotMatch(page, /Business Access/)
  assert.doesNotMatch(page, /Private business access/)
})

runTest('staff permission migration keeps operational access but restricts catalog management', () => {
  const migrations = getFilesByExtension('supabase/migrations', '.sql')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  assert.match(migrations, /can_manage_business_catalog/)
  assert.match(migrations, /jwt_role\(\) = 'business-owner'/)
  assert.match(migrations, /business-staff[\s\S]*record_member_transaction|record_member_transaction[\s\S]*business-staff/)
  assert.match(migrations, /Business owners can create products for their business/)
  assert.match(migrations, /Business owners can create rewards for their business/)
  assert.match(migrations, /Business owners can create promotions/)
})

runTest('workflow QA docs record staff operational policy and seeded workflow command', () => {
  const qaDoc = readFileSync('docs/workflow-qa-2026-05-21.md', 'utf8')

  assert.match(qaDoc, /business staff are operational users/i)
  assert.match(qaDoc, /cannot manage products, rewards, promotions, gift-card catalog, or settings/i)
  assert.match(qaDoc, /npx supabase db reset/)
  assert.match(qaDoc, /npm run test:e2e:workflows/)
})

runTest('package exposes a launch checklist test command', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

  assert.equal(pkg.scripts?.['test:launch'], 'playwright test tests/e2e/launch-checklist.spec.ts')
})

runTest('launch checklist Playwright suite maps to PT001 through PT008', () => {
  const launchChecklist = readFileSync('tests/e2e/launch-checklist.spec.ts', 'utf8')
  const launchHelper = readFileSync('tests/e2e/helpers/supabase.ts', 'utf8')
  const launchCoverage = `${launchChecklist}\n${launchHelper}`

  for (const testId of ['PT001', 'PT002', 'PT003', 'PT004', 'PT005', 'PT006', 'PT007', 'PT008']) {
    assert.match(launchChecklist, new RegExp(`test(?:\\.skip)?\\('${testId}`))
  }

  assert.match(launchChecklist, /test\.skip\([^)]*PT007/)
  assert.match(launchCoverage, /getSupabaseSessionClient/)
  assert.match(launchCoverage, /member_transactions/)
  assert.match(launchCoverage, /early_access_leads/)
})

runTest('launch checklist command enables authenticated workflow tests', () => {
  const envHelper = readFileSync('tests/e2e/helpers/env.ts', 'utf8')

  assert.match(envHelper, /test:e2e:workflows/)
  assert.match(envHelper, /test:launch/)
})

runTest('focused workflow commands enable authenticated workflow tests', () => {
  const envHelper = readFileSync('tests/e2e/helpers/env.ts', 'utf8')

  for (const command of ['test:referrals', 'test:onboarding', 'test:gift-cards', 'test:rewards', 'test:agreements']) {
    assert.match(envHelper, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

runTest('workflow QA docs explain the automated launch checklist command', () => {
  const qaDoc = readFileSync('docs/workflow-qa-2026-05-21.md', 'utf8')

  assert.match(qaDoc, /npm run test:launch/)
  assert.match(qaDoc, /PT001/)
  assert.match(qaDoc, /PT008/)
  assert.match(qaDoc, /Use Playwright pass, fail, and skipped output to update the platform testing log/)
})

runTest('package exposes focused workflow automation commands', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

  assert.equal(pkg.scripts?.['test:referrals'], 'playwright test tests/e2e/referrals.spec.ts')
  assert.equal(pkg.scripts?.['test:onboarding'], 'playwright test tests/e2e/onboarding.spec.ts')
  assert.equal(pkg.scripts?.['test:gift-cards'], 'playwright test tests/e2e/gift-cards.spec.ts')
  assert.equal(pkg.scripts?.['test:rewards'], 'playwright test tests/e2e/rewards-redemption.spec.ts')
  assert.equal(pkg.scripts?.['test:load'], 'playwright test tests/e2e/load.spec.ts')
  assert.equal(pkg.scripts?.['test:agreements'], 'playwright test tests/e2e/agreements.spec.ts')
  assert.equal(pkg.scripts?.['test:playwright'], 'node scripts/run-playwright-local.mjs')
  assert.equal(pkg.scripts?.['test:responsive'], 'node scripts/audit-responsive.mjs')
})

runTest('focused workflow suites cover referrals, onboarding, gift cards, rewards, agreements, and load', () => {
  const expectedSpecs = [
    ['tests/e2e/referrals.spec.ts', ['QR001', 'REF001', 'REF002', 'REF003']],
    ['tests/e2e/onboarding.spec.ts', ['ONB001', 'ONB002', 'ONB003']],
    ['tests/e2e/gift-cards.spec.ts', ['GC001', 'GC002', 'GC003']],
    ['tests/e2e/rewards-redemption.spec.ts', ['RW001', 'RW002', 'RW003']],
    ['tests/e2e/load.spec.ts', ['LOAD001']],
    ['tests/e2e/agreements.spec.ts', ['AGR001', 'AGR002', 'AGR003']],
  ] as const

  for (const [filePath, testIds] of expectedSpecs) {
    const spec = readFileSync(filePath, 'utf8')
    for (const testId of testIds) {
      assert.match(spec, new RegExp(`test\\('${testId}`))
    }
  }
})

runTest('agreement workflow QA has seeded signed and unsigned users', () => {
  const seed = readFileSync('supabase/seed.sql', 'utf8')
  const envHelper = readFileSync('tests/e2e/helpers/env.ts', 'utf8')
  const zeroBalanceMigration = readFileSync('supabase/migrations/20260607000000_allow_zero_signup_reward_balances.sql', 'utf8')

  assert.match(envHelper, /test:agreements/)
  assert.match(envHelper, /agreementPendingCustomer/)
  assert.match(envHelper, /agreementPendingBusinessOwner/)
  assert.match(envHelper, /agreementUnsignedCustomer/)
  assert.match(seed, /agreement-pending-customer@Guatemala\.test/)
  assert.match(seed, /agreement-pending-owner@velvetbrew\.test/)
  assert.match(seed, /agreement-unsigned-customer@Guatemala\.test/)
  assert.match(seed, /insert into public\.agreement_acceptances[\s\S]*signature_svg/i)
  assert.match(seed, /data-signature="drawn"/)
  assert.match(zeroBalanceMigration, /tg_table_name = 'reward_balances'/)
  assert.match(zeroBalanceMigration, /coalesce\(new\.points, 0\) = 0/)
  assert.match(zeroBalanceMigration, /coalesce\(new\.available_credits, 0\) = 0/)
})

runTest('admin-created partners can receive business-specific required contracts', () => {
  const forms = readFileSync('src/types/forms.ts', 'utf8')
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')
  const adminService = readFileSync('src/integrations/supabase/services/admin-service.ts', 'utf8')
  const legalService = readFileSync('src/integrations/supabase/services/legal-service.ts', 'utf8')
  const agreementRequirements = readFileSync('src/lib/agreement-requirements.ts', 'utf8')
  const requiredAgreementsPage = readFileSync('src/features/auth/pages/required-agreements-page.tsx', 'utf8')
  const signAgreementFunction = readFileSync('supabase/functions/sign-agreement/index.ts', 'utf8')
  const migration = readFileSync('supabase/migrations/20260627000000_business_specific_agreement_versions.sql', 'utf8')
  const customDocumentMigration = readFileSync('supabase/migrations/20260628000000_business_custom_required_documents.sql', 'utf8')

  assert.match(forms, /contractTitle/)
  assert.match(forms, /contractBody/)
  assert.match(adminPage, /create-partner-contract-title/)
  assert.match(adminPage, /create-partner-contract-body/)
  assert.match(adminPage, /useCreateBusinessAgreement/)
  assert.match(adminPage, /createBusinessAgreement\.mutateAsync/)
  assert.match(adminPage, /businessOptions=\{allBusinessRows\.map/)
  assert.match(adminService, /createBusinessAgreement/)
  assert.match(adminService, /business_id: input\.businessId/)
  assert.match(adminService, /kind: 'business_custom'/)
  assert.match(adminService, /Number\(existingVersions\?\.\[0\]\?\.version \?\? 0\) \+ 1/)
  assert.match(adminService, /content_hash: contentHash/)
  assert.match(legalService, /business_id: string \| null/)
  assert.match(agreementRequirements, /agreement\.businessId === businessId/)
  assert.match(agreementRequirements, /business_custom/)
  assert.match(requiredAgreementsPage, /Pending agreements/)
  assert.match(requiredAgreementsPage, /Business contract/)
  assert.match(requiredAgreementsPage, /lg:grid-cols-\[minmax\(0,1fr\)_420px\]/)
  assert.match(requiredAgreementsPage, /\[overflow-wrap:anywhere\]/)
  assert.match(signAgreementFunction, /agreement\.business_id && agreement\.business_id !== profile\.business_id/)
  assert.match(migration, /add column if not exists business_id uuid references public\.businesses/)
  assert.match(migration, /idx_active_required_business_agreement_versions/)
  assert.match(migration, /av\.business_id = target_business_id/)
  assert.match(customDocumentMigration, /add value if not exists 'business_custom'/)
  assert.match(customDocumentMigration, /drop index if exists idx_active_required_business_agreement_versions/)
  assert.match(customDocumentMigration, /create index if not exists idx_active_required_business_agreement_versions/)
  assert.doesNotMatch(customDocumentMigration, /create unique index if not exists idx_active_required_business_agreement_versions/)
  assert.match(readFileSync('src/features/admin/components/agreement-status-panel.tsx', 'utf8'), /Add Required Document/)
})

runTest('Supabase E2E helpers expose workflow assertion utilities', () => {
  const helper = readFileSync('tests/e2e/helpers/supabase.ts', 'utf8')

  for (const helperName of [
    'createAnonymousSupabaseClient',
    'signUpTestCustomer',
    'getBusinessBySlug',
    'getPartnerReferralForCustomer',
    'getLatestGiftCardForCustomer',
    'getLatestRedemptionForCustomer',
  ]) {
    assert.match(helper, new RegExp(`export async function ${helperName}|export function ${helperName}`))
  }
})

runTest('gift card issuing migration enables pgcrypto token generation', () => {
  const migration = readFileSync('supabase/migrations/20260528000000_enable_pgcrypto_for_gift_cards.sql', 'utf8')

  assert.match(migration, /create extension if not exists pgcrypto/i)
  assert.match(migration, /gen_random_bytes/i)
})

runTest('gift card issuing migration relaxes legacy gift card code constraints', () => {
  const migration = readFileSync('supabase/migrations/20260630000000_fix_legacy_gift_card_code_not_null.sql', 'utf8')

  assert.match(migration, /column_name = 'gift_card_code'/)
  assert.match(migration, /alter column gift_card_code drop not null/)
  assert.match(migration, /code = coalesce\(code, gift_card_code\)/)
})

runTest('gift card issuing migration syncs legacy gift card code column', () => {
  const migration = readFileSync('supabase/migrations/20260630010000_sync_legacy_gift_card_code.sql', 'utf8')

  assert.match(migration, /create or replace function public\.sync_legacy_gift_card_code/)
  assert.match(migration, /new\.gift_card_code := new\.code/)
  assert.match(migration, /create trigger sync_legacy_gift_card_code/)
})

runTest('gift card issuing migration relaxes legacy gift card value cents constraint', () => {
  const migration = readFileSync('supabase/migrations/20260630020000_fix_legacy_gift_card_value_cents.sql', 'utf8')

  assert.match(migration, /column_name = 'gift_card_value_cents'/)
  assert.match(migration, /alter column gift_card_value_cents set default 0/)
  assert.match(migration, /alter column gift_card_value_cents drop not null/)
  assert.match(migration, /new\.gift_card_value_cents :=/)
})

runTest('gift card issuing migration satisfies legacy gift card value cents check', () => {
  const migration = readFileSync('supabase/migrations/20260630030000_fix_legacy_gift_card_value_check.sql', 'utf8')

  assert.match(migration, /gift_card_value_cents <= 0/)
  assert.match(migration, /alter column gift_card_value_cents set default 1/)
  assert.match(migration, /greatest\(coalesce\(round\(parsed_value \* 100\)::integer, 1\), 1\)/)
})

runTest('workflow QA docs list focused automation commands', () => {
  const qaDoc = readFileSync('docs/workflow-qa-2026-05-21.md', 'utf8')

  for (const command of [
    'npm run test:referrals',
    'npm run test:onboarding',
    'npm run test:gift-cards',
    'npm run test:rewards',
    'npm run test:load',
    'npm run test:agreements',
  ]) {
    assert.match(qaDoc, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})
