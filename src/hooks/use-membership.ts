import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import { membershipService } from '@/integrations/supabase/services/membership-service'

export const membershipKeys = {
  mine: (profileId?: string) => ['membership', profileId ?? 'guest'] as const,
}

function isMembershipActive(membership: Awaited<ReturnType<typeof membershipService.getMyMembership>>) {
  return membership?.status === 'active' && new Date(membership.currentPeriodEnd).getTime() > Date.now()
}

function requireVerifiedCustomer(verificationStatus?: string | null) {
  if (verificationStatus !== 'verified') {
    throw new Error('ID verification is required before using reward value actions.')
  }
}

export function useMembership() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: membershipKeys.mine(profile?.id),
    queryFn: () => membershipService.getMyMembership(),
    enabled: Boolean(profile?.id),
    initialData: profile?.membership ?? undefined,
  })

  function invalidateMembershipData() {
    if (!profile?.id) return

    void queryClient.invalidateQueries({ queryKey: membershipKeys.mine(profile.id) })
    void queryClient.invalidateQueries({ queryKey: ['reward-balance', profile.id] })
    void queryClient.invalidateQueries({ queryKey: ['activities', profile.id] })
  }

  const subscribe = useMutation({
    mutationFn: () => {
      requireVerifiedCustomer(profile?.verificationStatus)
      return membershipService.mockSubscribe()
    },
    onSuccess: () => {
      invalidateMembershipData()
      toast.success('Demo membership activated. $10 credit added.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const renew = useMutation({
    mutationFn: () => {
      requireVerifiedCustomer(profile?.verificationStatus)
      return membershipService.mockRenew()
    },
    onSuccess: () => {
      invalidateMembershipData()
      toast.success('Demo renewal complete.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const cancel = useMutation({
    mutationFn: () => membershipService.mockCancel(),
    onSuccess: () => {
      invalidateMembershipData()
      toast.success('Membership canceled. Your balance is preserved.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const membership = query.data ?? null

  return {
    membership,
    isActive: isMembershipActive(membership),
    isLoading: query.isLoading,
    subscribe,
    renew,
    cancel,
  }
}
