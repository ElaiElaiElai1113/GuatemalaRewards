import { CheckCircle, Gift, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { cn, formatPoints } from '@/lib/utils'
import type { GiftCardCatalogItem } from '@/types/domain'

interface GiftCardTileProps {
  item: GiftCardCatalogItem
  balancePoints?: number
  businessName?: string
  actionLocked?: boolean
  compact?: boolean
  onSelect: (item: GiftCardCatalogItem) => void
}

export function GiftCardTile({
  item,
  balancePoints = 0,
  businessName,
  actionLocked = false,
  compact = false,
  onSelect,
}: GiftCardTileProps) {
  const { t } = useLanguage()
  const hasEnoughPoints = balancePoints >= item.pointsCost
  const canIssue = hasEnoughPoints && !actionLocked

  return (
    <div
      className={cn(
        'luxe-card group flex h-full w-full flex-col text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/35',
        compact ? 'gap-3 rounded-[1.25rem] p-3' : 'gap-5 rounded-[1.75rem] p-4',
      )}
    >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{item.valueLabel}</Badge>
            {businessName ? <Badge variant="outline">{businessName}</Badge> : null}
          </div>
          <div
            className={cn(
              'flex shrink-0 items-center justify-center bg-[var(--muted)] text-[var(--foreground)] shadow-soft',
              compact ? 'size-9 rounded-xl' : 'size-11 rounded-[1rem]',
            )}
          >
            {canIssue
              ? <Gift className={compact ? 'size-4' : 'size-5'} />
              : <Lock className={compact ? 'size-4' : 'size-5'} />}
          </div>
        </div>

        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className={cn(
              'w-full object-cover shadow-soft',
              compact ? 'h-36 rounded-[1rem] sm:h-40' : 'aspect-[16/9] rounded-[1.35rem]',
            )}
          />
        ) : (
          <div
            className={cn(
              'luxe-art relative overflow-hidden shadow-soft',
              compact ? 'h-36 rounded-[1rem] p-4 sm:h-40' : 'aspect-[16/9] rounded-[1.35rem] p-5',
            )}
          >
            <div className={cn(
              'absolute rotate-[-8deg] rounded-xl border border-[var(--champagne)]/35 bg-[var(--cream)]/12',
              compact ? 'left-4 top-4 h-10 w-16' : 'left-5 top-5 h-16 w-24',
            )} />
            <div className={cn(
              'absolute rotate-6 border border-[var(--champagne)]/35 bg-[var(--cream)]/12',
              compact ? 'bottom-4 right-5 h-12 w-20 rounded-xl' : 'bottom-5 right-6 h-20 w-32 rounded-2xl',
            )} />
            <div
              className={cn(
                'animate-float-soft absolute flex items-center justify-center rounded-full bg-[var(--champagne)] text-[var(--espresso)] shadow-soft',
                compact ? 'right-5 top-5 size-10' : 'right-8 top-8 size-14',
              )}
            >
              <Gift className={compact ? 'size-5' : 'size-7'} />
            </div>
            <p
              className={cn(
                'absolute font-serif text-[var(--cream)]',
                compact ? 'bottom-4 left-4 text-xl' : 'bottom-5 left-5 text-3xl',
              )}
            >
              {item.valueLabel}
            </p>
          </div>
        )}

        <div className={cn('grow', compact ? 'space-y-1.5' : 'space-y-3')}>
          <h3 className={cn('font-semibold leading-tight text-[var(--foreground)]', compact ? 'text-base' : 'text-xl')}>
            {item.title}
          </h3>
          <p className={cn('text-sm text-[var(--muted-foreground)]', compact ? 'line-clamp-1 leading-5' : 'leading-6')}>
            {item.description}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Points Cost')}</span>
            <p className={cn('font-semibold text-[var(--foreground)]', compact ? 'text-xl' : 'text-2xl')}>
              {formatPoints(item.pointsCost)}
            </p>
            {!hasEnoughPoints ? (
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                {formatPoints(item.pointsCost - balancePoints)} {t('points needed')}
              </p>
            ) : actionLocked ? (
              <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('ID verification required')}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant={canIssue ? 'secondary' : 'outline'}
            size="sm"
            disabled={!hasEnoughPoints}
            onClick={() => onSelect(item)}
          >
            {canIssue ? <CheckCircle className="size-4" /> : null}
            {actionLocked && hasEnoughPoints ? t('Verify ID to issue') : t('Issue')}
          </Button>
        </div>
    </div>
  )
}
