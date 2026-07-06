import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'
import { authSchema, type AuthFormValues } from '@/types/forms'

type StaffPortal = 'admin' | 'business'
const portalAccessErrorKey = 'portalAccessError'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'business-owner',
}

const staffInputClass =
  'h-[42px] rounded-none border-[#d8dce4] bg-[#f8f9fb] px-3.5 text-[15px] text-[#111827] shadow-none placeholder:text-[#6b7280] focus-visible:ring-[#d1ad4a]/35'
const staffLabelClass = 'text-[12px] font-semibold text-[#8f8f8f]'
const staffErrorClass = 'text-center text-xs font-bold text-red-400'

function LoadingSpinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z" />
    </svg>
  )
}

export function StaffLoginPage({ portal }: { portal: StaffPortal }) {
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
    defaultValues: {
      ...defaultValues,
      role: portal === 'admin' ? 'platform-admin' : 'business-owner',
    },
  })

  const resetForm = useForm<Pick<AuthFormValues, 'email'>>({
    defaultValues: {
      email: '',
    },
  })

  const isAdminPortal = portal === 'admin'
  const portalHome = isAdminPortal ? '/admin/portal' : '/business/dashboard'
  const portalLabel = isAdminPortal ? t('Admin Portal') : t('Business Portal')

  return (
    <AuthPortalShell showTabs={false}>
      <div className="mb-7 text-center">
        <BrandLogo className="mx-auto" imageClassName="w-[96px]" aria-label="Guatemala Rewards" />
        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8f8f8f]">
          {portalLabel.toUpperCase()}
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
            <Label htmlFor="staff-reset-email" className={staffLabelClass}>{t('Email address')}</Label>
            <Input id="staff-reset-email" className={staffInputClass} placeholder="your@email.com" {...resetForm.register('email')} />
          </div>

          {error ? <p className={staffErrorClass}>{t(error)}</p> : null}

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
                await signIn({
                  ...values,
                  role: isAdminPortal ? 'platform-admin' : values.role,
                })
                const redirect = searchParams.get('redirect')
                navigate(redirect || portalHome)
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
            <Label htmlFor="staff-signin-email" className={staffLabelClass}>{t('Email address')}</Label>
            <Input id="staff-signin-email" className={staffInputClass} placeholder="your@email.com" {...signInForm.register('email')} />
            {signInForm.formState.errors.email ? (
              <p className="text-xs font-bold text-red-400">{t(signInForm.formState.errors.email.message ?? '')}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="staff-signin-password" className={staffLabelClass}>{t('Password')}</Label>
            <div className="relative">
              <Input
                id="staff-signin-password"
                className={`${staffInputClass} pr-10`}
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
              <p className="text-xs font-bold text-red-400">{t(signInForm.formState.errors.password.message ?? '')}</p>
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

          {error ? <p className={staffErrorClass}>{t(error)}</p> : null}

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
              t('Sign in')
            )}
          </Button>
        </form>
      )}
    </AuthPortalShell>
  )
}
