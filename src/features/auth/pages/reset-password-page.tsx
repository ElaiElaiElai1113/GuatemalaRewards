import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { authService } from '@/integrations/supabase/services/auth-service'
import { useLanguage } from '@/lib/language'

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Use at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const { t } = useLanguage()
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    let isMounted = true

    void authService
      .ensureRecoverySession()
      .then((hasSession) => {
        if (!isMounted) return

        if (!hasSession) {
          setSessionError('Auth session missing. Open the latest reset link again.')
          return
        }

        setSessionError(null)
        setIsSessionReady(true)
      })
      .catch((error) => {
        if (!isMounted) return

        setSessionError(error instanceof Error ? error.message : 'Auth session missing. Open the latest reset link again.')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('root')

    if (!isSessionReady) {
      form.setError('root', {
        message: sessionError ?? 'Auth session missing. Open the latest reset link again.',
      })
      return
    }

    try {
      await authService.updatePassword(values.password)
      form.reset()
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Password could not be updated.',
      })
    }
  })

  return (
    <AuthPortalShell activeTab="signin">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2 text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#d1ad4a]">
            {t('Reset Password')}
          </p>
          <h1 className="font-serif text-3xl text-[var(--foreground)]">Set a new password</h1>
          <p className="text-sm font-medium leading-6 text-[var(--muted-foreground)]">
            Use at least 6 characters for your new password.
          </p>
        </div>

        {!isSessionReady && !sessionError ? (
          <p className="text-center text-sm font-medium text-[var(--muted-foreground)]">
            Preparing secure reset session...
          </p>
        ) : null}

        {sessionError ? (
          <p className="text-center text-sm font-bold text-red-500">{sessionError}</p>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" {...form.register('password')} />
          {form.formState.errors.password ? (
            <p className="text-xs font-bold text-red-500">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" type="password" {...form.register('confirmPassword')} />
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs font-bold text-red-500">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {form.formState.isSubmitSuccessful ? (
          <p className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-center text-sm font-bold text-success">
            Password updated. You can sign in with your new password.
          </p>
        ) : null}

        {form.formState.errors.root ? (
          <p className="text-center text-sm font-bold text-red-500">{form.formState.errors.root.message}</p>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting || !isSessionReady}>
            {form.formState.isSubmitting ? t('Saving...') : 'Update password'}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/signin">{t('Back to sign in')}</Link>
          </Button>
        </div>
      </form>
    </AuthPortalShell>
  )
}
