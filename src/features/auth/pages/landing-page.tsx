import { zodResolver } from '@hookform/resolvers/zod'
import {
  BadgeCheck,
  Coins,
  DollarSign,
  Eye,
  EyeOff,
  Gift,
  Hotel,
  Leaf,
  MapPin,
  QrCode,
  ScanLine,
  Store,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandLogo } from '@/components/brand-logo'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { authSchema, type AuthFormValues } from '@/types/forms'

const portalAccessErrorKey = 'portalAccessError'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

const authInputClass =
  'h-[42px] rounded-none border-[#d8dce4] bg-[#f8f9fb] px-3.5 text-[15px] text-[#111827] shadow-none placeholder:text-[#6b7280] focus-visible:ring-[#d1ad4a]/35'
const authLabelClass = 'text-[12px] font-semibold text-[#8f8f8f]'
const authErrorClass = 'text-center text-xs font-bold text-red-400'

function LoadingSpinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z"
      />
    </svg>
  )
}

export function LandingPage() {
  const { t } = useLanguage()
  const featureRows = [
    {
      icon: QrCode,
      text: (
        <>
          Every partner business receives its own individually coded <strong className="font-semibold text-[#28292b]">5x5 inch QR sticker</strong> for the counter, table, window, or front desk.
        </>
      ),
    },
    {
      icon: Store,
      text: t('Each sticker opens a business-specific landing page that explains Guatemala Rewards and lets the customer join from that exact location.'),
    },
  ] as const

  const categoryPills = [
    { icon: Hotel, label: t('Cafes, hotels & restaurants') },
    { icon: Gift, label: t('Local member rewards') },
    { icon: ScanLine, label: t('Business-coded QR stickers') },
    { icon: Leaf, label: t('Built for Guatemala') },
  ] as const

  const steps = [
    {
      title: t('Scan the business sticker'),
      body: t('A customer sees the black Guatemala Rewards QR sticker on-site and scans it with their phone.'),
    },
    {
      title: t('Land on that business page'),
      body: t('The QR opens a page made for that exact partner, so the customer understands the program in context.'),
    },
    {
      title: t('Join Guatemala Rewards'),
      body: t('The customer joins from the business page and gets their own member account and scannable member QR.'),
    },
    {
      title: t('Shop, scan, and earn'),
      body: t('Partner staff scan the member QR when the customer buys, record the sale, and award rewards.'),
    },
  ] as const

  const faqs = [
    {
      icon: QrCode,
      question: t('What does each partner QR do?'),
      answer: t('Each QR is individually coded for one business. It opens that business-specific Guatemala Rewards landing page, so signups and interest can be tied back to the location where the customer scanned.'),
    },
    {
      icon: MapPin,
      question: t('Where should the QR sticker go?'),
      answer: t('The sticker should be easy to see where customers already pause: checkout, tables, hotel desks, menus, event booths, or partner counters.'),
    },
    {
      icon: BadgeCheck,
      question: t('Does the customer need an app first?'),
      answer: t('No. The customer can scan the business QR and join from the landing page. After joining, they can use their own member QR for purchases at partner businesses.'),
    },
    {
      icon: DollarSign,
      question: t('How does the business flow work?'),
      answer: t('Staff scan the customer member QR, enter the purchase amount, and the system records rewards for the member plus the commission tracking for Guatemala Rewards.'),
    },
  ] as const

  return (
    <main className="screenshot-landing min-h-screen overflow-x-hidden bg-[#f6f7f8] text-[#242426]">
      <header className="sticky top-0 z-40 flex min-h-[61px] items-center border-b border-[#e1e4e8] bg-[#ffffff] px-8">
        <div className="mx-auto flex w-full max-w-[1336px] items-center justify-between gap-4">
          <Link to="/" className="flex min-h-[48px] items-center" aria-label="Guatemala Rewards home">
            <BrandLogo compact imageClassName="w-[48px]" />
          </Link>
          <nav className="hidden items-center gap-[30px] text-[14px] font-medium leading-none text-[#687282] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#202023]">
              {t('How it works')}
            </a>
            <Link to="/business" className="transition hover:text-[#202023]">
              {t('Businesses')}
            </Link>
            <a href="#faq" className="transition hover:text-[#202023]">
              {t('FAQ')}
            </a>
            <LanguagePicker className="text-[#687282]" compact />
            <Link to="/join" className="font-semibold text-[#caa747] transition hover:text-[#a87916]">
              {t('Join now')}
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#e1e4e8] px-4 pb-[38px] pt-[52px] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[790px] flex-col items-center text-center">
          <p className="landing-soft-gold-border inline-flex min-h-[32px] items-center rounded-full border border-[#dcc070] bg-[#fffaf0] px-[18px] text-[12px] font-semibold uppercase leading-none tracking-[0.22em] text-[#a47713]">
            {t('Guatemala rewards, launched from local business QR stickers')}
          </p>

          <h1 className="mt-[24px] max-w-[700px] font-serif text-[38px] font-bold leading-[1.11] tracking-normal text-[#202023] sm:text-[44px]">
            {t('Scan once. Join locally.')} <span className="text-[#cfaa44]">{t('Earn rewards')}</span> {t('with Guatemala partners.')}
          </h1>

          <div className="mt-[22px] max-w-[610px] space-y-[18px] text-[17px] font-medium leading-[1.55] text-[#687282]">
            <p>
              {t('Guatemala Rewards gives each partner business its own scannable on-site entry point, so customers can learn, join, and start earning from the place they already visited.')}
            </p>
            <p>
              {t('The first launch priority is simple: clear business-specific QR pages that explain the program and turn real foot traffic into members.')}
            </p>
          </div>

          <div className="mt-[30px] grid w-full max-w-[700px] gap-[14px]">
            {featureRows.map((item) => {
              const Icon = item.icon

              return (
                <div key={String(item.text)} className="flex min-h-[55px] items-center gap-4 rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[21px] text-left text-[14px] font-medium leading-5 text-[#687282] shadow-[0_2px_4px_rgba(16,24,40,0.04)]">
                  <Icon className="size-[17px] shrink-0 text-[#caa747]" strokeWidth={1.9} aria-hidden="true" />
                  <span>{item.text}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-[28px] flex max-w-[800px] flex-wrap items-center justify-center gap-[10px]">
            {categoryPills.map((item) => {
              const Icon = item.icon

              return (
                <span key={item.label} className="inline-flex min-h-[38px] items-center gap-[10px] rounded-full border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[13px] font-medium text-[#545b66]">
                  <Icon className="size-[15px] text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </span>
              )
            })}
          </div>

          <Link
            to="/join"
            className="mt-[26px] inline-flex min-h-[54px] min-w-[278px] items-center justify-center rounded-[8px] bg-[#d1ad4a] px-8 text-[15px] font-bold text-[#121212] transition hover:bg-[#c29f3d]"
          >
            {t('Join Guatemala Rewards')}
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-[#e1e4e8] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] text-center">
          <h2 className="font-serif text-[30px] font-bold leading-none text-[#202023]">{t('How it works')}</h2>

          <div className="mt-[24px] grid gap-[16px] md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="flex min-h-[132px] flex-col items-center rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[28px] py-[16px]">
                <div className="landing-soft-gold-border flex size-[36px] items-center justify-center rounded-full border border-[#dfc477] bg-[#fffaf0] text-[16px] font-semibold text-[#a47713]">
                  {index + 1}
                </div>
                <h3 className="mt-[15px] text-[15px] font-bold text-[#202023]">{step.title}</h3>
                <p className="mt-[11px] text-[13px] font-medium leading-[1.55] text-[#687282]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-[#e1e4e8] px-4 pb-[34px] pt-[38px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[700px]">
          <h2 className="text-center font-serif text-[30px] font-bold leading-none text-[#202023]">
            {t('Frequently asked questions')}
          </h2>

          <div className="mt-[24px] space-y-[11px]">
            {faqs.map((item) => {
              const Icon = item.icon

              return (
                <details key={item.question} className="group rounded-[7px] border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[#2f3339]">
                  <summary className="flex min-h-[58px] cursor-pointer list-none items-center gap-[13px] text-[14px] font-bold [&::-webkit-details-marker]:hidden">
                    <Icon className="size-[15px] shrink-0 text-[#caa747]" strokeWidth={1.7} aria-hidden="true" />
                    <span>{item.question}</span>
                  </summary>
                  <p className="pb-[18px] pl-[28px] pr-[10px] text-[13px] font-medium leading-[1.65] text-[#687282]">
                    {item.answer}
                  </p>
                </details>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="flex min-h-[86px] items-center bg-[#ffffff] px-8">
        <div className="mx-auto grid w-full max-w-[1336px] gap-4 text-center md:grid-cols-[1fr_auto_1fr] md:items-center md:text-left">
          <BrandLogo className="justify-center md:justify-start" imageClassName="w-[62px]" />
          <p className="text-[12px] font-medium text-[#687282]">Business-coded QR stickers for local member rewards</p>
          <nav className="flex flex-wrap items-center justify-center gap-[16px] text-[12px] font-medium text-[#687282] md:justify-end">
            <Link to="/reward-terms" className="transition hover:text-[#202023]">Member agreement</Link>
            <span className="text-[#c5cad2]">|</span>
            <Link to="/privacy" className="transition hover:text-[#202023]">Privacy policy</Link>
            <span className="text-[#c5cad2]">|</span>
            <Link to="/terms" className="transition hover:text-[#202023]">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
export function LegacyAuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null

    const storedError = sessionStorage.getItem(portalAccessErrorKey)
    if (storedError) {
      sessionStorage.removeItem(portalAccessErrorKey)
    }
    return storedError
  })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)

  const signInForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  const resetForm = useForm<Pick<AuthFormValues, 'email'>>({
    defaultValues: {
      email: '',
    },
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface px-4 py-4 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--rose-brown)_18%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--espresso)_28%,transparent),transparent_32%)]" />
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[74rem] flex-col justify-center gap-5">
        <div className="relative z-10 ml-auto flex items-center gap-2 md:absolute md:right-8 md:top-4 lg:right-10">
          <ThemeToggle className="rounded-full border border-[var(--champagne)]/24 bg-[var(--espresso)]/35 text-[var(--champagne)] hover:bg-[var(--espresso)]/55 hover:text-[var(--cream)]" />
          <LanguagePicker className="text-on-surface-variant" />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl md:text-5xl">
            {t('Member Access')}
          </h2>
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">
            {t('Sign in to manage your member rewards.')}
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(27rem,0.72fr)]">
          <section className="relative flex min-h-[31rem] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-6 text-[var(--cream)] shadow-panel md:px-8 lg:px-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[4rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />

          <div className="relative z-10 space-y-7">
            <div className="flex size-14 items-center justify-center rounded-full border border-[var(--champagne)]/28 bg-[var(--champagne)]/16 text-[var(--champagne)] shadow-soft">
              <Coins className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
                {t('Private member access')}
              </p>
              <h1 className="font-serif text-[clamp(2.35rem,4.4vw,4rem)] font-semibold leading-[0.92] tracking-[0.01em] text-[var(--cream)]">
                {t('Member portal')}{' '}
                <span className="text-[var(--champagne)]">{t('sign in.')}</span>
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--cream)]/88">
                {t('Track your rewards, gift-card value, and member activity in one verified account across the network.')}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[0.9rem] border border-[var(--champagne)]/24 bg-[var(--espresso)]/34 p-4 transition hover:-translate-y-0.5 hover:border-[var(--champagne)]/55 hover:bg-[var(--espresso)]/52">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
                {t('Portal')}
              </p>
              <p className="mt-3 font-serif text-3xl text-[var(--cream)]">
                {t('Member')}
              </p>
            </div>
            <div className="rounded-[0.9rem] border border-[var(--champagne)]/24 bg-[var(--espresso)]/34 p-4 transition hover:-translate-y-0.5 hover:border-[var(--champagne)]/55 hover:bg-[var(--espresso)]/52">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
                {t('Create account')}
              </p>
              <Link
                to="/join"
                className="mt-3 inline-flex text-sm font-semibold text-[var(--cream)] hover:text-[var(--champagne)]"
              >
                {t('Join now')}
              </Link>
            </div>
          </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col py-0">
            <div className="relative flex min-h-[31rem] w-full flex-col justify-center overflow-hidden rounded-[1.6rem] border border-[var(--champagne)]/24 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--espresso)_86%,var(--rose-brown)),var(--espresso))] p-8 text-[var(--cream)] shadow-panel">
              <div className="absolute right-0 top-0 size-24 rounded-bl-[3.5rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-55" />
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />
              <div className="relative z-10">
                {showForgotPassword ? (
                  <form
                    className="space-y-6"
                    onSubmit={resetForm.handleSubmit(async (values) => {
                      try {
                        setError(null)
                        setResetSuccessMessage(null)
                        await authService.resetPassword(values.email.trim())
                        setResetSuccessMessage(t('Check your email for a password reset link.'))
                        setShowForgotPassword(false)
                        resetForm.reset({ email: '' })
                      } catch (submissionError) {
                        setError(
                          submissionError instanceof Error
                            ? submissionError.message
                            : t('Unable to send reset link.'),
                        )
                      }
                    })}
                  >
                    <div className="space-y-2 text-center">
                      <h3 className="font-serif text-4xl tracking-tight text-[var(--champagne)]">
                        {t('Reset Password')}
                      </h3>
                      <p className="text-sm font-medium text-[var(--cream)]/74">
                        {t("Enter your email and we'll send you a reset link.")}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="reset-email" className="text-[var(--champagne)]">{t('Email Address')}</Label>
                      <Input id="reset-email" className={authInputClass} placeholder="your@email.com" {...resetForm.register('email')} />
                    </div>

                    {error ? <p className="text-sm font-bold text-red-500 text-center">{t(error)}</p> : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full bg-[var(--champagne)] font-bold tracking-[0.12em] text-[var(--espresso)] uppercase hover:bg-[var(--cream)]"
                      disabled={resetForm.formState.isSubmitting}
                    >
                      {resetForm.formState.isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <LoadingSpinner />
                          {t('Send reset link')}
                        </span>
                      ) : (
                        t('Send reset link')
                      )}
                    </Button>

                    <button
                      type="button"
                      className="block w-full text-center text-sm font-medium text-[var(--champagne)]/75 transition hover:text-[var(--champagne)]"
                      onClick={() => {
                        setError(null)
                        setShowForgotPassword(false)
                      }}
                    >
                      {t('Back to sign in')}
                    </button>
                  </form>
                ) : (
                  <form
                    className="space-y-6"
                    onSubmit={signInForm.handleSubmit(
                      async (values) => {
                        try {
                          setError(null)
                          setResetSuccessMessage(null)
                          await signIn({ ...values, role: 'customer' })
                          const redirect = searchParams.get('redirect')
                          if (redirect) {
                            navigate(redirect)
                          }
                        } catch (submissionError) {
                          setError(
                            submissionError instanceof Error
                              ? submissionError.message
                              : t('Unable to sign in.'),
                          )
                        }
                      },
                      () => {
                        setError(t('Enter a valid email address and password to sign in.'))
                      },
                    )}
                  >
                    {resetSuccessMessage ? (
                      <p className="text-sm font-bold text-success text-center">{resetSuccessMessage}</p>
                    ) : null}

                    <div className="grid gap-3">
                      <Label htmlFor="signin-email" className="text-[var(--champagne)]">{t('Email Address')}</Label>
                      <Input id="signin-email" className={authInputClass} placeholder="your@email.com" {...signInForm.register('email')} />
                      {signInForm.formState.errors.email ? (
                        <p className="text-xs font-bold text-red-500">
                          {t(signInForm.formState.errors.email.message ?? '')}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signin-password" className="text-[var(--champagne)]">{t('Password')}</Label>
                      <Input id="signin-password" className={authInputClass} type="password" placeholder="Password" {...signInForm.register('password')} />
                      {signInForm.formState.errors.password ? (
                        <p className="text-xs font-bold text-red-500">
                          {t(signInForm.formState.errors.password.message ?? '')}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-[var(--champagne)]/75 transition hover:text-[var(--champagne)]"
                        onClick={() => {
                          setError(null)
                          resetForm.setValue('email', signInForm.getValues('email'))
                          setShowForgotPassword(true)
                        }}
                      >
                        {t('Forgot password?')}
                      </button>
                    </div>

                    {error ? <p className="text-sm font-bold text-red-500 text-center">{t(error)}</p> : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full bg-[var(--champagne)] font-bold tracking-[0.12em] text-[var(--espresso)] uppercase hover:bg-[var(--cream)]"
                      disabled={signInForm.formState.isSubmitting}
                    >
                      {signInForm.formState.isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <LoadingSpinner />
                          {t('Signing in...')}
                        </span>
                      ) : (
                        t('Sign In')
                      )}
                    </Button>

                    <p className="text-center text-sm font-medium text-[var(--cream)]/72">
                      {t('Need a member account?')}{' '}
                      <Link to="/join" className="font-bold text-[var(--champagne)] transition hover:text-[var(--cream)]">
                        {t('Join now')}
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
        </section>
      </div>
    </div>
    </div>
  )
}

export function CompactAuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null

    const storedError = sessionStorage.getItem(portalAccessErrorKey)
    if (storedError) {
      sessionStorage.removeItem(portalAccessErrorKey)
    }
    return storedError
  })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)

  const signInForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  const resetForm = useForm<Pick<AuthFormValues, 'email'>>({
    defaultValues: {
      email: '',
    },
  })

  return (
    <AuthPortalShell activeTab="signin">
      <div className="mb-7 text-center">
        <BrandLogo imageClassName="mx-auto w-[96px]" />
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8f8f8f]">
          {t('Member Portal').toUpperCase()}
        </p>
      </div>

      {showForgotPassword ? (
        <form
          className="space-y-5"
          onSubmit={resetForm.handleSubmit(async (values) => {
            try {
              setError(null)
              setResetSuccessMessage(null)
              await authService.resetPassword(values.email.trim())
              setResetSuccessMessage(t('Check your email for a password reset link.'))
              setShowForgotPassword(false)
              resetForm.reset({ email: '' })
            } catch (submissionError) {
              setError(
                submissionError instanceof Error
                  ? submissionError.message
                  : t('Unable to send reset link.'),
              )
            }
          })}
        >
          <div className="space-y-2 text-center">
            <h1 className="font-serif text-[22px] font-bold text-[#d1ad4a]">{t('Reset Password')}</h1>
            <p className="text-[12px] font-medium leading-5 text-[#8f8f8f]">
              {t("Enter your email and we'll send you a reset link.")}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reset-email" className={authLabelClass}>{t('Email address')}</Label>
            <Input id="reset-email" className={authInputClass} placeholder="your@email.com" {...resetForm.register('email')} />
          </div>

          {error ? <p className={authErrorClass}>{t(error)}</p> : null}

          <Button
            type="submit"
            size="lg"
            className="h-[46px] w-full rounded-[6px] bg-[#d1ad4a] text-[14px] font-bold tracking-[0.04em] text-[#080808] hover:bg-[#c5a141]"
            disabled={resetForm.formState.isSubmitting}
          >
            {resetForm.formState.isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner />
                {t('Send reset link')}
              </span>
            ) : (
              t('Send reset link')
            )}
          </Button>

          <button
            type="button"
            className="block w-full text-center text-[12px] font-semibold text-[#d1ad4a] transition hover:text-[#f0ca62]"
            onClick={() => {
              setError(null)
              setShowForgotPassword(false)
            }}
          >
            {t('Back to sign in')}
          </button>
        </form>
      ) : (
        <form
          className="space-y-5"
          onSubmit={signInForm.handleSubmit(
            async (values) => {
              try {
                setError(null)
                setResetSuccessMessage(null)
                await signIn({ ...values, role: 'customer' })
                const redirect = searchParams.get('redirect')
                if (redirect) {
                  navigate(redirect)
                }
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : t('Unable to sign in.'),
                )
              }
            },
            () => {
              setError(t('Enter a valid email address and password to sign in.'))
            },
          )}
        >
          {resetSuccessMessage ? (
            <p className="text-center text-xs font-bold text-success">{resetSuccessMessage}</p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="signin-email" className={authLabelClass}>{t('Email address')}</Label>
            <Input id="signin-email" className={authInputClass} placeholder="your@email.com" {...signInForm.register('email')} />
            {signInForm.formState.errors.email ? (
              <p className="text-xs font-bold text-red-400">
                {t(signInForm.formState.errors.email.message ?? '')}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="signin-password" className={authLabelClass}>{t('Password')}</Label>
            <div className="relative">
              <Input
                id="signin-password"
                className={`${authInputClass} pr-10`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...signInForm.register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-[#6b7280] transition hover:text-[#111827]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {signInForm.formState.errors.password ? (
              <p className="text-xs font-bold text-red-400">
                {t(signInForm.formState.errors.password.message ?? '')}
              </p>
            ) : null}
            <button
              type="button"
              className="justify-self-end text-[12px] font-semibold text-[#d1ad4a] transition hover:text-[#f0ca62]"
              onClick={() => {
                setError(null)
                resetForm.setValue('email', signInForm.getValues('email'))
                setShowForgotPassword(true)
              }}
            >
              {t('Forgot password?')}
            </button>
          </div>

          {error ? <p className={authErrorClass}>{t(error)}</p> : null}

          <Button
            type="submit"
            size="lg"
            className="h-[46px] w-full rounded-[6px] bg-[#d1ad4a] text-[14px] font-bold tracking-[0.04em] text-[#080808] hover:bg-[#c5a141]"
            disabled={signInForm.formState.isSubmitting}
          >
            {signInForm.formState.isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner />
                {t('Signing in...')}
              </span>
            ) : (
              `${t('Sign in to my account')} ↗`
            )}
          </Button>

          <p className="text-center text-[11px] font-medium text-[#8aa0bc]">
            {t("Don't have an account?")}{' '}
            <Link to="/join" className="font-bold text-[#d1ad4a] transition hover:text-[#f0ca62]">
              {t('Join Guatemala Rewards')}
            </Link>
          </p>
        </form>
      )}
    </AuthPortalShell>
  )
}

export function AuthPage() {
  return <CompactAuthPage />
}
