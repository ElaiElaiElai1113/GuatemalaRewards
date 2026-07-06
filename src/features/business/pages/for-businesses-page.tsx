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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const heroRows = [
  {
    icon: QrCode,
    text: (
      <>
        Let customers show their <strong className="font-semibold text-[#28292b]">Guatemala Rewards QR</strong> so your staff can record purchases and award points.
      </>
    ),
  },
  {
    icon: BarChart3,
    text: 'Track reward value, member sales, and Guatemala Rewards commission from the same business portal.',
  },
]

const businessPills = [
  { icon: QrCode, label: 'QR customer sales' },
  { icon: Handshake, label: 'Partner referrals' },
  { icon: Gift, label: 'Reward offers' },
  { icon: ShieldCheck, label: 'Commission tracking' },
]

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

const faqs = [
  {
    icon: QrCode,
    question: 'How does a customer earn rewards at my business?',
    answer: 'The customer shows their Guatemala Rewards QR code. Staff scan it, enter the sale amount, and the app records the points and commission.',
  },
  {
    icon: Calculator,
    question: 'Can I check the cost before joining?',
    answer: 'Yes. Use the cost calculator to compare reward value, food cost, and commission before finalizing your first offer.',
  },
  {
    icon: ShieldCheck,
    question: 'Do staff need technical training?',
    answer: 'No. The launch flow is designed around scanning a QR code, entering the purchase amount, and confirming the transaction.',
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
    <div className="screenshot-landing min-h-screen overflow-x-hidden bg-[#f6f7f8] text-[#242426]">
      <section className="border-b border-[#e1e4e8] px-4 pb-[38px] pt-[52px] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[790px] flex-col items-center text-center">
          <p className="landing-soft-gold-border inline-flex min-h-[32px] items-center rounded-full border border-[#dcc070] bg-[#fffaf0] px-[18px] text-[12px] font-semibold uppercase leading-none tracking-[0.22em] text-[#a47713]">
            Business onboarding
          </p>

          <h1 className="mt-[24px] max-w-[760px] font-serif text-[38px] font-bold leading-[1.11] tracking-normal text-[#202023] sm:text-[44px]">
            Join the <span className="text-[#cfaa44]">rewards network</span> members already want to use
          </h1>

          <div className="mt-[22px] max-w-[630px] space-y-[18px] text-[17px] font-medium leading-[1.55] text-[#687282]">
            <p>
              Guatemala Rewards gives businesses a simple QR sale flow, customer rewards, partner attribution, and launch steps in one clear portal.
            </p>
            <p>
              Owners can review the model, prepare the first offer, and understand the commission math before the business goes live.
            </p>
          </div>

          <div className="mt-[30px] grid w-full max-w-[700px] gap-[14px]">
            {heroRows.map((item) => {
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
            {businessPills.map((item) => {
              const Icon = item.icon

              return (
                <span key={item.label} className="inline-flex min-h-[38px] items-center gap-[10px] rounded-full border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[13px] font-medium text-[#545b66]">
                  <Icon className="size-[15px] text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </span>
              )
            })}
          </div>

          <div className="mt-[26px] flex w-full max-w-[590px] flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#book-demo"
              className="inline-flex min-h-[54px] min-w-[240px] items-center justify-center rounded-[8px] bg-[#d1ad4a] px-8 text-[15px] font-bold text-[#121212] transition hover:bg-[#c29f3d]"
            >
              Start Onboarding
            </a>
            <Link
              to="/business/login"
              className="inline-flex min-h-[54px] min-w-[190px] items-center justify-center rounded-[8px] border border-[#dfe3e8] bg-[#ffffff] px-8 text-[15px] font-bold text-[#4f5866] shadow-[0_2px_4px_rgba(16,24,40,0.04)] transition hover:border-[#d1ad4a]"
            >
              Business Login
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-[#e1e4e8] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1020px] text-center">
          <h2 className="font-serif text-[30px] font-bold leading-none text-[#202023]">How business onboarding works</h2>
          <p className="mt-[14px] text-[15px] font-medium text-[#687282]">Three simple steps from presentation to live QR sales</p>

          <div className="mt-[24px] grid gap-[16px] md:grid-cols-3">
            {onboardingSteps.map((step, index) => (
              <article key={step.title} className="flex min-h-[162px] flex-col items-center rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[28px] py-[18px]">
                <div className="landing-soft-gold-border flex size-[36px] items-center justify-center rounded-full border border-[#dfc477] bg-[#fffaf0] text-[16px] font-semibold text-[#a47713]">
                  {index + 1}
                </div>
                <h3 className="mt-[15px] text-[15px] font-bold text-[#202023]">{step.title.replace(/^\d+\.\s*/, '')}</h3>
                <p className="mt-[11px] text-[13px] font-medium leading-[1.55] text-[#687282]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="business-tools" className="border-b border-[#e1e4e8] bg-[#ffffff] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] text-center">
          <h2 className="font-serif text-[30px] font-bold leading-none text-[#202023]">What we prepare with you</h2>
          <p className="mt-[14px] text-[15px] font-medium text-[#687282]">The practical pieces a business needs before launch</p>

          <div className="mt-[24px] grid gap-[16px] md:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((item) => (
              <article key={item.title} className="min-h-[174px] rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[24px] py-[20px] text-left shadow-[0_2px_4px_rgba(16,24,40,0.04)]">
                <item.icon className="size-[20px] text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                <h3 className="mt-[16px] text-[15px] font-bold text-[#202023]">{item.title}</h3>
                <p className="mt-[10px] text-[13px] font-medium leading-[1.55] text-[#687282]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#e1e4e8] px-4 py-[34px] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1060px] gap-[22px] lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="text-center lg:text-left">
            <p className="landing-soft-gold-border inline-flex min-h-[28px] items-center rounded-full border border-[#dcc070] bg-[#fffaf0] px-[16px] text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-[#a47713]">
              Owner checklist
            </p>
            <h2 className="mt-[18px] font-serif text-[30px] font-bold leading-[1.12] text-[#202023]">
              Everything needed before the business portal goes live
            </h2>
            <div className="mt-[20px] grid gap-[10px]">
              {proofPoints.map((point) => (
                <div key={point} className="flex min-h-[44px] items-center gap-3 rounded-[8px] border border-[#dfe3e8] bg-[#ffffff] px-4 text-left text-[13px] font-medium text-[#687282]">
                  <ShieldCheck className="size-[15px] shrink-0 text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
                  {point}
                </div>
              ))}
            </div>
            <Button asChild className="mt-[22px] min-h-[48px] rounded-[8px] bg-[#d1ad4a] px-6 text-[#121212] hover:bg-[#c29f3d]">
              <Link to="/cost-calculator">
                <Calculator className="size-4" />
                Open Cost Calculator
              </Link>
            </Button>
          </div>

          <form id="book-demo" className="rounded-[10px] border border-[#dfe3e8] bg-[#ffffff] px-[22px] py-[24px] shadow-[0_2px_4px_rgba(16,24,40,0.04)] sm:px-[30px]" onSubmit={handleSubmit}>
            <div className="mb-[22px] flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#a47713]">Start onboarding</p>
                <h2 className="mt-[10px] font-serif text-[28px] font-bold leading-[1.12] text-[#202023]">
                  Request the presentation and signup process
                </h2>
                <p className="mt-[12px] text-[13px] font-medium leading-[1.55] text-[#687282]">
                  This request is saved on this device for now. No payment or backend lead submission is connected.
                </p>
              </div>
              <CalendarClock className="size-[28px] shrink-0 text-[#caa747]" strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div className="grid gap-[14px] sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="demo-name" className="text-[12px] font-semibold text-[#687282]">Your Name</Label>
                <Input id="demo-name" name="name" required placeholder="Alex Rivera" className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-business" className="text-[12px] font-semibold text-[#687282]">Business Name</Label>
                <Input id="demo-business" name="businessName" required placeholder="Harbor Roast" className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-email" className="text-[12px] font-semibold text-[#687282]">Email</Label>
                <Input id="demo-email" name="email" type="email" required placeholder="owner@example.com" className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-phone" className="text-[12px] font-semibold text-[#687282]">Phone</Label>
                <Input id="demo-phone" name="phone" placeholder="Optional" className="rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="demo-notes" className="text-[12px] font-semibold text-[#687282]">What should we know before onboarding?</Label>
                <Textarea
                  id="demo-notes"
                  name="notes"
                  placeholder="Business type, expected reward offer, staff needs, partner referrals..."
                  className="min-h-[104px] rounded-[8px] border-[#dfe3e8] bg-[#f8f9fb]"
                />
              </div>
            </div>

            <div className="mt-[22px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {submitted ? (
                <p className="text-sm font-bold text-success">Onboarding request saved. We can connect this to a lead backend later.</p>
              ) : (
                <p className="text-[13px] font-medium text-[#687282]">Best for member-friendly businesses with clear repeat purchase or referral potential.</p>
              )}
              <Button type="submit" className="min-h-[44px] rounded-[8px] bg-[#d1ad4a] px-6 text-[#121212] hover:bg-[#c29f3d]">
                Request Onboarding
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section id="faq" className="border-b border-[#e1e4e8] bg-[#ffffff] px-4 pb-[34px] pt-[38px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[700px]">
          <h2 className="text-center font-serif text-[30px] font-bold leading-none text-[#202023]">
            Frequently asked questions
          </h2>

          <div className="mt-[24px] space-y-[11px]">
            {faqs.map((item) => {
              const Icon = item.icon

              return (
                <details key={item.question} className="group rounded-[7px] border border-[#dfe3e8] bg-[#ffffff] px-[20px] text-[#2f3339]">
                  <summary className="flex min-h-[58px] cursor-pointer list-none items-center gap-[13px] text-[14px] font-bold [&::-webkit-details-marker]:hidden">
                    <Icon className="size-[15px] shrink-0 text-[#caa747]" strokeWidth={1.7} aria-hidden="true" />
                    <span className="flex-1">{item.question}</span>
                    <span className="text-[#9aa2af] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-[18px] pl-[28px] text-[13px] font-medium leading-[1.65] text-[#687282]">
                    {item.answer}
                  </p>
                </details>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
