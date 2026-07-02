import { Link } from 'react-router-dom'

import { CostCalculator } from '@/features/business/components/cost-calculator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function CostCalculatorPage() {
  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <section className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge variant="accent" className="w-fit">Cost calculator</Badge>
            <h1 className="font-serif text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[0.01em] text-primary-container">
              Show the real food cost behind reward-funded growth.
            </h1>
            <p className="text-base leading-7 text-on-surface-variant/85">
              Rewards are product and service value, not cash payouts. Use this live calculator to show
              the actual food cost impact and keep cash-heavy channels like Food Panda or paid ads in context.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/business">Back to Business</Link>
            </Button>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/business#book-demo">Start Onboarding</Link>
            </Button>
          </div>
        </section>

        <section className="relative z-10">
          <CostCalculator />
        </section>
      </div>
    </div>
  )
}
