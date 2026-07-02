import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  legalService,
  type SignAgreementInput,
} from '@/integrations/supabase/services/legal-service'
import type { Profile } from '@/types/domain'

export const legalKeys = {
  required: (profileId?: string) => ['required-agreements', profileId ?? 'guest'] as const,
}

export function useRequiredAgreements(profile?: Profile | null) {
  return useQuery({
    queryKey: legalKeys.required(profile?.id),
    queryFn: () => legalService.getRequiredAgreements(profile!),
    enabled: Boolean(profile) && profile?.role !== 'platform-admin',
    retry: false,
  })
}

export function useSignAgreement(profile?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SignAgreementInput) => legalService.signAgreement(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: legalKeys.required(profile?.id) })
      toast.success('Agreement signed and saved.')
    },
    onError: (error: Error) => {
      toast.error(`Signature failed: ${error.message}`)
    },
  })
}
