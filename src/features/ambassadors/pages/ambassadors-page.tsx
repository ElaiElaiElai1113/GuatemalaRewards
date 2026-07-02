import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Camera, Crown, Gift, HeartHandshake, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import heroImage from '@/assets/hero.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ambassadorService } from '@/integrations/supabase/services/ambassador-service'
import { useBusinesses } from '@/hooks/use-customer-data'
import { ambassadorLeadSchema, type AmbassadorLeadFormValues } from '@/types/forms'
import {
  ambassadorCreatorSignals,
  ambassadorFormIntro,
  ambassadorPerks,
  ambassadorPrimaryCta,
  ambassadorSuccessMessage,
  ambassadorSuccessTitle,
  ambassadorVipHeadline,
  ambassadorVipSupportingCopy,
} from '../ambassador-content'

const defaultValues: AmbassadorLeadFormValues = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  instagram: '',
  tiktok: '',
  otherSocial: '',
  notes: '',
  marketingConsent: false,
}

const perkIcons = [Gift, Camera, HeartHandshake] as const

const compactLabelClass = 'ml-0 text-[0.58rem] font-extrabold uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:text-[0.62rem]'
const compactInputClass = 'h-9 rounded-xl border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] shadow-none placeholder:text-[var(--muted-foreground)] sm:h-10'
const compactTextareaClass = 'min-h-14 rounded-xl border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] shadow-none placeholder:text-[var(--muted-foreground)] sm:min-h-16'
const compactErrorClass = 'text-[0.62rem] font-bold leading-3 text-error'

