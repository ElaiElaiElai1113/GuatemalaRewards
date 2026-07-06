import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Eye, EyeOff, Gift } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { memberSignUpSchema, type MemberSignUpFormValues } from '@/types/forms'

const defaultValues: MemberSignUpFormValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
}

const joinInputClass =
  'h-12 rounded-2xl border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] shadow-none placeholder:text-[var(--muted-foreground)] focus-visible:border-primary focus-visible:ring-primary/15'
const joinLabelClass = 'text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[var(--muted-foreground)]'

function homePathForRole(role: string) {
  if (role === 'platform-admin') return '/admin/portal'
  if (role === 'business-owner' || role === 'business-staff') return '/business/dashboard'
  return '/dashboard'
}

export function LegacyJoinRewardsPage() {
  const { profile, signUp } = useAuth()
  const { t } = useLanguage()
  const [signUpComplete, setSignUpComplete] = useState(false)
  const [signUpWarning, setSignUpWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<MemberSignUpFormValues>({
    resolver: zodResolver(memberSignUpSchema),
    defaultValues,
  })

  if (profile && !signUpComplete) {
    return <Navigate replace to={homePathForRole(profile.role)} />
  }

  return (
    <main className="legacy-signup-shell min-h-screen overflow-x-hidden px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1fr)] lg:items-center">
        <section className="legacy-signup-frame rounded-3xl p-6 shadow-soft sm:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                {t('Guatemala Rewards')}
              </p>
              <Link to="/" className="rounded-full px-4 py-2 text-sm font-bold text-primary transition hover:bg-[var(--muted)]">
                {t('Back to landing page')}
              </Link>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-none sm:text-5xl">
                {t('Create your member account')}
              </h1>
              <p className="max-w-xl text-lg font-semibold leading-7 text-[var(--muted-foreground)]">
                {t('Create your account first. Once approved, eligible spending can earn 20-100% back as reward points.')}
              </p>
            </div>

            <div className="grid gap-3 text-sm font-bold text-[var(--muted-foreground)]">
              <p>{t('Earn between 20% - 100% by simply spending at amazing businesses within our platform')}</p>
              <p>{t('After signup, your account may need admin approval before reward actions unlock.')}</p>
            </div>
          </div>
        </section>

        <section id="join-form" className="w-full">
          <div className="legacy-signup-card w-full rounded-3xl p-5 shadow-soft sm:p-7">
            {signUpComplete ? (
              <div className="space-y-7 py-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <BadgeCheck className="size-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-black leading-tight text-[var(--foreground)]">{t('Welcome to the Rewards Club.')}</h2>
                  <p className="mx-auto max-w-md text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                    {t('Your account is created. Sign in to use your member QR and rewards. We will use your contact details for reward updates and account support.')}
                  </p>
                  {signUpWarning ? (
                    <p className="mx-auto max-w-md text-sm font-bold leading-6 text-warning">
                      {signUpWarning}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary-container">
                    <Link to="/signin">{t('Go to sign in')}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-primary/30 bg-[var(--card)] text-primary hover:bg-[var(--muted)]">
                    <Link to="/rewards">{t('View rewards')}</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setError(null)
                    const result = await signUp({ ...values, role: 'customer' })
                    setSignUpWarning(result.warning ?? null)
                    form.reset(defaultValues)
                    setSignUpComplete(true)
                  } catch (submissionError) {
                    if (
                      submissionError instanceof Error &&
                      submissionError.message.includes('profile could not be loaded')
                    ) {
                      form.reset(defaultValues)
                      setSignUpComplete(true)
                      return
                    }

                    setError(
                      submissionError instanceof Error
                        ? t(submissionError.message)
                        : t('Unable to create the account.'),
                    )
                  }
                })}
              >
                <div className="space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{t('Member signup')}</p>
                  <h2 className="text-3xl font-black leading-tight text-[var(--foreground)]">{t('Create your member account')}</h2>
                  <p className="text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                    {t('Full name, email, and WhatsApp or phone are enough to start. ID checks may be added later for extra security.')}
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-name" className={joinLabelClass}>{t('Full name')}</Label>
                  <Input id="join-name" className={joinInputClass} placeholder={t('Your name')} {...form.register('fullName')} />
                  {form.formState.errors.fullName ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.fullName.message ?? '')}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-email" className={joinLabelClass}>{t('Email address')}</Label>
                  <Input id="join-email" className={joinInputClass} type="email" placeholder="your@email.com" {...form.register('email')} />
                  {form.formState.errors.email ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.email.message ?? '')}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-phone" className={joinLabelClass}>{t('WhatsApp or phone')}</Label>
                  <Input id="join-phone" className={joinInputClass} type="tel" placeholder="+57 300 000 0000" {...form.register('phone')} />
                  {form.formState.errors.phone ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.phone.message ?? '')}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-password" className={joinLabelClass}>{t('Password')}</Label>
                  <Input id="join-password" className={joinInputClass} type="password" placeholder={t('Password')} {...form.register('password')} />
                  {form.formState.errors.password ? (
                    <p className="text-xs font-bold text-error">{t(form.formState.errors.password.message ?? '')}</p>
                  ) : null}
                </div>

                {error ? (
                  <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm font-bold text-error">
                    {t(error)}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary-container"
                  isLoading={form.formState.isSubmitting}
                >
                  <Gift className="size-4" />
                  {t('Join and earn points')}
                </Button>

                <p className="text-center text-xs font-medium text-[var(--muted-foreground)]">
                  {t('Already a member?')} <Link to="/signin" className="font-bold text-primary hover:underline">{t('Sign in')}</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export function CompactJoinRewardsPage() {
  const { profile, signUp } = useAuth()
  const { t } = useLanguage()
  const [signUpComplete, setSignUpComplete] = useState(false)
  const [signUpWarning, setSignUpWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<MemberSignUpFormValues>({
    resolver: zodResolver(memberSignUpSchema),
    defaultValues,
  })

  if (profile && !signUpComplete) {
    return <Navigate replace to={homePathForRole(profile.role)} />
  }

  return (
    <AuthPortalShell activeTab="signup">
      <div className="mb-7 text-center">
        <p className="font-serif text-[18px] font-bold leading-none text-[#d1ad4a]">
          Guatemala Rewards
        </p>
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8f8f8f]">
          {t('Member Portal').toUpperCase()}
        </p>
      </div>

      {signUpComplete ? (
        <div className="space-y-6 py-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-[8px] bg-[#d1ad4a] text-[#080808]">
            <BadgeCheck className="size-7" />
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-[22px] font-bold text-[#d1ad4a]">
              {t('Welcome to the Rewards Club.')}
            </h1>
            <p className="text-[12px] font-medium leading-5 text-[#8f8f8f]">
              {t('Your account is created. Sign in to use your member QR and rewards. We will use your contact details for reward updates and account support.')}
            </p>
            {signUpWarning ? (
              <p className="text-xs font-bold leading-5 text-warning">{signUpWarning}</p>
            ) : null}
          </div>
          <Button asChild className="h-[46px] w-full rounded-[6px] bg-[#d1ad4a] text-[14px] font-bold text-[#080808] hover:bg-[#c5a141]">
            <Link to="/signin">{t('Go to sign in')}</Link>
          </Button>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              setError(null)
              const result = await signUp({ ...values, role: 'customer' })
              setSignUpWarning(result.warning ?? null)
              form.reset(defaultValues)
              setSignUpComplete(true)
            } catch (submissionError) {
              if (
                submissionError instanceof Error &&
                submissionError.message.includes('profile could not be loaded')
              ) {
                form.reset(defaultValues)
                setSignUpComplete(true)
                return
              }

              setError(
                submissionError instanceof Error
                  ? t(submissionError.message)
                  : t('Unable to create the account.'),
              )
            }
          })}
        >
          <div className="grid gap-2">
            <Label htmlFor="join-name" className="text-[12px] font-semibold text-[#8f8f8f]">{t('Full name')}</Label>
            <Input id="join-name" className="h-[42px] rounded-none border-[#d8dce4] bg-[#f8f9fb] px-3.5 text-[15px] text-[#111827] shadow-none placeholder:text-[#6b7280] focus-visible:ring-[#d1ad4a]/35" placeholder={t('Your name')} {...form.register('fullName')} />
            {form.formState.errors.fullName ? (
              <p className="text-xs font-bold text-red-400">{t(form.formState.errors.fullName.message ?? '')}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="join-email" className="text-[12px] font-semibold text-[#8f8f8f]">{t('Email address')}</Label>
            <Input id="join-email" className="h-[42px] rounded-none border-[#d8dce4] bg-[#f8f9fb] px-3.5 text-[15px] text-[#111827] shadow-none placeholder:text-[#6b7280] focus-visible:ring-[#d1ad4a]/35" type="email" placeholder="your@email.com" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-xs font-bold text-red-400">{t(form.formState.errors.email.message ?? '')}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="join-phone" className="text-[12px] font-semibold text-[#8f8f8f]">{t('WhatsApp or phone')}</Label>
            <Input id="join-phone" className="h-[42px] rounded-none border-[#d8dce4] bg-[#f8f9fb] px-3.5 text-[15px] text-[#111827] shadow-none placeholder:text-[#6b7280] focus-visible:ring-[#d1ad4a]/35" type="tel" placeholder="+57 300 000 0000" {...form.register('phone')} />
            {form.formState.errors.phone ? (
              <p className="text-xs font-bold text-red-400">{t(form.formState.errors.phone.message ?? '')}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="join-password" className="text-[12px] font-semibold text-[#8f8f8f]">{t('Password')}</Label>
            <div className="relative">
              <Input
                id="join-password"
                className="h-[42px] rounded-none border-[#d8dce4] bg-[#f8f9fb] px-3.5 pr-10 text-[15px] text-[#111827] shadow-none placeholder:text-[#6b7280] focus-visible:ring-[#d1ad4a]/35"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...form.register('password')}
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
            {form.formState.errors.password ? (
              <p className="text-xs font-bold text-red-400">{t(form.formState.errors.password.message ?? '')}</p>
            ) : null}
          </div>

          {error ? (
            <p className="text-center text-xs font-bold text-red-400">{t(error)}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-[46px] w-full rounded-[6px] bg-[#d1ad4a] text-[14px] font-bold tracking-[0.04em] text-[#080808] hover:bg-[#c5a141]"
            isLoading={form.formState.isSubmitting}
          >
            {t('Create my account')} ↗
          </Button>

          <p className="text-center text-[11px] font-medium text-[#8aa0bc]">
            {t('Already have an account?')}{' '}
            <Link to="/signin" className="font-bold text-[#d1ad4a] transition hover:text-[#f0ca62]">
              {t('Sign in')}
            </Link>
          </p>
        </form>
      )}
    </AuthPortalShell>
  )
}

export function SplitJoinRewardsPage() {
  const { profile, signUp } = useAuth()
  const { t } = useLanguage()
  const [signUpComplete, setSignUpComplete] = useState(false)
  const [signUpWarning, setSignUpWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<MemberSignUpFormValues>({
    resolver: zodResolver(memberSignUpSchema),
    defaultValues,
  })

  if (profile && !signUpComplete) {
    return <Navigate replace to={homePathForRole(profile.role)} />
  }

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
            {t('Create your member account.')}
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(27rem,0.72fr)]">
          <section className="relative flex min-h-[31rem] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-6 text-[var(--cream)] shadow-panel md:px-8 lg:px-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[4rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />
            <div className="relative z-10 space-y-7">
              <div className="flex size-14 items-center justify-center rounded-full border border-[var(--champagne)]/28 bg-[var(--champagne)]/16 text-[var(--champagne)] shadow-soft">
                <Gift className="size-7" aria-hidden="true" />
              </div>
              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
                  {t('Private member access')}
                </p>
                <h1 className="font-serif text-[clamp(2.35rem,4.4vw,4rem)] font-semibold leading-[0.92] tracking-[0.01em] text-[var(--cream)]">
                  {t('Member portal')}{' '}
                  <span className="text-[var(--champagne)]">{t('create account.')}</span>
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--cream)]/88">
                  {t('Create your account first. Once approved, eligible spending can earn 20-100% back as reward points.')}
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
                    {t('Already have an account?')}
                  </p>
                  <Link className="mt-3 inline-flex text-sm font-semibold text-[var(--cream)] hover:text-[var(--champagne)]" to="/signin">
                    {t('Sign in')}
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
                {signUpComplete ? (
                  <div className="space-y-6 py-2 text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-[0.9rem] bg-[var(--champagne)] text-[var(--espresso)]">
                      <BadgeCheck className="size-7" />
                    </div>
                    <div className="space-y-3">
                      <h1 className="font-serif text-3xl font-bold text-[var(--champagne)]">
                        {t('Welcome to the Rewards Club.')}
                      </h1>
                      <p className="text-sm font-medium leading-6 text-[var(--cream)]/74">
                        {t('Your account is created. Sign in to use your member QR and rewards. We will use your contact details for reward updates and account support.')}
                      </p>
                      {signUpWarning ? (
                        <p className="text-xs font-bold leading-5 text-warning">{signUpWarning}</p>
                      ) : null}
                    </div>
                    <Button asChild className="h-12 w-full bg-[var(--champagne)] font-bold tracking-[0.12em] text-[var(--espresso)] uppercase hover:bg-[var(--cream)]">
                      <Link to="/signin">{t('Go to sign in')}</Link>
                    </Button>
                  </div>
                ) : (
                  <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(async (values) => {
                      try {
                        setError(null)
                        const result = await signUp({ ...values, role: 'customer' })
                        setSignUpWarning(result.warning ?? null)
                        form.reset(defaultValues)
                        setSignUpComplete(true)
                      } catch (submissionError) {
                        if (
                          submissionError instanceof Error &&
                          submissionError.message.includes('profile could not be loaded')
                        ) {
                          form.reset(defaultValues)
                          setSignUpComplete(true)
                          return
                        }

                        setError(
                          submissionError instanceof Error
                            ? t(submissionError.message)
                            : t('Unable to create the account.'),
                        )
                      }
                    })}
                  >
                    <div className="grid gap-3">
                      <Label htmlFor="join-name" className="text-[var(--champagne)]">{t('Full name')}</Label>
                      <Input id="join-name" className="border-[var(--champagne)]/22 bg-[var(--espresso)]/42 text-[var(--cream)]" placeholder={t('Your name')} {...form.register('fullName')} />
                      {form.formState.errors.fullName ? (
                        <p className="text-xs font-bold text-red-500">{t(form.formState.errors.fullName.message ?? '')}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="join-email" className="text-[var(--champagne)]">{t('Email address')}</Label>
                      <Input id="join-email" className="border-[var(--champagne)]/22 bg-[var(--espresso)]/42 text-[var(--cream)]" type="email" placeholder="your@email.com" {...form.register('email')} />
                      {form.formState.errors.email ? (
                        <p className="text-xs font-bold text-red-500">{t(form.formState.errors.email.message ?? '')}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="join-phone" className="text-[var(--champagne)]">{t('WhatsApp or phone')}</Label>
                      <Input id="join-phone" className="border-[var(--champagne)]/22 bg-[var(--espresso)]/42 text-[var(--cream)]" type="tel" placeholder="+57 300 000 0000" {...form.register('phone')} />
                      {form.formState.errors.phone ? (
                        <p className="text-xs font-bold text-red-500">{t(form.formState.errors.phone.message ?? '')}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="join-password" className="text-[var(--champagne)]">{t('Password')}</Label>
                      <div className="relative">
                        <Input
                          id="join-password"
                          className="border-[var(--champagne)]/22 bg-[var(--espresso)]/42 pr-10 text-[var(--cream)]"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          {...form.register('password')}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-3 flex items-center text-[var(--champagne)]/75 transition hover:text-[var(--champagne)]"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {form.formState.errors.password ? (
                        <p className="text-xs font-bold text-red-500">{t(form.formState.errors.password.message ?? '')}</p>
                      ) : null}
                    </div>

                    {error ? (
                      <p className="text-center text-sm font-bold text-red-500">{t(error)}</p>
                    ) : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full bg-[var(--champagne)] font-bold tracking-[0.12em] text-[var(--espresso)] uppercase hover:bg-[var(--cream)]"
                      isLoading={form.formState.isSubmitting}
                    >
                      {t('Create my account')}
                    </Button>

                    <p className="text-center text-sm font-medium text-[var(--cream)]/72">
                      {t('Already have an account?')}{' '}
                      <Link to="/signin" className="font-bold text-[var(--champagne)] transition hover:text-[var(--cream)]">
                        {t('Sign in')}
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

export function JoinRewardsPage() {
  return <CompactJoinRewardsPage />
}
