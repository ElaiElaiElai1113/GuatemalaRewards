import { Link } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

type LegalPageKind = 'terms' | 'privacy' | 'reward-terms' | 'verification-policy'

const legalPages: Record<LegalPageKind, { title: string; intro: string; sections: Array<{ title: string; body: string }> }> = {
  terms: {
    title: 'Terms of Use',
    intro: 'Plain-language placeholder terms for Guatemala Rewards members. These should be reviewed by a qualified legal professional before launch.',
    sections: [
      {
        title: 'Member accounts',
        body: 'Members are responsible for keeping account details accurate and secure. One member account should represent one real person.',
      },
      {
        title: 'Rewards are offer-based',
        body: 'Rewards are not cash payouts. Available rewards, point costs, eligibility, and redemption steps may change as the program evolves.',
      },
      {
        title: 'Membership subscription',
        body: 'Joining Guatemala Rewards requires an active paid membership subscription. Reward actions may require sign-in, active subscription status, and completed ID verification before earning or redeeming value.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'Plain-language placeholder privacy notes for Guatemala Rewards. Replace with reviewed legal copy before launch.',
    sections: [
      {
        title: 'Information we collect',
        body: 'The app may collect account details, contact details, activity, reward history, and ID verification submissions needed to operate the program.',
      },
      {
        title: 'How information is used',
        body: 'Information is used to manage accounts, review verification, protect reward value, support redemptions, and improve the member experience.',
      },
      {
        title: 'Support contact',
        body: 'For privacy questions, members can contact support@guatemalarewards.com.',
      },
    ],
  },
  'reward-terms': {
    title: 'Reward Terms',
    intro: 'Plain-language placeholder reward terms explaining how Guatemala Rewards value works for members.',
    sections: [
      {
        title: 'No cash payout promise',
        body: 'Rewards represent offers, perks, credits, or experiences available through Guatemala Rewards. They are not a promise of cash payment.',
      },
      {
        title: 'Reward availability',
        body: 'Rewards may have inventory, expiration, eligibility, location, point cost, or verification requirements before they can be claimed.',
      },
      {
        title: 'Redemption review',
        body: 'Some reward actions may be validated by staff or administrators to keep the program fair and prevent duplicate or invalid claims.',
      },
    ],
  },
  'verification-policy': {
    title: 'Verification Policy',
    intro: 'Plain-language placeholder notes about why member verification is required before reward actions unlock.',
    sections: [
      {
        title: 'Why verification is required',
        body: 'Verification helps support one member account per person and protects reward value for legitimate members.',
      },
      {
        title: 'How review works',
        body: 'Admins review submitted ID details. Reward actions may stay locked while a submission is pending or if more information is needed.',
      },
      {
        title: 'How ID information is used',
        body: 'ID information should be used only for member verification and account protection. Members can contact support@guatemalarewards.com with questions.',
      },
    ],
  },
}

interface LegalPageProps {
  kind: LegalPageKind
}

export function LegalPage({ kind }: LegalPageProps) {
  const { t } = useLanguage()
  const page = legalPages[kind]

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 py-8 text-[#21140d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link to="/" aria-label="Guatemala Rewards home">
            <BrandLogo imageClassName="w-[80px]" />
          </Link>
          <Button asChild variant="outline" className="w-full rounded-full border-[#9c6a22]/35 bg-[#fffdf8] sm:w-auto">
            <Link to="/join">{t('Join Rewards Club')}</Link>
          </Button>
        </div>

        <section className="rounded-[1.5rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-6 shadow-soft sm:p-8">
          <Badge className="border-[#d9b365]/45 bg-[#5e3327] text-[#fff7ea]">{t('Customer trust')}</Badge>
          <h1 className="mt-5 font-serif text-5xl font-semibold leading-none text-[#21140d]">{t(page.title)}</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-[#6f4f3d]">{t(page.intro)}</p>
        </section>

        <section className="grid gap-4">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-[1.25rem] border border-[#d8b98c]/50 bg-[#fffdf8] p-6 shadow-soft">
              <h2 className="font-serif text-3xl leading-none text-[#21140d]">{t(section.title)}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4f3d]">{t(section.body)}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
