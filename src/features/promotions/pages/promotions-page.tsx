import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { usePromotions } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'

export function PromotionsPage() {
  const promotions = usePromotions()
  const { t } = useLanguage()

  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="space-y-12">
      <div className="relative z-10 flex flex-col gap-6 border-b border-outline-variant/10 pb-8">
        <span className="botanical-corner -right-20 top-0 hidden lg:block" />
        <Badge variant="accent" className="w-fit bg-secondary-container/15 text-foreground">
          {t('Active Campaigns')}
        </Badge>
        <div className="max-w-3xl space-y-4">
          <h1 className="font-serif text-[clamp(2.75rem,6vw,6rem)] leading-[1.02] tracking-tight text-primary">
            {t('Promotions that turn visits into repeat business.')}
          </h1>
          <p className="text-xl font-medium leading-relaxed text-on-surface-variant/85">
            {t('Browse current offers and earn bonus points on eligible purchases.')}
          </p>
        </div>
      </div>

      <div className="ornate-frame relative z-10 rounded-[3rem] p-8 md:p-12">
        <div className="mb-12 max-w-2xl space-y-4">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
            {t('Active Campaigns')}
          </span>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-primary">
            {t('Earn more points with participating businesses.')}
          </h2>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            {t('Browse current promotions and take advantage of bonus points and special deals.')}
          </p>
        </div>

        {promotions.isLoading ? (
          <div className="space-y-6">
            <LoadingState
              className="py-2"
              title={t('Loading')}
              description={t('Checking active promotions.')}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-52 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (promotions.data ?? []).length === 0 ? (
          <EmptyState
            title={t('No promotions yet')}
            description={t('Active promotions from participating businesses will appear here.')}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {(promotions.data ?? []).map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
