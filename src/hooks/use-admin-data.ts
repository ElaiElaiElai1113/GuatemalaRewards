import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminService } from '@/integrations/supabase/services/admin-service'
import { ambassadorService } from '@/integrations/supabase/services/ambassador-service'
import { businessService } from '@/integrations/supabase/services/business-service'
import { earlyAccessService } from '@/integrations/supabase/services/early-access-service'
import { memberTransactionsService } from '@/integrations/supabase/services/member-transactions-service'
import { partnerService } from '@/integrations/supabase/services/partner-service'
import { productsService } from '@/integrations/supabase/services/products-service'
import { promotionsService } from '@/integrations/supabase/services/promotions-service'
import { referralsService } from '@/integrations/supabase/services/referrals-service'
import { rewardsService } from '@/integrations/supabase/services/rewards-service'
import type {
  AssignBusinessOwnerFormValues,
  BusinessSettingsFormValues,
  CreateBusinessFormValues,
  ProductDraftFormValues,
  PromotionDraftFormValues,
  RewardAdjustmentFormValues,
  RewardDraftFormValues,
} from '@/types/forms'
import type { Profile } from '@/types/domain'
import type { AmbassadorLeadStatus, EarlyAccessLeadStatus } from '@/types/domain'

const adminKeys = {
  users: ['admin-users'] as const,
  overview: ['admin-overview'] as const,
  businesses: ['businesses'] as const,
  agreementStatuses: ['admin-agreement-statuses'] as const,
}

export class OwnerNotFoundError extends Error {
  constructor(email: string) {
    super(`No account found for ${email}.`)
    this.name = 'OwnerNotFoundError'
  }
}

export class StaffNotFoundError extends Error {
  constructor(email: string) {
    super(`No account found for ${email}.`)
    this.name = 'StaffNotFoundError'
  }
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: () => adminService.getUsers(),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: string) => adminService.deleteCustomer(profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'member-transactions'] })
      toast.success('Customer removed successfully')
    },
    onError: (error: Error) => {
      toast.error(`Remove customer failed: ${error.message}`)
    },
  })
}

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => adminService.getOverview(),
  })
}

export function useAdminAgreementStatuses() {
  return useQuery({
    queryKey: adminKeys.agreementStatuses,
    queryFn: () => adminService.getAgreementStatuses(),
  })
}

export function useAdminProducts(businessId?: string) {
  return useQuery({
    queryKey: ['products', businessId ?? 'all'],
    queryFn: () => productsService.getProducts(businessId),
  })
}

export function useAdminBusinesses() {
  return useQuery({
    queryKey: adminKeys.businesses,
    queryFn: async () => [await businessService.getSingleBusiness()],
  })
}

export function useAdminAllBusinesses() {
  return useQuery({
    queryKey: ['admin', 'businesses'],
    queryFn: () => adminService.getBusinessesWithMetrics(),
  })
}

export function useAllReferrals() {
  return useQuery({
    queryKey: ['referrals', 'all'],
    queryFn: () => referralsService.getAllReferrals(),
  })
}

export function useUseCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, actorName }: { profileId: string; actorName: string }) =>
      referralsService.useCredit(profileId, actorName),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: ['reward-balance', variables.profileId] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      void queryClient.invalidateQueries({ queryKey: ['activities', variables.profileId] })
      toast.success('Reward Credit used')
    },
    onError: (error: Error) => {
      toast.error(`Reward credit use failed: ${error.message}`)
    },
  })
}

export function useAdminApproveReferral() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
      referralsService.approveReferral(id, approverId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['referrals', 'all'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      void queryClient.invalidateQueries({ queryKey: ['reward-balance'] })
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Referral approved')
    },
    onError: (error: Error) => {
      toast.error(`Approval failed: ${error.message}`)
    },
  })
}

export function useAdminRejectReferral() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => referralsService.rejectReferral(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['referrals', 'all'] })
      toast.success('Referral rejected')
    },
    onError: (error: Error) => {
      toast.error(`Rejection failed: ${error.message}`)
    },
  })
}

export function useUpdateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Parameters<typeof adminService.updateBusiness>[1]
    }) => adminService.updateBusiness(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      void qc.invalidateQueries({ queryKey: adminKeys.businesses })
      void qc.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}

export function useCreateBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CreateBusinessFormValues) => adminService.createBusiness(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.businesses })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
  })
}

export function useProvisionPartnerOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: {
      businessId: string
      businessName: string
      email: string
    }) => adminService.provisionPartnerOwner(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.businesses })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
  })
}

export function useCreateBusinessAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: {
      businessId: string
      businessName: string
      title?: string
      body: string
    }) => adminService.createBusinessAgreement(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.agreementStatuses })
    },
  })
}

export function useAssignBusinessOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      businessId,
    }: AssignBusinessOwnerFormValues & { businessId: string }) => {
      const userId = await adminService.lookupUserByEmail(email)

      if (!userId) {
        throw new OwnerNotFoundError(email)
      }

      await adminService.assignBusinessOwner(userId, businessId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.businesses })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    },
  })
}

export function useAssignBusinessStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      businessId,
    }: AssignBusinessOwnerFormValues & { businessId: string }) => {
      const userId = await adminService.lookupUserByEmail(email)

      if (!userId) {
        throw new StaffNotFoundError(email)
      }

      await adminService.assignBusinessStaff(userId, businessId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.businesses })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    },
  })
}

