import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, IdCard, MapPin, Phone, QrCode, Save, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

import { MetricCard } from '@/components/metric-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MembershipBadge } from '@/features/membership/components/membership-badge'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, useSubmitMemberVerification, useUpdateProfile } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import {
  memberVerificationSchema,
  profileSchema,
  type MemberVerificationFormValues,
  type ProfileFormValues,
} from '@/types/forms'

export function ProfilePage() {
  const { profile: sessionProfile, syncProfile } = useAuth()
  const { t } = useLanguage()
  const profile = useProfile(sessionProfile?.id)
  const updateProfile = useUpdateProfile(sessionProfile?.id)
  const submitVerification = useSubmitMemberVerification(sessionProfile?.id)
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      location: '',
      favoriteOrder: '',
    },
  })

  const verificationForm = useForm<MemberVerificationFormValues>({
    resolver: zodResolver(memberVerificationSchema),
    defaultValues: {
      verificationIdNumber: '',
    },
  })

  useEffect(() => {
    if (!profile.data) {
      return
    }

    form.reset({
      fullName: profile.data.fullName,
      phone: profile.data.phone,
      location: profile.data.location,
      favoriteOrder: profile.data.favoriteOrder,
    })
  }, [form, profile.data])

  const verificationStatus = profile.data?.verificationStatus ?? 'not_submitted'
  const isMemberVerified = verificationStatus === 'verified'
  const canSubmitVerification = ['not_submitted', 'pending_document', 'rejected', 'submitted'].includes(verificationStatus)
  const memberQrUrl =
    isMemberVerified && profile.data?.memberQrToken && typeof window !== 'undefined'
      ? `${window.location.origin}/business/member-sale/${profile.data.memberQrToken}`
      : ''
  const memberQrStatusMessage =
    verificationStatus === 'submitted'
      ? 'Your ID is under review. Your member QR activates after approval.'
      : verificationStatus === 'rejected'
        ? 'Resubmit ID verification to activate your member QR.'
        : isMemberVerified
          ? 'Businesses scan this code to record outside-app purchases and award rewards automatically.'
          : 'Verify your ID to activate your member QR.'

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between border-b border-outline-variant/10 pb-12">
        <div className="space-y-4 max-w-2xl">
          <Badge variant="accent" className="bg-tertiary/20 text-primary">
            {t('Account Settings')}
          </Badge>
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
            {t('Your Profile')}
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
            {t('Keep your details and preferences up to date.')}
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Member status')}</span>
          <MembershipBadge />
        </div>
      </div>

      <div className="rounded-3xl border border-outline-variant/10 bg-surface-low p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="size-5" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-primary">Member QR</h2>
              <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant/80">
                {t(memberQrStatusMessage)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <div className="mx-auto flex size-56 items-center justify-center rounded-xl bg-surface-lowest p-4">
              {isMemberVerified && memberQrUrl ? (
                <QRCodeSVG value={memberQrUrl} size={184} />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant/40 bg-[var(--muted)] text-center">
                  <QrCode className="size-16 text-on-surface-variant/30" />
                  <span className="px-4 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">
                    {t('QR locked')}
                  </span>
                </div>
              )}
            </div>
            {!isMemberVerified ? (
              <Button asChild type="button" variant="outline" className="mt-5 w-full rounded-2xl">
                <a href="#id-verification">{t('Verify ID to activate QR')}</a>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full rounded-2xl"
              disabled={!isMemberVerified || !memberQrUrl}
              onClick={async () => {
                if (!isMemberVerified || !memberQrUrl) return
                await navigator.clipboard.writeText(memberQrUrl)
                toast.success('Member QR link copied')
              }}
            >
              <Copy className="size-4" />
              Copy QR Link
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-16 lg:grid-cols-[400px_1fr]">
        <div className="space-y-8">
           <div className="space-y-2 pb-4 border-b border-outline-variant/5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Quick Info')}</span>
            <h2 className="font-serif text-3xl text-primary">{t('Contact Details')}</h2>
          </div>
          <div className="grid gap-6">
            <MetricCard
              label={t('Phone')}
              value={profile.data?.phone ?? 'N/A'}
              icon={Phone}
              helper={t('For order coordination')}
            />
            <MetricCard
              label={t('Location')}
              value={profile.data?.location ?? 'N/A'}
              icon={MapPin}
              helper={t('Default business location')}
            />
          </div>

          <div id="id-verification" className="rounded-3xl border border-outline-variant/10 bg-surface-low p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IdCard className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl text-primary">ID Verification</h2>
                <Badge
                  variant="accent"
                  className={
                    verificationStatus === 'verified'
                      ? 'border-success/20 bg-success/10 text-success'
                      : verificationStatus === 'rejected'
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-warning/20 bg-warning/10 text-warning'
                  }
                >
                  {verificationStatus === 'verified'
                    ? 'Verified'
                    : verificationStatus === 'rejected'
                      ? 'Rejected'
                      : verificationStatus === 'submitted'
                        ? 'Submitted'
                        : 'Required'}
                </Badge>
                {profile.data?.verificationRejectionReason ? (
                  <p className="text-sm font-medium leading-6 text-red-600">
                    {profile.data.verificationRejectionReason}
                  </p>
                ) : (
                  <p className="text-sm font-medium leading-6 text-on-surface-variant/80">
                    Verified ID is required before earning points, redeeming rewards, or using reward credits.
                  </p>
                )}
              </div>
            </div>

            {canSubmitVerification && verificationStatus !== 'verified' ? (
              <form
                className="mt-6 grid gap-4"
                onSubmit={verificationForm.handleSubmit(async (values) => {
                  try {
                    setVerificationError(null)
                    if (!verificationDocument) {
                      setVerificationError('Upload a photo or PDF of your ID for account verification.')
                      return
                    }

                    if (form.formState.isDirty) {
                      const isProfileValid = await form.trigger()
                      if (!isProfileValid) {
                        setVerificationError('Save valid contact details before submitting ID verification.')
                        return
                      }

                      const savedProfile = await updateProfile.mutateAsync(form.getValues())
                      syncProfile(savedProfile)
                      form.reset({
                        fullName: savedProfile.fullName,
                        phone: savedProfile.phone,
                        location: savedProfile.location,
                        favoriteOrder: savedProfile.favoriteOrder,
                      })
                    }

                    const updatedProfile = await submitVerification.mutateAsync({
                      ...values,
                      verificationDocument,
                    })
                    syncProfile(updatedProfile)
                    verificationForm.reset({ verificationIdNumber: '' })
                    setVerificationDocument(null)
                  } catch (error) {
                    setVerificationError(error instanceof Error ? error.message : 'Unable to submit verification.')
                  }
                })}
              >
                <div className="grid gap-3">
                  <Label htmlFor="verification-id">Verification ID number</Label>
                  <Input
                    id="verification-id"
                    placeholder="ID number"
                    {...verificationForm.register('verificationIdNumber')}
                  />
                  {verificationForm.formState.errors.verificationIdNumber ? (
                    <p className="text-xs font-bold text-red-500">
                      {verificationForm.formState.errors.verificationIdNumber.message}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="verification-document">Photo or PDF of ID</Label>
                  <Input
                    id="verification-document"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => setVerificationDocument(event.target.files?.[0] ?? null)}
                  />
                </div>
                {verificationError ? <p className="text-sm font-bold text-red-500">{verificationError}</p> : null}
                <Button type="submit" disabled={submitVerification.isPending || updateProfile.isPending}>
                  <Upload className="size-4" />
                  {submitVerification.isPending || updateProfile.isPending ? 'Submitting...' : 'Submit ID'}
                </Button>
              </form>
            ) : null}
          </div>

        </div>

        <div className="space-y-8">
          <div className="space-y-2 pb-4 border-b border-outline-variant/5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Preferences')}</span>
            <h2 className="font-serif text-3xl text-primary">{t('Edit Profile')}</h2>
          </div>
          <div className="rounded-3xl bg-surface-low p-10 border border-outline-variant/10">
            <form
              className="grid gap-8"
              onSubmit={form.handleSubmit(async (values) => {
                const updatedProfile = await updateProfile.mutateAsync(values)
                syncProfile(updatedProfile)
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="fullName">{t('Full Name')}</Label>
                <Input id="fullName" placeholder={t('Your name')} {...form.register('fullName')} />
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="grid gap-3">
                  <Label htmlFor="phone">{t('Phone Number')}</Label>
                  <Input id="phone" placeholder="+1 (555) 000-0000" {...form.register('phone')} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="location">{t('Home Business')}</Label>
                  <Input id="location" placeholder="e.g., Downtown" {...form.register('location')} />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="favoriteOrder">{t('Favorite Order')}</Label>
                <Input id="favoriteOrder" placeholder={t('Your favorite drink...')} {...form.register('favoriteOrder')} />
                <p className="mt-1 text-[0.65rem] italic font-medium text-on-surface-variant/75">{t('This helps staff prepare your order.')}</p>
              </div>

              <div className="mt-4 pt-8 border-t border-outline-variant/5 flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full px-12 h-14"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? t('Saving...') : t('Save Changes')}
                  <Save className="size-5 ml-2" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
