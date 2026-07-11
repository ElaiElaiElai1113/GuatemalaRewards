import { ArrowRight, MapPin, QrCode, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { businessService } from '@/integrations/supabase/services/business-service'
import { useLanguage } from '@/lib/language'
import type { Business } from '@/types/domain'

export function BusinessQrLandingPage() {
  const { slug = '' } = useParams()
  const { t } = useLanguage()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loadedSlug, setLoadedSlug] = useState('')
  const isLoading = loadedSlug !== slug

  useEffect(() => {
    let active = true
    businessService.getBusinessBySlug(slug)
      .then((result) => {
        if (!active) return
        setBusiness(result)
        if (result) window.sessionStorage.setItem('signupSourceBusinessId', result.id)
      })
      .catch(() => {
        if (active) setBusiness(null)
      })
      .finally(() => {
        if (active) setLoadedSlug(slug)
      })
    return () => { active = false }
  }, [slug])

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center"><LoadingState title={t('Loading')} description={t('Preparing your workspace.')} /></main>
  }

  if (!business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-center">
        <div className="max-w-lg space-y-5">
          <BrandLogo className="justify-center" />
          <h1 className="text-3xl font-black">{t('This business QR is not active')}</h1>
          <p className="text-[var(--muted-foreground)]">{t('The link may have changed. You can still explore Guatemala Rewards or create your member account.')}</p>
          <Button asChild><Link to="/landing-page">{t('Visit Guatemala Rewards')}</Link></Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLogo />
          <LanguagePicker />
        </div>
      </header>
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--muted)] px-4 py-2 text-sm font-bold"><QrCode className="size-4" />{t('Business verified QR')}</div>
          <div className="space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">{business.name}</p>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">{t('Turn this visit into Guatemala Rewards')}</h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">{business.description || t('Join from this location and keep your rewards organized in one member account.')}</p>
          </div>
          {business.address ? <p className="flex items-center gap-2 font-semibold"><MapPin className="size-5 text-primary" />{business.address}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/join">{t('Create member account')}<ArrowRight className="ml-2 size-5" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/signin">{t('I already have an account')}</Link></Button>
          </div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]"><ShieldCheck className="size-4" />{t('Your signup will be attributed to this business location.')}</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-7 shadow-soft">
          <h2 className="text-2xl font-black">{t('How it works')}</h2>
          <ol className="mt-6 space-y-5">
            {[t('Create your Guatemala Rewards member account.'), t('Show your member QR when you make an eligible purchase.'), t('Track rewards and activity from your dashboard.')].map((item, index) => (
              <li key={item} className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-black text-primary-foreground">{index + 1}</span><p className="pt-1 font-semibold leading-6">{item}</p></li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  )
}
