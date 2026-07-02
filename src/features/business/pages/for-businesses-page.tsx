import {
  BarChart3,
  Calculator,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Gift,
  Handshake,
  QrCode,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const outcomes = [
  {
    icon: QrCode,
    title: 'QR signup portals',
    body: 'Put a scannable rewards invite at checkout, tables, events, and partner desks.',
  },
  {
    icon: Handshake,
    title: 'Partner attribution',
    body: 'Give hotels, hostels, concierges, and local partners their own links and QR codes.',
  },
  {
    icon: Gift,
    title: 'Reward credits',
    body: 'Issue simple customer perks that staff can validate in-store with short-lived codes.',
  },
  {
    icon: BarChart3,
    title: 'Owner reporting',
    body: 'Track members, revenue, orders, reward fulfillment, and partner referral performance.',
  },
]

const proofPoints = [
  'Review the presentation before committing',
  'Confirm the reward offer and partner terms',
  'Set up products, rewards, promotions, and staff access',
  'Launch with QR codes, referral links, and in-store validation',
]

const onboardingSteps = [
  {
    icon: FileText,
    title: '1. Watch the presentation',
    body: 'A simple video explains how members earn Rewards, how businesses participate, and what launch support looks like.',
  },
  {
    icon: ClipboardCheck,
    title: '2. Fit check',
    body: 'We confirm your category, reward percentage, hard costs, and the best first offer for members.',
  },
  {
    icon: UserPlus,
    title: '3. Sign up and launch',
    body: 'Your business portal, QR signup links, partner links, and staff redemption flow are prepared for rollout.',
  },
]

export function ForBusinessesPage() {
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (window.location.hash !== '#book-demo') return

    window.requestAnimationFrame(() => {
      document.getElementById('book-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const lead = {
      name: String(formData.get('name') ?? '').trim(),
      businessName: String(formData.get('businessName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      createdAt: new Date().toISOString(),
    }

    window.localStorage.setItem('guatemalaRewardsDemoLead', JSON.stringify(lead))
    event.currentTarget.reset()
    setSubmitted(true)
  }

  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="space-y-16 sm:space-y-20">
      <section className="relative z-10 grid min-h-[calc(100vh-9rem)] gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
        <span className="botanical-corner -left-20 top-16 hidden lg:block" />
        <div className="animate-soft-reveal space-y-8">
          <Badge variant="accent" className="w-fit">
            Business onboarding
          </Badge>
          <div className="space-y-6">
            <h1 className="font-serif text-[clamp(3rem,7vw,7.5rem)] font-semibold leading-[0.92] tracking-[0.01em] text-primary-container">
              Join the rewards network members already want to use.
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-on-surface-variant/85">
              This private onboarding page gives businesses the presentation, signup path, and launch
              steps for Guatemala Rewards. The main website targets members; this page is for owners who
              are ready to understand the model and prepare their offer.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full">
              <a href="#book-demo">Start Onboarding</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/cost-calculator">
                <Calculator className="size-5" />
                Cost Calculator
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/shop">View Partner Map</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full">
              <Link to="/business/login">Business Login</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofPoints.slice(0, 4).map((point) => (
              <div key={point} className="ornate-frame rounded-[1.5rem] px-5 py-4 text-sm font-medium text-on-surface-variant">
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="ornate-frame animate-soft-reveal overflow-hidden rounded-[2.25rem] p-8">
          <div className="absolute -right-10 -top-10 size-36 rounded-full bg-primary/12 blur-2xl" />
          <div className="relative mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Launch toolkit</p>
              <h2 className="mt-2 font-serif text-4xl text-primary-container">What we prepare with you</h2>
            </div>
            <ShieldCheck className="size-10 text-primary" />
          </div>
          <div className="relative grid gap-4 sm:grid-cols-2">
            {outcomes.map((item) => (
              <div key={item.title} className="compact-catalog-card p-5 transition-all hover:-translate-y-1 hover:border-primary/35">
                <item.icon className="mb-5 size-7 text-primary" />
                <h3 className="font-serif text-2xl text-primary-container">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant/80">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 space-y-8">
        <div className="max-w-3xl space-y-4">
          <Badge variant="accent" className="w-fit">Onboarding flow</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            A clear path from presentation to live rewards.
          </h2>
          <p className="text-base leading-7 text-on-surface-variant/85">
            Businesses can use this link to understand the program before portal access is created.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {onboardingSteps.map((step) => (
            <div key={step.title} className="ornate-frame rounded-[1.6rem] p-6">
              <div className="luxe-art mb-6 flex size-12 items-center justify-center rounded-[1rem]">
                <step.icon className="size-6" />
              </div>
              <h3 className="font-serif text-3xl leading-none text-primary-container">{step.title}</h3>
              <p className="mt-4 text-sm font-medium leading-6 text-on-surface-variant/80">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <Badge variant="accent" className="w-fit">Owner checklist</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            Everything needed before the business portal goes live.
          </h2>
          <div className="grid gap-3">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-on-surface-variant/85">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-secondary-container" />
                <p className="text-sm font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <form id="book-demo" className="ornate-frame rounded-[2rem] p-8" onSubmit={handleSubmit}>
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary-container)]">Start Onboarding</p>
              <h2 className="mt-2 font-serif text-4xl text-primary">Request the presentation and signup process</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant/75">
                This request is saved on this device for now. No payment or backend lead submission is connected.
              </p>
            </div>
            <CalendarClock className="size-9 text-primary-container" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-3">
              <Label htmlFor="demo-name">Your Name</Label>
              <Input id="demo-name" name="name" required placeholder="Alex Rivera" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-business">Business Name</Label>
              <Input id="demo-business" name="businessName" required placeholder="Harbor Roast" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" name="email" type="email" required placeholder="owner@example.com" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-phone">Phone</Label>
              <Input id="demo-phone" name="phone" placeholder="Optional" />
            </div>
            <div className="grid gap-3 sm:col-span-2">
              <Label htmlFor="demo-notes">What should we know before onboarding?</Label>
              <Textarea
                id="demo-notes"
                name="notes"
                placeholder="Business type, expected reward offer, staff needs, partner referrals..."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {submitted ? (
              <p className="text-sm font-bold text-success">Onboarding request saved. We can connect this to a lead backend later.</p>
            ) : (
              <p className="text-sm text-on-surface-variant/75">Best for member-friendly businesses with clear repeat purchase or referral potential.</p>
            )}
            <Button type="submit" className="rounded-full">Request Onboarding</Button>
          </div>
        </form>
      </section>

      <section className="relative z-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="max-w-3xl space-y-4">
          <Badge variant="accent" className="w-fit">Cost calculator</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            Calculate real reward costs before launch.
          </h2>
          <p className="text-base leading-7 text-on-surface-variant/85">
            Compare marketplace cash commission against reward-funded growth at real food cost before
            choosing the first member offer.
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/cost-calculator">
              <Calculator className="size-5" />
              Open Cost Calculator
            </Link>
          </Button>
        </div>

        <div className="ornate-frame rounded-[2rem] p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--tenant-accent-soft)] text-primary-container">
              <Calculator className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-container">
                Owner planning
              </p>
              <h3 className="mt-2 font-serif text-4xl text-primary-container">
                Share the math before the offer is finalized.
              </h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant/80">
                The calculator gives owners a focused view of reward value, food cost, and channel
                comparison without requiring portal access.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
