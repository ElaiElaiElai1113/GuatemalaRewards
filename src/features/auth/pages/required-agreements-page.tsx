import { zodResolver } from '@hookform/resolvers/zod'
import { FileSignature, LogOut, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { useRequiredAgreements, useSignAgreement } from '@/hooks/use-legal-agreements'
import { getHomePathForRole } from '@/lib/role-routes'
import { SignaturePad } from '../components/signature-pad'
import {
  signAgreementSchema,
  type SignAgreementFormValues,
} from '@/types/forms'
import { useForm } from 'react-hook-form'

export function RequiredAgreementsPage() {
  const navigate = useNavigate()
  const { profile, isLoading: isAuthLoading, signOut } = useAuth()
  const requiredAgreements = useRequiredAgreements(profile)
  const signAgreement = useSignAgreement(profile)
  const [signatureResetSignal, setSignatureResetSignal] = useState(0)

  const form = useForm<SignAgreementFormValues>({
    resolver: zodResolver(signAgreementSchema),
    defaultValues: {
      typedSignature: '',
      signatureSvg: '',
      acceptedElectronicRecords: false,
      acceptedTerms: false,
    },
  })

  const pendingAgreements = requiredAgreements.data?.pendingAgreements ?? []
  const currentAgreement = pendingAgreements[0] ?? null
  const remainingAgreementCount = Math.max(0, pendingAgreements.length - 1)

  useEffect(() => {
    if (!profile || requiredAgreements.isLoading || !requiredAgreements.data?.isComplete) {
      return
    }

    navigate(getHomePathForRole(profile.role), { replace: true })
  }, [navigate, profile, requiredAgreements.data?.isComplete, requiredAgreements.isLoading])

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="space-y-3 text-center">
          <h1 className="font-serif text-3xl text-primary">Loading</h1>
          <p className="text-on-surface-variant/80">Preparing your account.</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <Navigate replace to="/" />
  }

  if (profile.role === 'platform-admin') {
    return <Navigate replace to="/admin/portal" />
  }

  if (requiredAgreements.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <Card className="max-w-lg border border-outline-variant/10 bg-white shadow-sm">
          <CardContent className="space-y-6 p-8 text-center">
            <ShieldCheck className="mx-auto size-12 text-primary" />
            <div className="space-y-2">
              <h1 className="font-serif text-3xl text-primary">Agreement Check Failed</h1>
              <p className="text-sm text-on-surface-variant/80">
                {requiredAgreements.error instanceof Error
                  ? requiredAgreements.error.message
                  : 'Required agreements could not be loaded.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => void signOut()}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiredAgreements.isLoading || !currentAgreement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="space-y-3 text-center">
          <h1 className="font-serif text-3xl text-primary">Checking agreements</h1>
          <p className="text-on-surface-variant/80">Confirming account access requirements.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 space-y-8">
          <div className="space-y-4 border-b border-outline-variant/10 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent" className="bg-secondary-container/20 text-secondary">
                Required Agreement
              </Badge>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                Agreement 1 of {pendingAgreements.length}
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="break-words font-serif text-5xl leading-tight text-primary md:text-6xl">
                {currentAgreement.title}
              </h1>
              <p className="max-w-3xl text-sm font-medium leading-6 text-on-surface-variant/85">
                Version {currentAgreement.version} effective{' '}
                {new Date(currentAgreement.effectiveAt).toLocaleDateString()}
                {remainingAgreementCount > 0 ? (
                  <>. {remainingAgreementCount} more agreement{remainingAgreementCount === 1 ? '' : 's'} must be signed before access unlocks.</>
                ) : null}
              </p>
            </div>
          </div>

          <Card className="min-w-0 overflow-hidden border border-outline-variant/10 bg-white shadow-sm">
            <CardContent className="p-0">
              <ScrollArea className="h-[68vh]">
                <pre className="max-w-full whitespace-pre-wrap break-words p-8 font-sans text-sm leading-7 text-on-surface [overflow-wrap:anywhere]">
                  {currentAgreement.body}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-10 lg:self-start">
          <Card className="min-w-0 border border-outline-variant/10 bg-white shadow-sm">
            <CardContent className="space-y-8 p-8">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileSignature className="size-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-3xl text-primary">Sign Electronically</h2>
                  <p className="text-sm leading-6 text-on-surface-variant/80">
                    Signed as {profile.fullName} using {profile.email}.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/10 bg-surface-low p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                  Pending agreements
                </p>
                <div className="mt-3 space-y-2">
                  {pendingAgreements.map((agreement, index) => (
                    <div
                      key={agreement.id}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        agreement.id === currentAgreement.id
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-outline-variant/10 bg-[var(--card)] text-on-surface-variant'
                      }`}
                    >
                      <p className="font-semibold">
                        {index + 1}. {agreement.title}
                      </p>
                      <p className="mt-1 text-xs opacity-75">
                        {agreement.businessId ? 'Business contract' : 'Platform agreement'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(async (values) => {
                  await signAgreement.mutateAsync({
                    agreementVersionId: currentAgreement.id,
                    ...values,
                  })
                  form.reset()
                  setSignatureResetSignal((value) => value + 1)
                  const refreshed = await requiredAgreements.refetch()
                  if (refreshed.data?.isComplete) {
                    navigate(getHomePathForRole(profile.role), { replace: true })
                  }
                })}
              >
                <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/10 bg-surface-low p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    {...form.register('acceptedElectronicRecords')}
                  />
                  <span>I agree to use electronic records and electronic signatures for this agreement.</span>
                </label>
                {form.formState.errors.acceptedElectronicRecords ? (
                  <p className="text-xs font-semibold text-red-500">
                    {form.formState.errors.acceptedElectronicRecords.message}
                  </p>
                ) : null}

                <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/10 bg-surface-low p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    {...form.register('acceptedTerms')}
                  />
                  <span>I have read, understood, and agree to the terms shown on this page.</span>
                </label>
                {form.formState.errors.acceptedTerms ? (
                  <p className="text-xs font-semibold text-red-500">
                    {form.formState.errors.acceptedTerms.message}
                  </p>
                ) : null}

                <div className="grid gap-3">
                  <Label htmlFor="typedSignature">Typed Signature</Label>
                  <Input
                    id="typedSignature"
                    placeholder={profile.fullName}
                    autoComplete="name"
                    {...form.register('typedSignature')}
                  />
                  {form.formState.errors.typedSignature ? (
                    <p className="text-xs font-semibold text-red-500">
                      {form.formState.errors.typedSignature.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label>Drawn Signature</Label>
                  <input type="hidden" {...form.register('signatureSvg')} />
                  <SignaturePad
                    key={signatureResetSignal}
                    disabled={signAgreement.isPending || requiredAgreements.isFetching}
                    error={form.formState.errors.signatureSvg?.message}
                    onChange={(signatureSvg) =>
                      form.setValue('signatureSvg', signatureSvg, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-full font-semibold"
                  disabled={signAgreement.isPending || requiredAgreements.isFetching}
                >
                  {signAgreement.isPending ? 'Saving signature...' : 'Sign and Continue'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