export function AmbassadorsPage() {
  const [searchParams] = useSearchParams()
  const businesses = useBusinesses()
  const businessId = searchParams.get('business')
  const linkedBusiness = businesses.data?.find((business) => business.id === businessId) ?? null
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<AmbassadorLeadFormValues>({
    resolver: zodResolver(ambassadorLeadSchema),
    defaultValues,
  })

  return (
    <main className="soft-luxe-shell relative isolate h-[100svh] overflow-hidden px-3 py-3 text-[var(--foreground)] sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="mx-auto grid h-full max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(390px,480px)] xl:grid-cols-[minmax(0,1fr)_500px] xl:items-stretch">
        <section className="warm-hero-muted relative hidden overflow-hidden rounded-[1.6rem] px-8 py-7 text-[var(--cream)] shadow-card lg:block xl:px-10">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 -z-10 size-full object-cover opacity-20"
          />
          <div className="absolute inset-0 -z-10 bg-[var(--espresso)]/70" />

          <div className="flex h-full min-h-0 flex-col justify-between gap-6">
            <div className="flex items-center justify-between gap-4">
              <Badge className="border-[var(--champagne)]/35 bg-[var(--cream)]/12 text-[var(--champagne)]">
                VIP creator invites
              </Badge>
              <Link to="/shop" className="text-sm font-bold text-[var(--champagne)] transition hover:text-[var(--cream)]">
                Partner map
              </Link>
            </div>

            <div className="max-w-4xl space-y-5">
              {linkedBusiness ? (
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--champagne)]/35 bg-[var(--cream)]/12 px-4 py-2">
                  {linkedBusiness.logoUrl ? (
                    <img src={linkedBusiness.logoUrl} alt={linkedBusiness.name} className="size-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-[var(--champagne)] text-xs font-black uppercase text-[var(--espresso)]">
                      {linkedBusiness.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--cream)]">{linkedBusiness.name}</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <h1 className="font-serif text-[clamp(3.4rem,6vw,6rem)] font-semibold leading-[0.92] tracking-[0.01em]">
                  {ambassadorVipHeadline}
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-[var(--cream)]/78 xl:text-base">
                  {ambassadorVipSupportingCopy}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ambassadorCreatorSignals.map((signal) => (
                    <span key={signal} className="rounded-full border border-[var(--champagne)]/30 bg-[var(--cream)]/12 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--champagne)]">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {ambassadorPerks.map((perk, index) => {
                const Icon = perkIcons[index]

                return (
                  <div key={perk.title} className="rounded-[1rem] border border-[var(--champagne)]/20 bg-[var(--cream)]/12 p-3 shadow-soft">
                    <Icon className="size-4 text-[var(--champagne)]" />
                    <h2 className="mt-3 font-serif text-base leading-tight text-[var(--cream)]">{perk.title}</h2>
                    <p className="mt-1.5 text-[0.68rem] font-medium leading-4 text-[var(--cream)]/70">{perk.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="ambassador-form" className="flex min-h-0 items-stretch">
          <div className="luxe-card h-full min-h-0 w-full overflow-hidden rounded-[1.4rem] p-3 text-[var(--foreground)] shadow-soft sm:p-4 lg:rounded-[1.6rem] lg:p-5 xl:p-6">
            {isSubmitted ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-[1.2rem] bg-primary text-primary-foreground">
                  <BadgeCheck className="size-7" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-serif text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">
                    {ambassadorSuccessTitle}
                  </h2>
                  <p className="mx-auto max-w-md text-sm font-medium leading-6 text-[var(--muted-foreground)]">
                    {ambassadorSuccessMessage}
                  </p>
                </div>
                <Button asChild variant="secondary" size="lg" className="rounded-full border border-primary/30 bg-[var(--card)] text-primary hover:bg-[var(--muted)]">
                  <Link to="/shop">Explore businesses</Link>
                </Button>
              </div>
            ) : (
              <form
                className="flex h-full min-h-0 flex-col gap-2.5"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setSubmitError(null)
                    await ambassadorService.createLead(values, businessId)
                    form.reset(defaultValues)
                    setIsSubmitted(true)
                  } catch (error) {
                    setSubmitError(error instanceof Error ? error.message : 'Unable to submit ambassador request.')
                  }
                })}
              >
                <div className="space-y-1 text-center">
                  <div className="mx-auto hidden size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:flex">
                    <Crown className="size-5" />
                  </div>
                  <h2 className="font-serif text-2xl leading-none text-[var(--foreground)] sm:text-3xl">Join the VIP Creator Circle</h2>
                  <p className="text-xs font-medium leading-5 text-[var(--muted-foreground)]">
                    {ambassadorFormIntro}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-name" className={compactLabelClass}>Full name</Label>
                    <Input id="ambassador-name" className={compactInputClass} placeholder="Alex Rivera" {...form.register('fullName')} />
                    {form.formState.errors.fullName ? <p className={compactErrorClass}>{form.formState.errors.fullName.message}</p> : null}
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-email" className={compactLabelClass}>Email</Label>
                    <Input id="ambassador-email" className={compactInputClass} type="email" placeholder="alex@example.com" {...form.register('email')} />
                    {form.formState.errors.email ? <p className={compactErrorClass}>{form.formState.errors.email.message}</p> : null}
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-phone" className={compactLabelClass}>Phone</Label>
                    <Input id="ambassador-phone" className={compactInputClass} placeholder="Optional" {...form.register('phone')} />
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-city" className={compactLabelClass}>Location</Label>
                    <Input id="ambassador-city" className={compactInputClass} placeholder="Guatemala" {...form.register('city')} />
                    {form.formState.errors.city ? <p className={compactErrorClass}>{form.formState.errors.city.message}</p> : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-instagram" className={compactLabelClass}>Instagram</Label>
                    <Input id="ambassador-instagram" className={compactInputClass} placeholder="@yourhandle or profile link" {...form.register('instagram')} />
                    {form.formState.errors.instagram ? <p className={compactErrorClass}>{form.formState.errors.instagram.message}</p> : null}
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-tiktok" className={compactLabelClass}>TikTok</Label>
                    <Input id="ambassador-tiktok" className={compactInputClass} placeholder="@yourhandle or profile link" {...form.register('tiktok')} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-other" className={compactLabelClass}>Other social link</Label>
                    <Input id="ambassador-other" className={compactInputClass} placeholder="YouTube, blog, community, or another profile" {...form.register('otherSocial')} />
                  </div>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="ambassador-notes" className={compactLabelClass}>Where do you usually recommend places?</Label>
                  <Textarea
                    id="ambassador-notes"
                    className={compactTextareaClass}
                    placeholder="Group chats, hotel guests, Instagram stories, neighborhood guides..."
                    {...form.register('notes')}
                  />
                  {form.formState.errors.notes ? <p className={compactErrorClass}>{form.formState.errors.notes.message}</p> : null}
                </div>

                <label className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5 text-xs font-medium leading-5 text-[var(--muted-foreground)] sm:p-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-[var(--border)] accent-[var(--primary)]"
                    {...form.register('marketingConsent')}
                  />
                  <span>
                    I am 18 or older and agree to be contacted with rewards, discounts, and ambassador next steps.
                  </span>
                </label>
                {form.formState.errors.marketingConsent ? (
                  <p className={compactErrorClass}>{form.formState.errors.marketingConsent.message}</p>
                ) : null}

                {submitError ? (
                  <div className="rounded-xl border border-error/20 bg-error/10 p-2.5 text-xs font-bold text-error">
                    {submitError}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="mt-auto h-11 w-full rounded-full bg-primary text-sm text-primary-foreground hover:bg-primary-container sm:h-12"
                  isLoading={form.formState.isSubmitting}
                >
                  <Mail className="size-4" />
                  {ambassadorPrimaryCta}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
