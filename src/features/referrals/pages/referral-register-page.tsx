import { zodResolver } from '@hookform/resolvers/zod'
import { Gift, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { memberSignUpSchema, type MemberSignUpFormValues } from '@/types/forms'

const defaultValues: MemberSignUpFormValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
}

function LoadingSpinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z"
      />
    </svg>
  )
}

export function ReferralRegisterPage() {
  const [searchParams] = useSearchParams()
  const { signUp } = useAuth()
  const { t } = useLanguage()
  const businesses = useBusinesses()
  const [error, setError] = useState<string | null>(null)
  const [signUpComplete, setSignUpComplete] = useState(false)
  const [signUpWarning, setSignUpWarning] = useState<string | null>(null)
  const referrerId = searchParams.get('ref')
  const partnerCode = searchParams.get('partner')
  const businessId = searchParams.get('business')

  const form = useForm<MemberSignUpFormValues>({
    resolver: zodResolver(memberSignUpSchema),
    defaultValues,
  })

  const hasReferral = Boolean(referrerId)
  const hasPartnerReferral = Boolean(partnerCode)
  const currentBusiness = businesses.data?.find((business) => business.id === businessId) ?? null

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 lg:grid-cols-[1fr_480px]">
        <section className="warm-hero flex min-h-[32rem] flex-col justify-between overflow-hidden rounded-[2.5rem] px-8 py-12 shadow-card md:px-14 md:py-16">
          <div className="flex items-center justify-between gap-4">
            <LanguagePicker className="text-white/80" />
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="size-6" />
            </div>
          </div>

          <div className="max-w-4xl space-y-8 py-14">
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
              {hasPartnerReferral ? 'Partner Invite' : t('Party Invite')}
            </div>
            <h1 className="font-serif text-5xl leading-[0.98] tracking-tight md:text-8xl">
              {hasPartnerReferral
                ? `Create your account to keep your ${currentBusiness?.name ?? 'business'} partner referral attached.`
                : hasReferral
                  ? t('Create your account to claim the invite.')
                  : currentBusiness
                    ? `Join ${currentBusiness.name} Rewards.`
                    : t('Create your rewards account.')}
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-white/85 md:text-xl">
              {hasPartnerReferral
                ? 'Your first paid order will earn partner credit for the receptionist or front-desk contact who sent you.'
                : hasReferral
                  ? t('After staff approves the invite, both you and your friend receive a reward credit.')
                  : currentBusiness
                    ? `Register once and keep every purchase, reward, and future order linked to ${currentBusiness.name}.`
                    : t('Join the rewards network to earn points, track reward credits, and redeem rewards.')}
            </p>
          </div>

          <Link to="/signin" className="text-sm font-bold text-white/75 transition hover:text-white">
            {t('Already have an account? Sign in')}
          </Link>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm p-8 md:p-10">
            {signUpComplete ? (
              <div className="space-y-8 text-center">
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">{t('Welcome aboard!')}</h2>
                  <p className="text-sm font-medium leading-relaxed text-on-surface-variant/80">
                    {hasPartnerReferral
                      ? 'Your partner referral is attached. Sign in to use your member QR and rewards.'
                      : currentBusiness
                        ? `Your ${currentBusiness.name} account is ready. Sign in to use your member QR and rewards.`
                        : t('Your account is created. Sign in to use your member QR and rewards. We will use your contact details for reward updates and account support.')}
                  </p>
                  {signUpWarning ? (
                    <p className="text-sm font-bold leading-relaxed text-warning">{signUpWarning}</p>
                  ) : null}
                </div>
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/signin">{t('Go to sign in')}</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-7"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setError(null)
                    if (partnerCode) {
                      sessionStorage.setItem('partnerReferrerCode', partnerCode)
                      if (businessId) {
                        sessionStorage.setItem('partnerBusinessId', businessId)
                      }
                    }
                    if (referrerId) {
                      sessionStorage.setItem('referralCode', referrerId)
                      if (businessId) {
                        sessionStorage.setItem('referralBusinessId', businessId)
                      }
                    }
                    const result = await signUp({ ...values, role: 'customer' })
                    setSignUpWarning(result.warning ?? null)
                    setSignUpComplete(true)
                    form.reset(defaultValues)
                  } catch (submissionError) {
                    if (
                      submissionError instanceof Error &&
                      submissionError.message.includes('profile could not be loaded')
                    ) {
                      setSignUpComplete(true)
                      form.reset(defaultValues)
                      return
                    }

                    setError(
                      submissionError instanceof Error
                        ? submissionError.message
                        : t('Unable to create the account.'),
                    )
                  }
                })}
              >
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">{t('Create Account')}</h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    {hasPartnerReferral
                      ? 'Use a new email address so the partner referral can be linked to your first order.'
                      : currentBusiness
                        ? `This signup form is linked to ${currentBusiness.name}.`
                      : t('Use a new email address to claim this referral offer.')}
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="referral-signup-name">{t('Full Name')}</Label>
                  <Input id="referral-signup-name" placeholder={t('Your name')} {...form.register('fullName')} />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="referral-signup-email">{t('Email Address')}</Label>
                  <Input id="referral-signup-email" placeholder="your@email.com" {...form.register('email')} />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="referral-signup-phone">{t('WhatsApp or phone')}</Label>
                  <Input
                    id="referral-signup-phone"
                    type="tel"
                    placeholder="+57 300 000 0000"
                    {...form.register('phone')}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="referral-signup-password">{t('Password')}</Label>
                  <Input
                    id="referral-signup-password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register('password')}
                  />
                </div>

                {error ? <p className="text-center text-sm font-bold text-red-500">{error}</p> : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-full font-bold tracking-wide"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <LoadingSpinner />
                      {t('Creating account...')}
                    </span>
                  ) : (
                    t('Create Account')
                  )}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
