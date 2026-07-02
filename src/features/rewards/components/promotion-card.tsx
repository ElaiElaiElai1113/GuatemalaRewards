import { CalendarDays, Sparkles } from 'lucide-react'

import { useLanguage } from '@/lib/language'
import { formatDate } from '@/lib/utils'
import type { Promotion } from '@/types/domain'

interface PromotionCardProps {
  promotion: Promotion
  businessName?: string
}

export function PromotionCard({ promotion, businessName }: PromotionCardProps) {
  const { t } = useLanguage()

  return (
    <div className="compact-catalog-card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {businessName ? (
              <span className="inline-flex items-center rounded-full border border-outline-variant/25 bg-[var(--card)] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                {businessName}
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full border border-[var(--champagne)]/35 bg-[var(--espresso-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--champagne)] shadow-soft">
              {t(promotion.badge)}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-container/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
            <CalendarDays className="size-3" />
            {t('Expires')} {formatDate(promotion.expiresAt)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-3xl leading-tight tracking-tight text-primary">
            {t(promotion.title)}
          </h3>
          <p className="text-sm font-medium leading-relaxed text-on-surface-variant/85">
            "{t(promotion.description)}"
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-muted p-5 transition-colors group-hover:bg-blush/70">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--foreground)]">{t(promotion.cta)}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{t(promotion.audience)}</p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--espresso)] text-[var(--champagne)] shadow-soft">
            <Sparkles className="size-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
