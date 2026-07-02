import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EarnRedeemGate } from '@/features/membership/components/earn-redeem-gate'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { cn, formatPoints } from '@/lib/utils'
import type { Reward } from '@/types/domain'
import { redeemSchema, type RedeemFormValues } from '@/types/forms'

interface RedeemRewardPanelProps {
  reward: Reward
  balancePoints: number
  isSubmitting?: boolean
  actionLocked?: boolean
  onSubmit: (values: RedeemFormValues) => Promise<void> | void
}

export function RedeemRewardPanel({
  reward,
  balancePoints,
  isSubmitting,
  actionLocked = false,
  onSubmit,
}: RedeemRewardPanelProps) {
  const { t } = useLanguage()
  const { isActive: isMembershipActive } = useMembership()
  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      notes: '',
      pickupWindow: 'Now',
    },
  })

  const canRedeem = balancePoints >= reward.pointsCost

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="accent" className="bg-primary/5 text-primary border-none">{t(reward.category)}</Badge>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80 italic">
          {reward.inventory} {t('Available')}
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-3xl tracking-tight text-primary">
          {t(reward.title)}
        </h2>
        <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant/85">
          {t(reward.description)}
        </p>
      </div>

      <div className="grid gap-1 overflow-hidden rounded-[2.5rem] bg-surface-lowest border border-outline-variant/5 shadow-card md:grid-cols-3">
        <div className="space-y-1.5 border-b border-outline-variant/10 p-5 md:border-b-0 md:border-r">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
            {t('Points Cost')}
          </p>
          <p className="font-serif text-2xl leading-tight text-primary">
            {formatPoints(reward.pointsCost)} {t('points')}
          </p>
        </div>
        <div className="space-y-1.5 border-b border-outline-variant/10 p-5 md:border-b-0 md:border-r">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
            {t('Your Points')}
          </p>
          <p className="font-serif text-2xl leading-tight text-primary">
            {formatPoints(balancePoints)} {t('points')}
          </p>
        </div>
        <div className="space-y-1.5 p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
            {t('Points After')}
          </p>
          <p className={cn(
            "font-serif text-2xl leading-tight",
            canRedeem ? "text-primary/80" : "text-error/80"
          )}>
            {formatPoints(Math.max(balancePoints - reward.pointsCost, 0))} {t('points')}
          </p>
        </div>
      </div>

      <form
        className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values)
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-3">
            <Label htmlFor="pickupWindow">{t('Pickup window')}</Label>
            <Input id="pickupWindow" list="pickup-window-options" {...form.register('pickupWindow')} />
            <datalist id="pickup-window-options">
              <option value="Now" />
              <option value="Within 30 mins" />
              <option value="Later today" />
            </datalist>
            {form.formState.errors.pickupWindow ? (
              <p className="text-xs font-bold text-red-500">{form.formState.errors.pickupWindow.message}</p>
            ) : null}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="notes">{t('Notes')}</Label>
            <Input
              id="notes"
              placeholder={t('Pickup notes, substitutions, or timing...')}
              {...form.register('notes')}
            />
            {form.formState.errors.notes ? (
              <p className="text-xs font-bold text-red-500">{form.formState.errors.notes.message}</p>
            ) : null}
          </div>
        </div>

        {actionLocked ? (
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-full px-8 text-sm font-bold tracking-wide shadow-card lg:w-auto"
            disabled
          >
            {t('Verify ID to redeem')}
          </Button>
        ) : (
          <EarnRedeemGate action="redeem">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full px-8 text-sm font-bold tracking-wide shadow-card lg:w-auto"
              disabled={(isMembershipActive && !canRedeem) || isSubmitting}
              isLoading={Boolean(isSubmitting)}
            >
              {isSubmitting
                ? t('Processing...')
                : canRedeem || !isMembershipActive
                  ? t('Redeem Now')
                  : t('Not Enough Points')}
            </Button>
          </EarnRedeemGate>
        )}
      </form>
    </div>
  )
}