export function useOrdersForVerification(businessId?: string) {
  return useQuery({
    queryKey: ['admin', 'verification', businessId],
    queryFn: () => adminService.getOrdersForVerification(businessId),
  })
}

export function useAdminPartnerReferrers() {
  return useQuery({
    queryKey: ['admin', 'partner-referrers'],
    queryFn: () => partnerService.getPartnerReferrers(),
  })
}

export function useAdminPartnerReferrals() {
  return useQuery({
    queryKey: ['admin', 'partner-referrals'],
    queryFn: () => partnerService.getPartnerReferrals(),
  })
}

export function useAdminPartnerPerformance() {
  return useQuery({
    queryKey: ['admin', 'partner-performance'],
    queryFn: () => partnerService.getPartnerPerformance(),
  })
}

export function useAdminAmbassadorLeads() {
  return useQuery({
    queryKey: ['admin', 'ambassador-leads'],
    queryFn: () => ambassadorService.getLeads(),
  })
}

export function useAdminEarlyAccessLeads() {
  return useQuery({
    queryKey: ['admin', 'early-access-leads'],
    queryFn: () => earlyAccessService.getLeads(),
  })
}

export function useAdminMemberTransactions() {
  return useQuery({
    queryKey: ['admin', 'member-transactions'],
    queryFn: () => memberTransactionsService.getBusinessTransactions(),
  })
}

export function useMarkMemberTransactionCommissionPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ transactionId, note }: { transactionId: string; note?: string }) =>
      memberTransactionsService.markCommissionPaid(transactionId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'member-transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      toast.success('Commission marked paid')
    },
    onError: (error: Error) => {
      toast.error(`Commission update failed: ${error.message}`)
    },
  })
}

export function useUpdateAmbassadorLeadStatus(businessId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AmbassadorLeadStatus }) =>
      ambassadorService.updateLeadStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ambassador-leads'] })
      void queryClient.invalidateQueries({ queryKey: ['ambassador-leads', businessId ?? 'all'] })
      toast.success('Ambassador lead updated')
    },
    onError: (error: Error) => {
      toast.error(`Ambassador lead update failed: ${error.message}`)
    },
  })
}

export function useUpdateEarlyAccessLeadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EarlyAccessLeadStatus }) =>
      earlyAccessService.updateLeadStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'early-access-leads'] })
      toast.success('Early access lead updated')
    },
    onError: (error: Error) => {
      toast.error(`Early access lead update failed: ${error.message}`)
    },
  })
}

export function useReviewMemberVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      profileId,
      status,
      reason,
    }: {
      profileId: string
      status: 'verified' | 'rejected'
      reason?: string
    }) => adminService.reviewMemberVerification(profileId, status, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      toast.success('Member verification updated')
    },
    onError: (error: Error) => {
      toast.error(`Verification review failed: ${error.message}`)
    },
  })
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ businessId, values }: { businessId: string; values: BusinessSettingsFormValues }) =>
      businessService.updateSettings(businessId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.businesses })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Settings updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}

export function useAdjustRewards(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RewardAdjustmentFormValues) => adminService.adjustRewards(values, actor!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      void queryClient.invalidateQueries({ queryKey: ['reward-balance'] })
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Points adjusted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Adjustment failed: ${error.message}`)
    },
  })
}

export function useCreateReward(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RewardDraftFormValues) =>
      rewardsService.createReward(values, actor?.fullName ?? 'Platform Admin'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Reward created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Creation failed: ${error.message}`)
    },
  })
}

export function useCreateProduct(actor?: Profile | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProductDraftFormValues) =>
      productsService.createProduct(values, actor?.fullName ?? 'Platform Admin'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Product created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Creation failed: ${error.message}`)
    },
  })
}

export function useCreatePromotion(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: PromotionDraftFormValues & { businessId: string }) =>
      promotionsService.createPromotion(values, actor?.fullName ?? 'Platform Admin'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Promotion created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Creation failed: ${error.message}`)
    },
  })
}

export function useFulfillRedemption(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (redemptionId: string) => adminService.fulfillRedemption(redemptionId, actor!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      void queryClient.invalidateQueries({ queryKey: ['businessRedemptions', actor?.businessId] })
      void queryClient.invalidateQueries({ queryKey: ['metrics', actor?.businessId] })
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Redemption fulfilled successfully')
    },
    onError: (error: Error) => {
      toast.error(`Fulfillment failed: ${error.message}`)
    },
  })
}

export function useDeleteReward(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rewardId: string) => rewardsService.deleteReward(rewardId, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Reward deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}

export function useDeleteProduct(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => productsService.deleteProduct(productId, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Product deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}

export function useDeletePromotion(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (promotionId: string) => promotionsService.deletePromotion(promotionId, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Promotion deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}

export function useUpdateReward(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rewardId, values }: { rewardId: string; values: Partial<RewardDraftFormValues> }) =>
      rewardsService.updateReward(rewardId, values, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      toast.success('Reward updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}

export function useUpdateProduct(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, values }: { productId: string; values: Partial<ProductDraftFormValues> }) =>
      productsService.updateProduct(productId, values, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}

export function useUpdatePromotion(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promotionId, values }: { promotionId: string; values: Partial<PromotionDraftFormValues> }) =>
      promotionsService.updatePromotion(promotionId, values, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}
