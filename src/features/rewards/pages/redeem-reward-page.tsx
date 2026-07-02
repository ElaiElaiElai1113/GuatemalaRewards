import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import { useAuth } from '@/hooks/use-auth'
import { useRedeemReward, useReward, useRewardBalance } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'

import { RedeemRewardPanel } from '../components/redeem-reward-panel'

export function RedeemRewardPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { rewardId } = useParams()
  const { profile } = useAuth()
  const reward = useReward(rewardId)
  const rewardBalance = useRewardBalance(profile?.id)
  const redeemReward = useRedeemReward(profile?.id)
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'
  const rewardActionsLocked = verificationStatus !== 'verified'

  if (!rewardId) {
    return <Navigate to="/rewards" replace />
  }

  if (reward.isLoading || rewardBalance.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-8">
        <Badge variant="accent" className="bg-primary/10 text-primary">
          {t('Redeem Reward')}
        </Badge>
        <LoadingState
          className="py-2"
          title={t('Loading')}
          description={t('Preparing reward details.')}
        />
        <div className="rounded-[3rem] bg-surface-low p-8 md:p-12 border border-outline-variant/10 shadow-card">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-12 w-3/4" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-10 h-40 rounded-[2rem]" />
        </div>
      </div>
    )
  }

  if (reward.error || !reward.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-8">
        <Badge variant="accent" className="bg-primary/10 text-primary">
          {t('Redeem Reward')}
        </Badge>
        <div className="rounded-[3rem] bg-surface-low p-8 md:p-12 border border-outline-variant/10 shadow-card space-y-4">
          <p className="text-lg font-medium text-red-500">
            {reward.error instanceof Error ? reward.error.message : t('Reward not found.')}
          </p>
          <Button onClick={() => navigate('/rewards')} className="rounded-full">
            {t('Return to Catalog')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 py-8">
      <div className="space-y-4">
        <Badge variant="accent" className="bg-primary/10 text-primary">
          {t('Redeem Reward')}
        </Badge>
        <div className="space-y-2">
          <h1 className="font-serif text-5xl tracking-tight text-primary">
            {t('Confirm your next treat.')}
          </h1>
          <p className="max-w-2xl text-lg font-medium leading-relaxed text-on-surface-variant/85">
            {t('Review the details and confirm. Your points will be deducted and your reward will be ready for pick-up.')}
          </p>
        </div>
      </div>

      <VerificationStatusNotice
        status={verificationStatus}
        rejectionReason={profile?.verificationRejectionReason}
      />

      <div className="rounded-[3rem] bg-surface-low p-8 md:p-12 border border-outline-variant/10 shadow-card">
        <RedeemRewardPanel
          reward={reward.data}
          balancePoints={rewardBalance.data?.points ?? 0}
          isSubmitting={redeemReward.isPending}
          actionLocked={rewardActionsLocked}
          onSubmit={async (values) => {
            if (rewardActionsLocked) {
              navigate('/profile')
              return
            }
            await redeemReward.mutateAsync({
              rewardId,
              ...values,
            })
            navigate('/activity')
          }}
        />
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/rewards')}
          className="h-auto p-0 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80 transition-colors hover:text-primary"
        >
          {t('Return to Catalog')}
        </Button>
      </div>
    </div>
  )
}
