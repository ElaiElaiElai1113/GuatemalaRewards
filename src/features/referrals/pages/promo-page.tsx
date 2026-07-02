import { Gift, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { useBusinesses } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'

export function PromoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()
  const businesses = useBusinesses()
  const referrerId = searchParams.get('ref')
  const partnerCode = searchParams.get('partner')
  const businessId = searchParams.get('business')
  const hasReferral = Boolean(referrerId)
  const hasPartnerReferral = Boolean(partnerCode)
  const currentBusiness = businesses.data?.find((business) => business.id === businessId) ?? null

  useEffect(() => {
    if (partnerCode) {
      sessionStorage.setItem('partnerReferrerCode', partnerCode)
      if (businessId) {
        sessionStorage.setItem('partnerBusinessId', businessId)
      }
      return
    }

    if (!referrerId) return

    sessionStorage.setItem('referralCode', referrerId)
    if (businessId) {
      sessionStorage.setItem('referralBusinessId', businessId)
    }
  }, [businessId, partnerCode, referrerId])

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 md:px-8 lg:px-12">
      <section className="warm-hero mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between overflow-hidden rounded-[2.5rem] px-8 py-12 shadow-card md:px-14 md:py-16">
        <div className="flex items-center justify-between gap-4">
          <LanguagePicker className="text-white/80" />
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="size-6" />
          </div>
        </div>

        <div className="grid gap-12 py-16 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="max-w-4xl space-y-8">
            {currentBusiness ? (
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                {currentBusiness.logoUrl ? (
                  <img src={currentBusiness.logoUrl} alt={currentBusiness.name} className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-black uppercase">
                    {currentBusiness.name.slice(0, 1)}
                  </div>
                )}
                <span className="text-sm font-bold uppercase tracking-[0.12em] text-white/90">{currentBusiness.name}</span>
              </div>
            ) : null}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white">
              <Gift className="size-4" />
              {hasPartnerReferral ? 'Partner Perk' : hasReferral ? t('Referral Invite') : t('Rewards Invitation')}
            </div>
            <h1 className="font-serif text-5xl leading-[0.98] tracking-tight md:text-8xl">
              {hasPartnerReferral
                ? `You were invited to ${currentBusiness?.name ?? 'our shop'} by one of our local partners.`
                : hasReferral
                  ? t('Your referral invite qualified for a reward credit.')
                  : currentBusiness
                    ? `Join ${currentBusiness.name} Rewards.`
                    : t('Join the rewards network.')}
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-white/85 md:text-xl">
              {hasPartnerReferral
                ? 'Create your rewards account or continue to checkout. Your first paid order will be credited to the partner who referred you.'
                : hasReferral
                  ? t('Create your rewards account and, after the invite is approved, both you and your friend get a reward credit.')
                  : currentBusiness
                    ? `Create your rewards account to start earning points, access Harbor Roast perks, and keep every visit connected to ${currentBusiness.name}.`
                    : t('Create your rewards account to earn points, track reward credits, and redeem rewards.')}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6">
            <p className="font-serif text-3xl leading-tight">
              {hasPartnerReferral
                ? `Your first order at ${currentBusiness?.name ?? 'this business'} qualifies for partner credit.`
                : hasReferral
                  ? t('Two reward credits, one party invite.')
                  : currentBusiness
                    ? `${currentBusiness.name} signup portal`
                    : t('Your rewards account starts here.')}
            </p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-white/75">
              {hasPartnerReferral
                ? 'Use this link when you sign up or check out so we can attribute your first order to the right front-desk partner.'
                : hasReferral
                  ? t('Your reward credit appears after your signup is reviewed.')
                  : currentBusiness
                    ? `This registration link is tied directly to ${currentBusiness.name}.`
                    : t('Sign up once and keep every visit connected to your points balance.')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-white/70">
            {hasReferral ? t('Ready to claim the invitation?') : t('Ready to start earning?')}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="rounded-full"
            onClick={() => {
              if (!referrerId && !partnerCode) {
                navigate('/promo/register')
                return
              }

              const params = new URLSearchParams()
              if (referrerId) {
                params.set('ref', referrerId)
              }
              if (partnerCode) {
                params.set('partner', partnerCode)
              }
              if (businessId) {
                params.set('business', businessId)
              }
              navigate(`/promo/register?${params.toString()}`)
            }}
          >
            {hasPartnerReferral ? 'Continue with Partner Invite' : hasReferral ? t('Claim Reward Credit') : t('Create Rewards Account')}
          </Button>
        </div>
      </section>
    </main>
  )
}
