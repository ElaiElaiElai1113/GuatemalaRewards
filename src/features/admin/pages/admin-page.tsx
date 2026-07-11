import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TrendingUp, Users, Gift, Activity, Trash2, CheckCircle, Store, Megaphone, ExternalLink, IdCard, Mail, ReceiptText, Copy, MapPin, MonitorPlay } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ActivityList } from '@/features/activity/components/activity-list'
import { AgreementStatusPanel } from '@/features/admin/components/agreement-status-panel'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { RewardCard } from '@/features/rewards/components/reward-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompactFilter } from '@/components/ui/compact-filter'
import { CompactSearch } from '@/components/ui/compact-search'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  OwnerNotFoundError,
  StaffNotFoundError,
  useAdjustRewards,
  useAllReferrals,
  useAdminAmbassadorLeads,
  useAdminApproveReferral,
  useAdminAgreementStatuses,
  useAdminAllBusinesses,
  useAdminBusinesses,
  useAdminEarlyAccessLeads,
  useAdminMemberTransactions,
  useAdminOverview,
  useAdminPartnerReferrals,
  useAdminProducts,
  useAdminUsers,
  useAdminRejectReferral,
  useAssignBusinessOwner,
  useAssignBusinessStaff,
  useCreateBusiness,
  useCreateBusinessAgreement,
  useCreateProduct,
  useCreatePromotion,
  useCreateReward,
  useDeleteCustomer,
  useDeleteProduct,
  useDeletePromotion,
  useDeleteReward,
  useFulfillRedemption,
  useOrdersForVerification,
  useProvisionPartnerOwner,
  useReviewMemberVerification,
  useMarkMemberTransactionCommissionPaid,
  useUpdateAmbassadorLeadStatus,
  useUpdateBusiness,
  useUpdateEarlyAccessLeadStatus,
  useUseCredit,
} from '@/hooks/use-admin-data'
import { useAuth } from '@/hooks/use-auth'
import { usePromotions, useRewards } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { searchMatches } from '@/lib/search'
import {
  getAmbassadorLeadStatusLabel,
  getEarlyAccessLeadStatusLabel,
  getPartnerReferralStatusLabel,
  getRedemptionStatusLabel,
  getReferralStatusLabel,
  getVerificationStatusLabel,
} from '@/lib/status-labels'
import type { Profile } from '@/types/domain'
import {
  assignBusinessOwnerSchema,
  createBusinessSchema,
  productDraftSchema,
  promotionDraftSchema,
  rewardAdjustmentSchema,
  rewardDraftSchema,
  type AssignBusinessOwnerFormValues,
  type CreateBusinessFormValues,
  type ProductDraftFormValues,
  type PromotionDraftFormValues,
  type RewardAdjustmentFormValues,
  type RewardDraftFormValues,
} from '@/types/forms'
import { formatCurrency, formatDate } from '@/lib/utils'

const adminTabValues = [
  'members',
  'catalog',
  'products',
  'promotions',
  'partners',
  'ambassadors',
  'early-access',
  'referrals',
  'agreements',
  'activity',
  'commissions',
] as const

type AdminTabValue = (typeof adminTabValues)[number]
type MemberVerificationFilter = 'all' | 'under_review' | 'approved' | 'missing_document' | 'rejected'
type PartnerListFilter = 'all' | 'active' | 'inactive' | 'pinned' | 'missing_coordinates' | 'missing_owner'

function isAdminTabValue(value: string): value is AdminTabValue {
  return adminTabValues.includes(value as AdminTabValue)
}

function getAdminTabFromHash(): AdminTabValue {
  if (typeof window === 'undefined') return 'members'

  const hashValue = window.location.hash.replace('#', '')
  return isAdminTabValue(hashValue) ? hashValue : 'members'
}

function slugifyBusinessName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function isUniqueSlugError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}

function parseBusinessCoordinate(value: string, label: string, min: number, max: number) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`)
  }
  return parsed
}

function isAwaitingVerificationReview(profile: Profile) {
  return (
    profile.verificationStatus === 'submitted' ||
    Boolean(
      profile.verificationDocumentPath &&
      profile.verificationStatus !== 'verified' &&
      profile.verificationStatus !== 'rejected',
    )
  )
}

function matchesMemberVerificationFilter(profile: Profile, filter: MemberVerificationFilter) {
  if (filter === 'all') return true
  if (filter === 'under_review') return isAwaitingVerificationReview(profile)
  if (filter === 'approved') return profile.verificationStatus === 'verified'
  if (filter === 'rejected') return profile.verificationStatus === 'rejected'

  return (
    !isAwaitingVerificationReview(profile) &&
    profile.verificationStatus !== 'verified' &&
    profile.verificationStatus !== 'rejected'
  )
}

function hasPinnedLocation(business: { latitude: number | null; longitude: number | null }) {
  return business.latitude !== null && business.longitude !== null
}

function matchesPartnerListFilter(
  business: {
    active: boolean
    latitude: number | null
    longitude: number | null
    ownerEmail?: string | null
    ownerName?: string | null
  },
  filter: PartnerListFilter,
) {
  if (filter === 'all') return true
  if (filter === 'active') return business.active
  if (filter === 'inactive') return !business.active
  if (filter === 'pinned') return hasPinnedLocation(business)
  if (filter === 'missing_coordinates') return !hasPinnedLocation(business)
  return !business.ownerEmail && !business.ownerName
}

function verificationPriority(profile: Profile) {
  if (isAwaitingVerificationReview(profile)) return 0
  if (profile.verificationStatus === 'pending_document') return 1
  if (profile.verificationStatus === 'not_submitted' || !profile.verificationStatus) return 2
  if (profile.verificationStatus === 'rejected') return 3
  return 4
}

export function AdminPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [actionError, setActionError] = useState<string | null>(null)
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabValue>(() => getAdminTabFromHash())
  const users = useAdminUsers()
  const overview = useAdminOverview()
  const businesses = useAdminBusinesses()
  const allBusinesses = useAdminAllBusinesses()
  const allReferrals = useAllReferrals()
  const partnerReferrals = useAdminPartnerReferrals()
  const ambassadorLeads = useAdminAmbassadorLeads()
  const earlyAccessLeads = useAdminEarlyAccessLeads()
  const memberTransactions = useAdminMemberTransactions()
  const agreementStatuses = useAdminAgreementStatuses()
  const [rewardBusinessId, setRewardBusinessId] = useState('')
  const [productBusinessId, setProductBusinessId] = useState('')
  const [promotionBusinessId, setPromotionBusinessId] = useState('')
  const allRewards = useRewards()
  const rewards = useRewards(rewardBusinessId || undefined)
  const promotions = usePromotions(promotionBusinessId || undefined)
  const adminProducts = useAdminProducts(productBusinessId || undefined)
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null)
  const [verificationBusinessId, setVerificationBusinessId] = useState('all')
  const [createBusinessError, setCreateBusinessError] = useState<string | null>(null)
  const [partnerActionError, setPartnerActionError] = useState<string | null>(null)
  const [verificationRejectionReason, setVerificationRejectionReason] = useState('')
  const [isCreateBusinessDialogOpen, setIsCreateBusinessDialogOpen] = useState(false)
  const [customerPendingDelete, setCustomerPendingDelete] = useState<Profile | null>(null)
  const [businessAccessDialog, setBusinessAccessDialog] = useState<{
    businessId: string
    role: 'business-owner' | 'business-staff'
  } | null>(null)
  const [isCreateSlugManual, setIsCreateSlugManual] = useState(false)
  const [businessPatch, setBusinessPatch] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    logoUrl: '',
  })
  const [memberSearch, setMemberSearch] = useState('')
  const [memberVerificationFilter, setMemberVerificationFilter] = useState<MemberVerificationFilter>('all')
  const [rewardSearch, setRewardSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [promotionSearch, setPromotionSearch] = useState('')
  const [partnerSearch, setPartnerSearch] = useState('')
  const [partnerListFilter, setPartnerListFilter] = useState<PartnerListFilter>('all')
  
  const adjustRewards = useAdjustRewards(profile)
  const createReward = useCreateReward(profile)
  const createPromotion = useCreatePromotion(profile)
  const createProduct = useCreateProduct(profile)
  const fulfillRedemption = useFulfillRedemption(profile)
  const updateBusiness = useUpdateBusiness()
  const createBusiness = useCreateBusiness()
  const createBusinessAgreement = useCreateBusinessAgreement()
  const provisionPartnerOwner = useProvisionPartnerOwner()
  const assignBusinessOwnerFromList = useAssignBusinessOwner()
  const assignBusinessStaffFromList = useAssignBusinessStaff()
  const deleteReward = useDeleteReward(profile?.fullName)
  const deleteProduct = useDeleteProduct(profile?.fullName)
  const deletePromotion = useDeletePromotion(profile?.fullName)
  const deleteCustomer = useDeleteCustomer()
  const useCredit = useUseCredit()
  const approveReferral = useAdminApproveReferral()
  const rejectReferral = useAdminRejectReferral()
  const updateAmbassadorLeadStatus = useUpdateAmbassadorLeadStatus()
  const updateEarlyAccessLeadStatus = useUpdateEarlyAccessLeadStatus()
  const reviewMemberVerification = useReviewMemberVerification()
  const markCommissionPaid = useMarkMemberTransactionCommissionPaid()
  const verificationOrders = useOrdersForVerification(
    verificationBusinessId === 'all' ? undefined : verificationBusinessId,
  )

  const currentBusiness = businesses.data?.[0] ?? null
  const currentBusinessId = currentBusiness?.id ?? ''
  const availableBusinessId = allBusinesses.data?.[0]?.id ?? currentBusinessId
  const moneyFormatter = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)

  const bizColorClass = (bizId: string) => {
    return bizId === currentBusinessId
      ? 'bg-gradient-to-br from-primary to-primary-container'
      : 'bg-gradient-to-br from-tertiary to-primary-container'
  }
  const adminNativeSelectClass =
    'h-10 rounded-xl border border-outline-variant/20 bg-[var(--card)] px-3 text-sm font-medium text-on-surface shadow-sm outline-none transition focus:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/15'
  const adminTextareaClass =
    'min-h-28 rounded-2xl border-outline-variant/20 bg-surface-highest text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/15'

  const adjustmentForm = useForm<RewardAdjustmentFormValues>({
    resolver: zodResolver(rewardAdjustmentSchema),
    defaultValues: {
      profileId: '',
      delta: 50,
      reason: '',
    },
  })
  const customerMembers = (users.data ?? [])
    .filter(({ profile: member }) => member.role === 'customer')
    .slice()
    .sort((left, right) => {
      const priorityDelta = verificationPriority(left.profile) - verificationPriority(right.profile)
      if (priorityDelta !== 0) return priorityDelta

      const leftSubmittedAt = Date.parse(left.profile.verificationSubmittedAt ?? '')
      const rightSubmittedAt = Date.parse(right.profile.verificationSubmittedAt ?? '')
      const submittedAtDelta = (Number.isNaN(rightSubmittedAt) ? 0 : rightSubmittedAt) -
        (Number.isNaN(leftSubmittedAt) ? 0 : leftSubmittedAt)
      if (submittedAtDelta !== 0) return submittedAtDelta

      return left.profile.fullName.localeCompare(right.profile.fullName)
    })
  const pendingVerificationMembers = customerMembers.filter(({ profile: member }) =>
    isAwaitingVerificationReview(member),
  )
  const selectedProfileId = adjustmentForm.watch('profileId')
  const selectedMember = customerMembers.find(({ profile: member }) => member.id === selectedProfileId) ?? null
  const memberVerificationFilterOptions = [
    { value: 'all', label: t('All'), count: customerMembers.length },
    {
      value: 'under_review',
      label: t('Under review'),
      count: customerMembers.filter(({ profile: member }) => matchesMemberVerificationFilter(member, 'under_review')).length,
    },
    {
      value: 'approved',
      label: t('Approved'),
      count: customerMembers.filter(({ profile: member }) => matchesMemberVerificationFilter(member, 'approved')).length,
    },
    {
      value: 'missing_document',
      label: t('Missing ID'),
      count: customerMembers.filter(({ profile: member }) => matchesMemberVerificationFilter(member, 'missing_document')).length,
    },
    {
      value: 'rejected',
      label: t('Rejected'),
      count: customerMembers.filter(({ profile: member }) => matchesMemberVerificationFilter(member, 'rejected')).length,
    },
  ]
  const filteredCustomerMembers = customerMembers.filter(
    ({ profile: member, balance }) =>
      matchesMemberVerificationFilter(member, memberVerificationFilter) &&
      searchMatches(memberSearch, [
        member.fullName,
        member.email,
        member.phone,
        member.location,
        member.id,
        member.referralCode,
        member.verificationIdNumber,
        member.verificationStatus,
        getVerificationStatusLabel(member.verificationStatus),
        balance?.points,
        balance?.availableCredits,
      ]),
  )

  useEffect(() => {
    function syncTabFromHash() {
      setActiveAdminTab(getAdminTabFromHash())
    }

    syncTabFromHash()
    window.addEventListener('hashchange', syncTabFromHash)

    return () => {
      window.removeEventListener('hashchange', syncTabFromHash)
    }
  }, [])

  function handleAdminTabChange(value: string) {
    if (!isAdminTabValue(value)) return

    setActiveAdminTab(value)

    if (window.location.hash !== `#${value}`) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${value}`)
    }
  }

  const rewardForm = useForm<RewardDraftFormValues>({
    resolver: zodResolver(rewardDraftSchema),
    defaultValues: {
      businessId: currentBusinessId,
      title: '',
      description: '',
      category: 'Drink',
      pointsCost: 220,
      highlight: '',
    },
  })

  const productForm = useForm<ProductDraftFormValues>({
    resolver: zodResolver(productDraftSchema),
    defaultValues: {
      businessId: currentBusinessId,
      title: '',
      description: '',
      category: 'Merch',
      price: 5,
      highlight: '',
      inventory: 50,
    },
  })

  const promotionForm = useForm<PromotionDraftFormValues>({
    resolver: zodResolver(promotionDraftSchema),
    defaultValues: {
      title: '',
      description: '',
      badge: '',
      cta: '',
      audience: '',
    },
  })

  const createBusinessForm = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      address: '',
      latitude: null,
      longitude: null,
      logoUrl: '',
      earnRate: 1,
      taxRate: 0,
      taxIncludedInBill: false,
      serviceChargeEnabled: false,
      serviceChargeRate: 0,
      currency: 'USD',
      active: true,
      ownerEmail: '',
      contractTitle: '',
      contractBody: '',
    },
  })

  const assignOwnerForm = useForm<AssignBusinessOwnerFormValues>({
    resolver: zodResolver(assignBusinessOwnerSchema),
    defaultValues: {
      email: '',
    },
  })
  const createBusinessName = createBusinessForm.watch('name')
  const resetCreateBusinessForm = () => {
    createBusinessForm.reset({
      name: '',
      slug: '',
      description: '',
      address: '',
      latitude: null,
      longitude: null,
      logoUrl: '',
      earnRate: 1,
      taxRate: 0,
      taxIncludedInBill: false,
      serviceChargeEnabled: false,
      serviceChargeRate: 0,
      currency: 'USD',
      active: true,
      ownerEmail: '',
      contractTitle: '',
      contractBody: '',
    })
    setCreateBusinessError(null)
    setIsCreateSlugManual(false)
  }

  useEffect(() => {
    if (!availableBusinessId) return

    if (!rewardForm.getValues('businessId')) {
      rewardForm.setValue('businessId', availableBusinessId)
    }

    if (!productForm.getValues('businessId')) {
      productForm.setValue('businessId', availableBusinessId)
    }
  }, [availableBusinessId, productForm, rewardForm])

  useEffect(() => {
    if (!availableBusinessId) return

    if (!rewardBusinessId) {
      setRewardBusinessId(availableBusinessId)
    }

    if (!productBusinessId) {
      setProductBusinessId(availableBusinessId)
    }

    if (!promotionBusinessId) {
      setPromotionBusinessId(availableBusinessId)
    }
  }, [availableBusinessId, productBusinessId, promotionBusinessId, rewardBusinessId])

  useEffect(() => {
    if (selectedProfileId || customerMembers.length === 0) return

    adjustmentForm.setValue('profileId', customerMembers[0].profile.id, {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [adjustmentForm, customerMembers, selectedProfileId])

  useEffect(() => {
    if (isCreateSlugManual) return

    createBusinessForm.setValue('slug', slugifyBusinessName(createBusinessName), {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [createBusinessForm, createBusinessName, isCreateSlugManual])

  useEffect(() => {
    if (!businessAccessDialog) {
      assignOwnerForm.reset({ email: '' })
    }
  }, [businessAccessDialog, assignOwnerForm])

  const beginBusinessEdit = (business: {
    id: string
    name: string
    description: string | null
    address: string
    latitude: number | null
    longitude: number | null
    logoUrl: string | null
  }) => {
    setPartnerActionError(null)
    setEditingBusinessId(business.id)
    setBusinessPatch({
      name: business.name,
      description: business.description ?? '',
      address: business.address,
      latitude: business.latitude === null ? '' : String(business.latitude),
      longitude: business.longitude === null ? '' : String(business.longitude),
      logoUrl: business.logoUrl ?? '',
    })
  }

  const businessNameById = new Map(
    (allBusinesses.data ?? []).map((business) => [business.id, business.name]),
  )
  const filteredRewards = (rewards.data ?? []).filter((reward) =>
    searchMatches(rewardSearch, [
      reward.title,
      reward.description,
      reward.category,
      reward.highlight,
      reward.pointsCost,
      reward.inventory,
      businessNameById.get(reward.businessId),
    ]),
  )
  const filteredAdminProducts = (adminProducts.data ?? []).filter((product) =>
    searchMatches(productSearch, [
      product.title,
      product.description,
      product.category,
      product.highlight,
      product.inventory,
      product.price,
      businessNameById.get(product.businessId),
    ]),
  )
  const filteredPromotions = (promotions.data ?? []).filter((promotion) =>
    searchMatches(promotionSearch, [
      promotion.title,
      promotion.description,
      promotion.badge,
      promotion.cta,
      promotion.audience,
      promotion.expiresAt,
      businessNameById.get(promotion.businessId),
    ]),
  )
  const allBusinessRows = allBusinesses.data ?? []
  const partnerListFilterOptions = [
    { value: 'all', label: t('All'), count: allBusinessRows.length },
    { value: 'active', label: t('Active only'), count: allBusinessRows.filter((business) => business.active).length },
    { value: 'inactive', label: t('Inactive only'), count: allBusinessRows.filter((business) => !business.active).length },
    { value: 'pinned', label: t('Pinned'), count: allBusinessRows.filter((business) => hasPinnedLocation(business)).length },
    {
      value: 'missing_coordinates',
      label: t('Missing coordinates'),
      count: allBusinessRows.filter((business) => !hasPinnedLocation(business)).length,
    },
    {
      value: 'missing_owner',
      label: t('Missing owner'),
      count: allBusinessRows.filter((business) => !business.ownerEmail && !business.ownerName).length,
    },
  ]
  const filteredBusinesses = allBusinessRows.filter(
    (business) =>
      matchesPartnerListFilter(business, partnerListFilter) &&
      searchMatches(partnerSearch, [
        business.name,
        business.slug,
        business.description,
        business.address,
        business.ownerName,
        business.ownerEmail,
        business.currency,
        business.active ? 'active' : 'inactive',
        hasPinnedLocation(business) ? 'pinned' : 'missing coordinates',
        business.latitude,
        business.longitude,
      ]),
  )
  const accessDialogBusiness =
    allBusinesses.data?.find((business) => business.id === businessAccessDialog?.businessId) ?? null
  const memberById = new Map(
    (users.data ?? []).map(({ profile: member }) => [member.id, member]),
  )
  const referralProfileLabel = (profileId: string, fallback: { fullName: string; email: string }) => {
    const member = memberById.get(profileId)
    return {
      fullName:
        fallback.fullName && fallback.fullName !== 'Unknown member'
          ? fallback.fullName
          : (member?.fullName ?? `Member ${profileId.slice(0, 8)}`),
      email: fallback.email || member?.email || profileId,
    }
  }
  const copyVerificationIdNumber = async (idNumber: string | null | undefined) => {
    const normalizedIdNumber = idNumber?.trim()
    if (!normalizedIdNumber) return

    try {
      await navigator.clipboard.writeText(normalizedIdNumber)
      toast.success('ID number copied.')
    } catch {
      toast.error('Could not copy ID number.')
    }
  }
  const ambassadorStatusOptions = ['new', 'contacted', 'converted', 'archived'] as const
  const earlyAccessLeadStatusOptions = ['new', 'contacted', 'invited', 'archived'] as const

  if (profile?.role !== 'platform-admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 bg-surface-low rounded-3xl p-16 border border-outline-variant/10">
        <Badge variant="accent" className="bg-primary/10 text-primary">
          {t('Staff Authentication Required')}
        </Badge>
        <div className="space-y-4 max-w-2xl">
          <h1 className="font-serif text-5xl tracking-tight text-primary leading-tight">
            {t('Admin access requires staff credentials.')}
          </h1>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            {t('Please use the staff demo credentials or sign in with a verified admin account to manage rewards, promotions, and member data.')}
          </p>
        </div>
        <Button
          variant="tertiary"
          size="lg"
          onClick={() => window.location.href = '/'}
          className="rounded-full px-12"
        >
          {t('Return to Home')}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-10 pb-20 xl:space-y-16">
      <div className="warm-hero-muted relative min-w-0 overflow-hidden rounded-[2rem] px-5 py-8 shadow-card sm:px-6 xl:px-8 xl:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--champagne)_22%,transparent),transparent_34%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--rose-brown)_24%,transparent),transparent_32%)]"></div>
        <div className="relative">
          <div className="flex min-w-0 flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="max-w-2xl min-w-0 space-y-4">
              <Badge variant="outline" className="border-[var(--champagne)]/35 bg-[var(--cream)]/12 text-[var(--champagne)]">
                {t('Operations Portal')}
              </Badge>
              <h1 className="font-serif text-[clamp(3rem,6vw,5rem)] tracking-tight text-[var(--cream)] leading-[1.1]">
                {t('Admin Dashboard')}
              </h1>
              <p className="text-lg leading-relaxed text-[var(--cream)]/78 font-medium">
                {t('Manage members, rewards, promotions, and monitor activity across the platform.')}
              </p>
            </div>

            {/* Enhanced Overview Cards */}
            <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 2xl:w-auto 2xl:gap-4">
              <div className="min-w-0 rounded-2xl bg-[var(--cream)]/12 px-4 py-4 text-[var(--cream)] border border-[var(--champagne)]/20 flex items-center gap-3 shadow-soft xl:px-6 xl:py-5 xl:gap-4">
                <div className="size-12 rounded-xl bg-[var(--champagne)] text-[var(--espresso)] flex items-center justify-center">
                  <Users className="size-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl leading-none">{(users.data ?? []).length}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[var(--champagne)]">{t('Members')}</span>
                </div>
              </div>
              <div className="min-w-0 rounded-2xl bg-[var(--cream)]/12 px-4 py-4 text-[var(--cream)] border border-[var(--champagne)]/20 flex items-center gap-3 shadow-soft xl:px-6 xl:py-5 xl:gap-4">
                <div className="size-12 rounded-xl bg-[var(--champagne)] text-[var(--espresso)] flex items-center justify-center">
                  <Gift className="size-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl leading-none">{(allRewards.data ?? []).length}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[var(--champagne)]">{t('Rewards')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-5 shadow-sm sm:p-6 xl:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container/12 text-primary">
              <MonitorPlay className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Walkthrough demo')}</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-primary">{t('See the admin walkthrough')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant/80">
                {t('Open the guided demo for member review, partner setup, verification, and commission operations.')}
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0 rounded-full">
            <Link to="/admin/guide">
              <MonitorPlay className="size-4" />
              {t('Open walkthrough')}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeAdminTab} onValueChange={handleAdminTabChange} className="min-w-0 space-y-12">
        <TabsContent value="members" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="min-w-0 space-y-5">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Member Profile')}</span>
                <h2 className="font-serif text-3xl leading-tight text-primary">{t('Adjust Points')}</h2>
              </div>

              <div className="member-action-panel min-w-0 space-y-5 overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-card p-4 text-card-foreground shadow-sm">
                {selectedMember ? (
                  <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-primary-container/15 bg-[var(--muted)] p-3 shadow-sm sm:p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black font-serif text-xl text-white shadow-sm sm:size-12">
                        {selectedMember.profile.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Profile Summary</p>
                          <p className="mt-1 min-w-0 truncate font-serif text-xl tracking-tight text-primary sm:text-2xl">
                            {selectedMember.profile.fullName}
                          </p>
                          <p className="min-w-0 break-all text-sm font-medium leading-5 text-on-surface-variant/90">
                            {selectedMember.profile.email}
                          </p>
                        </div>
                        <div className="member-stat-grid grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="min-w-0 rounded-2xl border border-primary-container/15 bg-[var(--card)] p-3">
                            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">Points</p>
                            <p className="mt-1 flex items-center gap-1 font-serif text-2xl text-primary">
                              <Gift className="size-3" />
                              {selectedMember.balance?.points ?? 0}
                            </p>
                          </div>
                          <div className="min-w-0 rounded-2xl border border-primary-container/15 bg-[var(--card)] p-3">
                            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">Credits</p>
                            <p className="mt-1 font-serif text-2xl text-primary">{selectedMember.balance?.availableCredits ?? 0}</p>
                          </div>
                          <div className="min-w-0 rounded-2xl border border-primary-container/15 bg-[var(--card)] p-3">
                            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">Recent Value</p>
                            <p className="mt-1 truncate text-sm font-semibold text-primary">{selectedMember.profile.location || t('Unknown')}</p>
                          </div>
                          <div className="min-w-0 rounded-2xl border border-primary-container/15 bg-[var(--card)] p-3">
                            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">Status</p>
                            <p className="mt-1 truncate text-sm font-semibold text-primary">{getVerificationStatusLabel(selectedMember.profile.verificationStatus)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full rounded-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          disabled={deleteCustomer.isPending}
                          onClick={() => setCustomerPendingDelete(selectedMember.profile)}
                        >
                          <Trash2 className="size-4" />
                          Remove Customer
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-primary-container/20 bg-[var(--muted)] p-6 text-sm text-on-surface-variant/85">
                    {t('Select a member to view the profile and update points.')}
                  </div>
                )}

                <Tabs defaultValue="award-points" className="member-action-tabs min-w-0 space-y-4 border-t border-outline-variant/20 pt-5">
                  <TabsList className="grid h-auto w-full min-w-0 grid-cols-[1fr_1fr_1fr] rounded-2xl bg-[var(--muted)] p-1">
                    <TabsTrigger value="award-points" className="min-w-0 whitespace-normal rounded-xl px-1.5 text-center text-[0.68rem] leading-tight tracking-normal sm:px-2 sm:text-xs">Award Points</TabsTrigger>
                    <TabsTrigger value="use-credit" className="min-w-0 whitespace-normal rounded-xl px-1.5 text-center text-[0.68rem] leading-tight tracking-normal sm:px-2 sm:text-xs">Use Credit</TabsTrigger>
                    <TabsTrigger value="verification" className="min-w-0 whitespace-normal rounded-xl px-1.5 text-center text-[0.68rem] leading-tight tracking-normal sm:px-2 sm:text-xs" title="Verification">ID</TabsTrigger>
                  </TabsList>

                  <TabsContent value="award-points" className="outline-none">
                <form
                  className="space-y-4"
                  onSubmit={adjustmentForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        await adjustRewards.mutateAsync(values)
                        adjustmentForm.reset({
                          profileId: values.profileId,
                          delta: 50,
                          reason: '',
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : t('Failed to adjust points.'))
                      }
                    },
                    () => {
                      setActionError(t('Please fix the highlighted member adjustment fields.'))
                    },
                  )}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="profileId" className="text-sm font-semibold">{t('Member')}</Label>
                    <Input
                      id="profileId"
                      list="member-id-options"
                      placeholder={t('Select from the customer list or paste a member id')}
                      className="h-11 rounded-xl border border-primary-container/15 bg-[var(--card)] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                      {...adjustmentForm.register('profileId')}
                    />
                    <datalist id="member-id-options">
                      {customerMembers.map(({ profile: member }) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName} • {member.email}
                        </option>
                      ))}
                    </datalist>
                    {adjustmentForm.formState.errors.profileId ? (
                      <p className="text-xs text-red-500">{adjustmentForm.formState.errors.profileId.message}</p>
                    ) : null}
                    {selectedMember ? (
                      <p className="break-words text-xs text-on-surface-variant/80">
                        {t('Selected')}: {selectedMember.profile.fullName} - {t('Current balance')}: {selectedMember.balance?.points ?? 0} {t('points')}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[0.65fr_1fr]">
                    <div className="grid grid-rows-[2.5rem_2.75rem_auto] gap-2">
                      <Label htmlFor="delta" className="text-sm font-semibold">{t('Points Adjustment')}</Label>
                      <Input id="delta" type="number" className="h-11 rounded-xl border border-primary-container/15 bg-[var(--card)] text-primary focus-visible:ring-primary-container/25" {...adjustmentForm.register('delta', { valueAsNumber: true })} />
                      {adjustmentForm.formState.errors.delta ? (
                        <p className="text-xs text-red-500">{adjustmentForm.formState.errors.delta.message}</p>
                      ) : null}
                    </div>
                    <div className="grid grid-rows-[2.5rem_2.75rem_auto] gap-2">
                      <Label htmlFor="reason" className="text-sm font-semibold">{t('Reason')}</Label>
                      <Input id="reason" placeholder={t('e.g., Service recovery')} className="h-11 rounded-xl border border-primary-container/15 bg-[var(--card)] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25" {...adjustmentForm.register('reason')} />
                      {adjustmentForm.formState.errors.reason ? (
                        <p className="text-xs text-red-500">{adjustmentForm.formState.errors.reason.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant/80">{t('Use a positive number to add points and a negative number to deduct them.')}</p>
                  <Button type="submit" size="lg" variant="secondary" className="h-12 w-full rounded-full font-semibold" disabled={adjustRewards.isPending}>
                    {adjustRewards.isPending ? t('Processing...') : t('Update Points')}
                  </Button>
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
                  </TabsContent>

                  <TabsContent value="use-credit" className="outline-none">
                    <div className="rounded-2xl border border-primary-container/15 bg-[var(--muted)] p-4">
                      <p className="text-sm font-semibold text-primary">
                        {selectedMember?.balance?.availableCredits ?? 0} {t('Reward Credits')}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-on-surface-variant/80">
                        Apply one available reward credit for the selected member.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full rounded-full border-success/25 bg-success/10 text-success hover:bg-success/15"
                        disabled={useCredit.isPending || !selectedMember || (selectedMember.balance?.availableCredits ?? 0) <= 0}
                        onClick={() => {
                          if (!selectedMember) return
                          useCredit.mutate({
                            profileId: selectedMember.profile.id,
                            actorName: profile?.fullName ?? 'Admin',
                          })
                        }}
                      >
                        {useCredit.isPending ? t('Using...') : t('Use Reward Credit')}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="verification" className="outline-none">
                    {selectedMember ? (
                      <div className="space-y-4 rounded-2xl border border-primary-container/15 bg-[var(--muted)] p-4 text-sm text-on-surface-variant/90">
                        <div className="grid gap-3">
                          <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                            <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Phone')}</span>
                            <span className="truncate">{selectedMember.profile.phone || t('Not provided')}</span>
                          </div>
                          <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                            <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Location')}</span>
                            <span className="truncate">{selectedMember.profile.location || t('Not provided')}</span>
                          </div>
                          <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                            <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Member ID')}</span>
                            <span className="truncate font-mono text-xs" title={selectedMember.profile.id}>
                              {selectedMember.profile.id.slice(0, 8)}...{selectedMember.profile.id.slice(-6)}
                            </span>
                          </div>
                          <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                            <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Verification ID</span>
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="min-w-0 truncate font-mono text-xs" title={selectedMember.profile.verificationIdNumber ?? ''}>
                                {selectedMember.profile.verificationIdNumber || t('Not provided')}
                              </span>
                              {selectedMember.profile.verificationIdNumber ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 rounded-full px-2 text-xs"
                                  aria-label="Copy ID number"
                                  onClick={() => copyVerificationIdNumber(selectedMember.profile.verificationIdNumber)}
                                >
                                  <Copy className="size-3" />
                                  Copy ID number
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-outline-variant/20 pt-4">
                          <Badge
                            variant="accent"
                            className={
                              selectedMember.profile.verificationDocumentPath
                                ? 'border-success/25 bg-success/10 text-success'
                                : 'border-warning/25 bg-warning/10 text-warning'
                            }
                          >
                            <IdCard className="mr-1 size-3" />
                            {selectedMember.profile.verificationStatus === 'submitted'
                              ? 'ID submitted'
                              : selectedMember.profile.verificationStatus === 'verified'
                                ? 'Verified'
                                : selectedMember.profile.verificationStatus === 'rejected'
                                  ? 'Rejected'
                                  : 'ID missing'}
                          </Badge>
                          {selectedMember.profile.verificationIdNumber ? (
                            <Badge variant="accent" className="border-primary-container/25 bg-primary-container/12 font-mono text-xs text-primary">
                              ID number: {selectedMember.profile.verificationIdNumber}
                            </Badge>
                          ) : null}
                          {selectedMember.profile.verificationDocumentUrl ? (
                            <Button asChild size="sm" variant="outline" className="rounded-full">
                              <a href={selectedMember.profile.verificationDocumentUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="size-4" />
                                View ID
                              </a>
                            </Button>
                          ) : null}
                        </div>

                        {selectedMember.profile.verificationRejectionReason ? (
                          <p className="text-sm font-semibold leading-6 text-red-600">
                            {selectedMember.profile.verificationRejectionReason}
                          </p>
                        ) : null}

                        {selectedMember.profile.verificationDocumentPath ? (
                          <div className="grid gap-3 rounded-2xl border border-primary-container/15 bg-[var(--card)] p-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-full bg-success/10 text-success hover:bg-success/15"
                                disabled={reviewMemberVerification.isPending}
                                onClick={() => {
                                  reviewMemberVerification.mutate({
                                    profileId: selectedMember.profile.id,
                                    status: 'verified',
                                  })
                                  setVerificationRejectionReason('')
                                }}
                              >
                                <CheckCircle className="size-4" />
                                Verify ID
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                                disabled={reviewMemberVerification.isPending || !verificationRejectionReason.trim()}
                                onClick={() => {
                                  reviewMemberVerification.mutate({
                                    profileId: selectedMember.profile.id,
                                    status: 'rejected',
                                    reason: verificationRejectionReason,
                                  })
                                  setVerificationRejectionReason('')
                                }}
                              >
                                Reject ID
                              </Button>
                            </div>
                            <Textarea
                              value={verificationRejectionReason}
                              onChange={(event) => setVerificationRejectionReason(event.target.value)}
                              placeholder="Reason required when rejecting an ID"
                              className="min-h-16"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-primary-container/20 bg-[var(--muted)] p-4 text-sm text-on-surface-variant/85">
                        {t('Select a member to view the profile and update points.')}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Active Members')}</span>
                  <h2 className="font-serif text-3xl text-primary">{t('Members')}</h2>
                  {pendingVerificationMembers.length > 0 ? (
                    <p className="mt-2 rounded-2xl border border-warning/25 bg-warning/10 px-3 py-2 text-sm font-semibold text-warning">
                      {pendingVerificationMembers.length} IDs awaiting review. Newest submitted IDs are shown first.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <CompactSearch
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                      placeholder={t('Search members')}
                      aria-label={t('Search members')}
                      wrapperClassName="w-full sm:w-64"
                    />
                    <CompactFilter
                      value={memberVerificationFilter}
                      onChange={(event) => setMemberVerificationFilter(event.target.value as MemberVerificationFilter)}
                      options={memberVerificationFilterOptions}
                      aria-label={t('Filter members by verification status')}
                      wrapperClassName="w-full sm:w-52"
                    />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                    {filteredCustomerMembers.length} / {customerMembers.length} {t('customers')}
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 gap-4 pointer-events-auto">
                {filteredCustomerMembers.map(({ profile: member, balance }) => (
                  <div
                    key={member.id}
                    className={`rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm group flex min-w-0 flex-col gap-5 rounded-[2rem] p-5 transition-all sm:p-6 xl:flex-row xl:items-center xl:justify-between ${
                      selectedProfileId === member.id
                        ? 'border-primary-container/35 bg-primary-container/[0.08] shadow-sm'
                        : 'hover:border-primary-container/35 hover:bg-[var(--muted)] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                       <div className="size-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-serif text-2xl text-primary-foreground shadow-lg transition-transform group-hover:scale-105 sm:size-16">
                          {member.fullName.charAt(0)}
                       </div>
                      <div className="min-w-0">
                        <p className="font-serif text-2xl tracking-tight text-primary leading-tight">{member.fullName}</p>
                        <p className="mt-1 break-all text-sm font-medium text-on-surface-variant/90">{member.email}</p>
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="break-all text-[0.6rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/75 italic">
                            ID: {member.id}
                          </span>
                          <span className="size-1 rounded-full bg-outline-variant/30"></span>
                          <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/75 italic">
                            {member.location || t('Unknown')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 xl:w-auto xl:justify-end">
                      <Badge variant="accent" className="border-primary-container/25 bg-primary-container/12 px-3 py-1.5 font-semibold text-primary">{member.role}</Badge>
                      <Badge
                        variant="accent"
                        className={
                          member.verificationDocumentPath
                            ? 'border-success/25 bg-success/10 px-3 py-1.5 font-semibold text-success'
                            : 'border-warning/25 bg-warning/10 px-3 py-1.5 font-semibold text-warning'
                        }
                      >
                        <IdCard className="size-3" />
                        {member.verificationDocumentPath ? 'ID submitted' : 'ID missing'}
                      </Badge>
                      <Badge
                        variant="accent"
                        className={
                          member.verificationStatus === 'verified'
                            ? 'border-success/25 bg-success/10 px-3 py-1.5 font-semibold text-success'
                            : member.verificationStatus === 'rejected'
                              ? 'border-red-200 bg-red-50 px-3 py-1.5 font-semibold text-red-600'
                              : 'border-warning/25 bg-warning/10 px-3 py-1.5 font-semibold text-warning'
                        }
                      >
                        {getVerificationStatusLabel(member.verificationStatus)}
                      </Badge>
                      <Badge variant="accent" className="flex items-center gap-1.5 border-primary/25 bg-primary/12 px-3 py-1.5 font-semibold text-primary">
                        <Gift className="size-3" />
                        {balance?.points ?? 0} {t('points')}
                      </Badge>
                      <Badge variant="accent" className="border-primary-container/25 bg-primary-container/15 px-3 py-1.5 font-semibold text-primary">
                        {balance?.availableCredits ?? 0} {t('Reward Credits')}
                      </Badge>
                      <Button
                        variant={selectedProfileId === member.id ? 'default' : 'outline'}
                        size="sm"
                        className={
                          selectedProfileId === member.id
                            ? 'rounded-full'
                            : 'rounded-full border-primary-container/30 bg-[var(--card)] text-primary hover:border-primary-container/60 hover:bg-primary-container/10 hover:text-primary'
                        }
                        onClick={() => {
                          adjustmentForm.setValue('profileId', member.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          setActionError(null)
                        }}
                      >
                        {selectedProfileId === member.id ? t('Selected') : t('View Profile')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                        disabled={deleteCustomer.isPending}
                        onClick={() => setCustomerPendingDelete(member)}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {customerMembers.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-8" />}
                    title={t('No customers yet')}
                    description={t('Customer accounts will appear here after signup.')}
                  />
                ) : filteredCustomerMembers.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-8" />}
                    title={t('No customers match this search')}
                    description={t('Try a different search or status filter.')}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <Dialog
            open={Boolean(customerPendingDelete)}
            onOpenChange={(open) => {
              if (!open && !deleteCustomer.isPending) {
                setCustomerPendingDelete(null)
              }
            }}
          >
            <DialogContent className="max-w-lg rounded-3xl border border-red-200 bg-[var(--card)] p-6 text-on-surface shadow-card sm:p-8">
              <DialogHeader className="mb-5 pr-8">
                <DialogTitle className="font-serif text-2xl text-red-600">Remove Customer</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-on-surface-variant/85">
                  This permanently removes the customer account, login access, rewards, orders, activity, gift cards, and related customer records from the database. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                {customerPendingDelete ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-bold">{customerPendingDelete.fullName}</p>
                    <p className="mt-1 break-all">{customerPendingDelete.email}</p>
                  </div>
                ) : null}
                <div className="flex flex-col-reverse gap-3 border-t border-red-100 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={deleteCustomer.isPending}
                    onClick={() => setCustomerPendingDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full bg-red-600 text-white hover:bg-red-700"
                    disabled={deleteCustomer.isPending || !customerPendingDelete}
                    onClick={async () => {
                      if (!customerPendingDelete) return

                      const deletingId = customerPendingDelete.id
                      try {
                        await deleteCustomer.mutateAsync(deletingId)
                        if (selectedProfileId === deletingId) {
                          adjustmentForm.reset({
                            profileId: '',
                            delta: 50,
                            reason: '',
                          })
                        }
                        setCustomerPendingDelete(null)
                      } catch {
                        // The mutation hook displays the error toast.
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                    {deleteCustomer.isPending ? 'Removing...' : 'Remove Customer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-8">
              <div className="space-y-4 pb-4 border-b border-outline-variant/10">
                <div className="space-y-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Catalog</span>
                  <h2 className="font-serif text-3xl text-primary">Rewards</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,24rem)_minmax(0,18rem)]">
                  <div className="grid gap-2">
                    <Label htmlFor="reward-business-filter" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Partner
                    </Label>
                    <select
                      id="reward-business-filter"
                      value={rewardBusinessId}
                      onChange={(event) => {
                        const nextBusinessId = event.target.value
                        setRewardBusinessId(nextBusinessId)
                        rewardForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                      }}
                      className={adminNativeSelectClass}
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-reward-search" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Search
                    </Label>
                    <CompactSearch
                      id="admin-reward-search"
                      value={rewardSearch}
                      onChange={(event) => setRewardSearch(event.target.value)}
                      placeholder={t('Search rewards')}
                      aria-label={t('Search rewards')}
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                {filteredRewards.map((reward) => (
                  <div key={reward.id} className="relative group">
                    <RewardCard reward={reward} balancePoints={9999} onRedeem={() => {}} />
                    <Badge variant="outline" className="absolute top-2 left-2 border-outline-variant/20 bg-white/90">
                      {businessNameById.get(reward.businessId) ?? 'Unknown partner'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 size-8 rounded-full text-red-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this reward?')) {
                          deleteReward.mutate(reward.id)
                        }
                      }}
                      disabled={deleteReward.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                {!rewards.isLoading && (rewards.data ?? []).length === 0 ? (
                  <EmptyState
                    className="col-span-full"
                    icon={<Gift className="size-8" />}
                    title={t('No rewards yet')}
                    description={t('Create a reward for the selected partner.')}
                  />
                ) : !rewards.isLoading && filteredRewards.length === 0 ? (
                  <EmptyState
                    className="col-span-full"
                    icon={<Gift className="size-8" />}
                    title={t('No rewards match this search')}
                    description={t('Try a reward title, category, or highlight.')}
                  />
                ) : null}
              </div>
              {!rewardBusinessId ? (
                <div className="rounded-3xl bg-card p-6 border border-outline-variant/20 shadow-sm text-on-surface-variant">
                  No partner is available for reward management yet.
                </div>
              ) : null}
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">Add Reward</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={rewardForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        const businessId = values.businessId || rewardBusinessId || availableBusinessId
                        if (!businessId) {
                          throw new Error('No business is configured yet.')
                        }

                        await createReward.mutateAsync({ ...values, businessId })
                        setRewardBusinessId(businessId)
                        rewardForm.reset({
                          businessId,
                          title: '',
                          description: '',
                          category: 'Drink',
                          pointsCost: 220,
                          highlight: '',
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : 'Failed to create reward.')
                      }
                    },
                    () => {
                      setActionError('Please fix the highlighted reward fields.')
                    },
                  )}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="reward-business">Partner</Label>
                    <select
                      id="reward-business"
                      value={rewardForm.watch('businessId') ?? ''}
                      onChange={(event) => {
                        const nextBusinessId = event.target.value
                        rewardForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                        setRewardBusinessId(nextBusinessId)
                      }}
                      className={adminNativeSelectClass}
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-title">Reward Title</Label>
                    <Input id="reward-title" placeholder="e.g., Midnight Espresso" {...rewardForm.register('title')} />
                    {rewardForm.formState.errors.title ? (
                      <p className="text-xs text-red-500">{rewardForm.formState.errors.title.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-description">Description</Label>
                    <Input id="reward-description" placeholder="Describe the reward..." {...rewardForm.register('description')} />
                    {rewardForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{rewardForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="reward-category">Category</Label>
                      <Input id="reward-category" list="reward-category-options" {...rewardForm.register('category')} />
                      <datalist id="reward-category-options">
                        <option value="Drink" />
                        <option value="Pastry" />
                        <option value="Merch" />
                        <option value="Experience" />
                      </datalist>
                      {rewardForm.formState.errors.category ? (
                        <p className="text-xs text-red-500">{rewardForm.formState.errors.category.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="reward-cost">{t('Points Cost')}</Label>
                      <Input id="reward-cost" type="number" {...rewardForm.register('pointsCost', { valueAsNumber: true })} />
                      {rewardForm.formState.errors.pointsCost ? (
                        <p className="text-xs text-red-500">{rewardForm.formState.errors.pointsCost.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-highlight">Highlight Tag</Label>
                    <Input id="reward-highlight" placeholder="Seasonal / Popular / New" {...rewardForm.register('highlight')} />
                    {rewardForm.formState.errors.highlight ? (
                      <p className="text-xs text-red-500">{rewardForm.formState.errors.highlight.message}</p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full h-14"
                    disabled={createReward.isPending || allBusinesses.isLoading || !availableBusinessId}
                  >
                    {createReward.isPending ? 'Creating...' : 'Add Reward'}
                  </Button>
                  {!allBusinesses.isLoading && !availableBusinessId ? (
                    <p className="text-sm font-medium text-on-surface-variant/75">
                      Setup is incomplete. Reward creation is disabled until the site is connected to its store record.
                    </p>
                  ) : null}
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-8">
              <div className="space-y-4 pb-4 border-b border-outline-variant/10">
                <div className="space-y-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Inventory</span>
                  <h2 className="font-serif text-3xl text-primary">Products</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,24rem)_minmax(0,18rem)]">
                  <div className="grid gap-2">
                    <Label htmlFor="product-business-filter" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Partner
                    </Label>
                    <select
                      id="product-business-filter"
                      value={productBusinessId}
                      onChange={(event) => {
                        const nextBusinessId = event.target.value
                        setProductBusinessId(nextBusinessId)
                        productForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                      }}
                      className={adminNativeSelectClass}
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-product-search" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Search
                    </Label>
                    <CompactSearch
                      id="admin-product-search"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder={t('Search products')}
                      aria-label={t('Search products')}
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {filteredAdminProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between rounded-3xl bg-card hover:bg-surface-low p-6 border border-outline-variant/20 hover:border-primary/30 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`size-14 rounded-2xl flex items-center justify-center text-primary-foreground text-lg font-bold ${
                        bizColorClass(product.businessId)
                      }`}>
                        {product.title.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif text-xl text-primary">{product.title}</p>
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant/70">
                           <span>{product.category}</span>
                           <span className="size-1 rounded-full bg-outline-variant/30"></span>
                           <span>{product.inventory} in stock</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                        <Badge variant="outline" className="text-[0.65rem] border-outline-variant/20 mt-1">
                          {businessNameById.get(product.businessId) ?? 'Unknown partner'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            deleteProduct.mutate(product.id)
                          }
                        }}
                        disabled={deleteProduct.isPending}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {!adminProducts.isLoading && (adminProducts.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={<Store className="size-8" />}
                    title={t('No products yet')}
                    description={t('Create a product for the selected partner.')}
                  />
                ) : !adminProducts.isLoading && filteredAdminProducts.length === 0 ? (
                  <EmptyState
                    icon={<Store className="size-8" />}
                    title={t('No products match this search')}
                    description={t('Try a product title, category, or highlight.')}
                  />
                ) : null}
              </div>
              {!productBusinessId ? (
                <div className="rounded-3xl bg-card p-6 border border-outline-variant/20 shadow-sm text-on-surface-variant">
                  No partner is available for product management yet.
                </div>
              ) : null}
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">Add Product</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={productForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        const businessId = values.businessId || productBusinessId || availableBusinessId
                        if (!businessId) {
                          throw new Error('No business is configured yet.')
                        }

                        await createProduct.mutateAsync({ ...values, businessId })
                        setProductBusinessId(businessId)
                        productForm.reset({
                          businessId,
                          title: '',
                          description: '',
                          category: 'Merch',
                          price: 5,
                          highlight: '',
                          inventory: 50,
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : 'Failed to create product.')
                      }
                    },
                    () => {
                      setActionError('Please fix the highlighted product fields.')
                    },
                  )}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="product-business">Partner</Label>
                    <select
                      id="product-business"
                      value={productForm.watch('businessId') ?? ''}
                      onChange={(event) => {
                        const nextBusinessId = event.target.value
                        productForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                        setProductBusinessId(nextBusinessId)
                      }}
                      className={adminNativeSelectClass}
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-title">Product Title</Label>
                    <Input id="product-title" placeholder="e.g., House Blend" {...productForm.register('title')} />
                    {productForm.formState.errors.title ? (
                      <p className="text-xs text-red-500">{productForm.formState.errors.title.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-description">Description</Label>
                    <Input id="product-description" placeholder="Describe the product..." {...productForm.register('description')} />
                    {productForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{productForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="product-category">Category</Label>
                      <Input id="product-category" list="product-category-options" {...productForm.register('category')} />
                      <datalist id="product-category-options">
                        <option value="Coffee" label="Drinks" />
                        <option value="Pastry" label="Bites" />
                        <option value="Merch" label="Gear" />
                        <option value="Equipment" label="Tools" />
                      </datalist>
                      {productForm.formState.errors.category ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.category.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="product-price">Price ($)</Label>
                      <Input id="product-price" type="number" step="0.01" {...productForm.register('price', { valueAsNumber: true })} />
                      {productForm.formState.errors.price ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.price.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="product-highlight">Highlight Tag</Label>
                      <Input id="product-highlight" placeholder="Popular / New" {...productForm.register('highlight')} />
                      {productForm.formState.errors.highlight ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.highlight.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="product-inventory">Inventory</Label>
                      <Input id="product-inventory" type="number" {...productForm.register('inventory', { valueAsNumber: true })} />
                      {productForm.formState.errors.inventory ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.inventory.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full h-14"
                    disabled={createProduct.isPending || allBusinesses.isLoading || !availableBusinessId}
                  >
                    {createProduct.isPending ? 'Creating...' : 'Add Product'}
                  </Button>
                  {!allBusinesses.isLoading && !availableBusinessId ? (
                    <p className="text-sm font-medium text-on-surface-variant/75">
                      Setup is incomplete. Product creation is disabled until the site is connected to its store record.
                    </p>
                  ) : null}
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-8">
              <div className="space-y-4 pb-4 border-b border-outline-variant/10">
                <div className="space-y-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Active</span>
                  <h2 className="font-serif text-3xl text-primary">Live Promotions</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,24rem)_minmax(0,18rem)]">
                  <div className="grid gap-2">
                    <Label htmlFor="promotion-business-filter" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Partner
                    </Label>
                    <select
                      id="promotion-business-filter"
                      value={promotionBusinessId}
                      onChange={(event) => setPromotionBusinessId(event.target.value)}
                      className={adminNativeSelectClass}
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-promotion-search" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Search
                    </Label>
                    <CompactSearch
                      id="admin-promotion-search"
                      value={promotionSearch}
                      onChange={(event) => setPromotionSearch(event.target.value)}
                      placeholder={t('Search campaigns')}
                      aria-label={t('Search campaigns')}
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-8">
                {filteredPromotions.map((promotion) => (
                  <div key={promotion.id} className="relative group">
                    <PromotionCard
                      promotion={promotion}
                      businessName={businessNameById.get(promotion.businessId) ?? 'Unknown partner'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute bottom-4 right-4 size-10 rounded-full text-red-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this promotion?')) {
                          deletePromotion.mutate(promotion.id)
                        }
                      }}
                      disabled={deletePromotion.isPending}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                ))}
                {!promotions.isLoading && (promotions.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={<TrendingUp className="size-8" />}
                    title={t('No promotions yet')}
                    description={t('Create a promotion for the selected partner.')}
                  />
                ) : !promotions.isLoading && filteredPromotions.length === 0 ? (
                  <EmptyState
                    icon={<TrendingUp className="size-8" />}
                    title={t('No campaigns match this search')}
                    description={t('Try a campaign title, badge, or audience.')}
                  />
                ) : null}
              </div>
              {!promotionBusinessId ? (
                <div className="rounded-3xl bg-card p-6 border border-outline-variant/20 shadow-sm text-on-surface-variant">
                  No partner is available for promotion management yet.
                </div>
              ) : null}
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">New Promotion</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={promotionForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        const businessId = promotionBusinessId || availableBusinessId
                        if (!businessId) {
                          throw new Error('No business is configured yet.')
                        }

                        await createPromotion.mutateAsync({ ...values, businessId })
                        promotionForm.reset({
                          title: '',
                          description: '',
                          badge: '',
                          cta: '',
                          audience: '',
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : 'Failed to create promotion.')
                      }
                    },
                    () => {
                      setActionError('Please fix the highlighted promotion fields.')
                    },
                  )}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-business">Partner</Label>
                    <select
                      id="promotion-business"
                      value={promotionBusinessId}
                      onChange={(event) => setPromotionBusinessId(event.target.value)}
                      className={adminNativeSelectClass}
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-title">Promotion Title</Label>
                    <Input
                      id="promotion-title"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="Weekend espresso flight"
                      {...promotionForm.register('title')}
                    />
                    {promotionForm.formState.errors.title ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.title.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-description">Description</Label>
                    <Textarea
                      id="promotion-description"
                      className={adminTextareaClass}
                      placeholder="Offer a limited-time bundle, perk, or campaign members can redeem this week."
                      {...promotionForm.register('description')}
                    />
                    {promotionForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-badge">Badge Label</Label>
                      <Input
                        id="promotion-badge"
                        className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                        placeholder="e.g., New Offer"
                        {...promotionForm.register('badge')}
                      />
                      {promotionForm.formState.errors.badge ? (
                        <p className="text-xs text-red-500">{promotionForm.formState.errors.badge.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-cta">Action Label</Label>
                      <Input
                        id="promotion-cta"
                        className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                        placeholder="Redeem Now"
                        {...promotionForm.register('cta')}
                      />
                      {promotionForm.formState.errors.cta ? (
                        <p className="text-xs text-red-500">{promotionForm.formState.errors.cta.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-audience">Target Audience</Label>
                    <Input
                      id="promotion-audience"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="All / Bronze / Gold"
                      {...promotionForm.register('audience')}
                    />
                    {promotionForm.formState.errors.audience ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.audience.message}</p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full h-14"
                    disabled={createPromotion.isPending || allBusinesses.isLoading || !availableBusinessId}
                  >
                    {createPromotion.isPending ? 'Creating...' : 'Launch Promotion'}
                  </Button>
                  {!allBusinesses.isLoading && !availableBusinessId ? (
                    <p className="text-sm font-medium text-on-surface-variant/75">
                      Setup is incomplete. Promotion creation is disabled until the site is connected to its store record.
                    </p>
                  ) : null}
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-10 outline-none">
          <div className="partner-operations-layout space-y-8">
            <div className="flex flex-col gap-4 border-b border-outline-variant/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Partner Network</span>
                <h2 className="font-serif text-3xl text-primary">Partner Operations</h2>
                <p className="max-w-2xl text-sm leading-7 text-on-surface-variant/80">
                  Manage partner setup, access, member activity, and commission health from one operational table.
                </p>
              </div>
              <Button
                type="button"
                className="rounded-full"
                onClick={() => {
                  setCreateBusinessError(null)
                  setIsCreateBusinessDialogOpen(true)
                }}
              >
                Create Partner
              </Button>
            </div>

            <Dialog
              open={isCreateBusinessDialogOpen}
              onOpenChange={(open) => {
                setIsCreateBusinessDialogOpen(open)
                if (!open) {
                  setCreateBusinessError(null)
                }
              }}
            >
              <DialogContent className="partner-create-dialog max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl border border-primary-container/20 bg-[var(--card)] text-on-surface shadow-card">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-primary">Create Partner</DialogTitle>
                  <DialogDescription className="text-sm text-on-surface-variant/80">
                    Create a business and provision its partner owner login in one flow. The owner email becomes the login email.
                  </DialogDescription>
                </DialogHeader>

                <form
                  className="grid gap-5 pt-2 md:grid-cols-2"
                  onSubmit={createBusinessForm.handleSubmit(
                    async (values) => {
                      try {
                        setCreateBusinessError(null)
                        const ownerEmail = values.ownerEmail ? values.ownerEmail.trim() : ''
                        const business = await createBusiness.mutateAsync({
                          ...values,
                          ownerEmail,
                        })
                        if (values.contractBody?.trim()) {
                          await createBusinessAgreement.mutateAsync({
                            businessId: business.id as string,
                            businessName: values.name,
                            title: values.contractTitle,
                            body: values.contractBody,
                          })
                        }
                        const ownerCredentials = await provisionPartnerOwner.mutateAsync({
                          email: ownerEmail,
                          businessId: business.id as string,
                          businessName: values.name,
                        })
                        toast.success(
                          `Partner created. Send login credentials to ${ownerCredentials.email}: password ${ownerCredentials.defaultPassword}`,
                          { duration: 12000 },
                        )

                        resetCreateBusinessForm()
                        setIsCreateBusinessDialogOpen(false)
                      } catch (error) {
                        if (isUniqueSlugError(error)) {
                          createBusinessForm.setError('slug', {
                            type: 'server',
                            message: 'That slug is already in use. Choose a different one.',
                          })
                          return
                        }

                        setCreateBusinessError(
                          error instanceof Error ? error.message : 'Failed to create business.',
                        )
                      }
                    },
                    () => {
                      setCreateBusinessError('Please fix the highlighted business fields.')
                    },
                  )}
                >
                  <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                    <Label htmlFor="create-partner-name">Name</Label>
                    <Input
                      id="create-partner-name"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="Harbor Roast"
                      {...createBusinessForm.register('name')}
                    />
                    {createBusinessForm.formState.errors.name ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.name.message}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                    <Label htmlFor="create-partner-slug">Slug</Label>
                    <Input
                      id="create-partner-slug"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="harbor-roast"
                      {...createBusinessForm.register('slug', {
                        onChange: () => setIsCreateSlugManual(true),
                      })}
                    />
                    {createBusinessForm.formState.errors.slug ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.slug.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Lowercase letters, numbers, and single hyphens only.</p>
                    )}
                  </div>

                  <div className="grid gap-3 md:col-span-2">
                    <Label htmlFor="create-partner-description">Description</Label>
                    <Textarea
                      id="create-partner-description"
                      className="min-h-24 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="Neighborhood espresso bar with all-day pastries."
                      {...createBusinessForm.register('description')}
                    />
                    {createBusinessForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:col-span-2">
                    <Label htmlFor="create-partner-address">Address</Label>
                    <Input
                      id="create-partner-address"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="Cra. 37 #10-32, El Poblado, Guatemala"
                      {...createBusinessForm.register('address')}
                    />
                    {createBusinessForm.formState.errors.address ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.address.message}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                    <Label htmlFor="create-partner-latitude">Latitude</Label>
                    <Input
                      id="create-partner-latitude"
                      type="number"
                      step="0.0001"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="6.2088"
                      {...createBusinessForm.register('latitude', {
                        setValueAs: (value) => value === '' ? null : Number(value),
                      })}
                    />
                    {createBusinessForm.formState.errors.latitude ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.latitude.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Optional. Use exact coordinates when available.</p>
                    )}
                  </div>

                  <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                    <Label htmlFor="create-partner-longitude">Longitude</Label>
                    <Input
                      id="create-partner-longitude"
                      type="number"
                      step="0.0001"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="-75.5672"
                      {...createBusinessForm.register('longitude', {
                        setValueAs: (value) => value === '' ? null : Number(value),
                      })}
                    />
                    {createBusinessForm.formState.errors.longitude ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.longitude.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Optional. Leave blank until the partner is pinned.</p>
                    )}
                  </div>

                  <div className="grid gap-3 md:col-span-2">
                    <Label htmlFor="create-partner-logo-url">Logo URL</Label>
                    <Input
                      id="create-partner-logo-url"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="https://example.com/logo.png"
                      {...createBusinessForm.register('logoUrl')}
                    />
                    {createBusinessForm.formState.errors.logoUrl ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.logoUrl.message}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                    <Label htmlFor="create-partner-earn-rate">Earn Rate</Label>
                    <Input
                      id="create-partner-earn-rate"
                      type="number"
                      step="0.01"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      {...createBusinessForm.register('earnRate', { valueAsNumber: true })}
                    />
                    {createBusinessForm.formState.errors.earnRate ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.earnRate.message}</p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Business onboarding</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant/80">
                      Ask whether tax is added on top of the bill or already included, and whether the business adds service charge. Rewards are issued only on the bill amount before tax and service charge.
                    </p>
                  </div>

                  <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                    <Label htmlFor="create-partner-tax-rate">Tax Rate (%)</Label>
                    <Input
                      id="create-partner-tax-rate"
                      type="number"
                      step="0.01"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="12.5"
                      {...createBusinessForm.register('taxRate', { valueAsNumber: true })}
                    />
                    {createBusinessForm.formState.errors.taxRate ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.taxRate.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Example: 115 total with 100 bill, 10 tax, and 5 service charge awards points only on 100.</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-primary-container/20 bg-[var(--muted)] px-4 text-sm font-semibold text-on-surface">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-outline-variant/30"
                        {...createBusinessForm.register('taxIncludedInBill')}
                      />
                      Tax is included in the bill
                    </label>
                    <p className="text-xs text-on-surface-variant/70">
                      Leave unchecked when tax is added on top of the menu/subtotal price.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-primary-container/20 bg-[var(--muted)] px-4 text-sm font-semibold text-on-surface">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-outline-variant/30"
                        {...createBusinessForm.register('serviceChargeEnabled')}
                      />
                      Business adds service charge
                    </label>
                    <p className="text-xs text-on-surface-variant/70">
                      Rewards will not be issued on service charge.
                    </p>
                  </div>

                  <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                    <Label htmlFor="create-partner-service-charge-rate">Service Charge (%)</Label>
                    <Input
                      id="create-partner-service-charge-rate"
                      type="number"
                      step="0.01"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="5"
                      {...createBusinessForm.register('serviceChargeRate', { valueAsNumber: true })}
                    />
                    {createBusinessForm.formState.errors.serviceChargeRate ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.serviceChargeRate.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Enter 5 for a 5% service charge. Use 0 when there is no service charge.</p>
                    )}
                  </div>

                  <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
                    <div className="grid grid-rows-[1.25rem_3rem_auto] gap-3">
                      <Label htmlFor="create-partner-currency">Currency</Label>
                      <Input
                        id="create-partner-currency"
                        maxLength={3}
                        className="h-12 rounded-2xl border-outline-variant/20 uppercase focus:border-primary/30"
                        {...createBusinessForm.register('currency', {
                          onChange: (event) => {
                            createBusinessForm.setValue('currency', event.target.value.toUpperCase(), {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          },
                        })}
                      />
                      {createBusinessForm.formState.errors.currency ? (
                        <p className="text-xs text-red-500">{createBusinessForm.formState.errors.currency.message}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:pt-8">
                      <label className="flex h-12 items-center gap-3 rounded-2xl border border-primary-container/20 bg-[var(--muted)] px-4 text-sm font-semibold text-on-surface">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-outline-variant/30"
                          {...createBusinessForm.register('active')}
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 md:col-span-2">
                    <Label htmlFor="create-partner-owner-email">Partner Login Email</Label>
                    <Input
                      id="create-partner-owner-email"
                      type="email"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="owner@harborroast.com"
                      {...createBusinessForm.register('ownerEmail')}
                    />
                    {createBusinessForm.formState.errors.ownerEmail ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.ownerEmail.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">The partner owner account will be created with this email and the default password. Send those credentials to the partner after saving.</p>
                    )}
                  </div>

                  <div className="grid gap-3 md:col-span-2">
                    <Label htmlFor="create-partner-contract-title">Contract Title</Label>
                    <Input
                      id="create-partner-contract-title"
                      className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="Partner Business Contract"
                      {...createBusinessForm.register('contractTitle')}
                    />
                    {createBusinessForm.formState.errors.contractTitle ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.contractTitle.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Optional. Leave blank to use the business name as the contract title.</p>
                    )}
                  </div>

                  <div className="grid gap-3 md:col-span-2">
                    <Label htmlFor="create-partner-contract-body">Contract Document To Sign</Label>
                    <Textarea
                      id="create-partner-contract-body"
                      className="min-h-48 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="Paste the partner contract or special agreement terms here. The business owner must sign this before the dashboard unlocks."
                      {...createBusinessForm.register('contractBody')}
                    />
                    {createBusinessForm.formState.errors.contractBody ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.contractBody.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Optional. If filled, this becomes a required e-signature agreement for this business owner.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 md:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={resetCreateBusinessForm}
                      disabled={createBusiness.isPending || createBusinessAgreement.isPending || provisionPartnerOwner.isPending}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-full"
                      disabled={createBusiness.isPending || createBusinessAgreement.isPending || provisionPartnerOwner.isPending}
                    >
                      {createBusiness.isPending || createBusinessAgreement.isPending || provisionPartnerOwner.isPending ? 'Creating...' : 'Create Partner'}
                    </Button>
                  </div>
                  {createBusinessError ? <p className="text-sm font-bold text-red-500 md:col-span-2">{createBusinessError}</p> : null}
                </form>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Total Partners</p>
                <p className="mt-3 font-serif text-[2rem] leading-none text-primary">{allBusinesses.data?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Active Partners</p>
                <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                  {allBusinesses.data?.filter((business) => business.active).length ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Tracked Members</p>
                <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                  {allBusinesses.data?.reduce((sum, business) => sum + business.totalMembers, 0) ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">QR Sales</p>
                <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                  {allBusinesses.data?.reduce((sum, business) => sum + business.memberTransactionCount, 0) ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Commission Owed</p>
                <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                  {formatCurrency(allBusinesses.data?.reduce((sum, business) => sum + business.commissionOwed, 0) ?? 0)}
                </p>
              </div>
            </div>

            <div className="partner-management-table overflow-hidden rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card">
              <div className="flex flex-col gap-3 border-b border-outline-variant/10 px-6 py-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="font-serif text-2xl text-primary">Partner Management</h3>
                  <p className="mt-1 text-sm text-on-surface-variant/75">Scan partner status, owner access, revenue, and commission from a denser list.</p>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <CompactSearch
                      value={partnerSearch}
                      onChange={(event) => setPartnerSearch(event.target.value)}
                      placeholder={t('Search partners')}
                      aria-label={t('Search partners')}
                      wrapperClassName="w-full sm:w-64"
                    />
                    <CompactFilter
                      value={partnerListFilter}
                      onChange={(event) => setPartnerListFilter(event.target.value as PartnerListFilter)}
                      options={partnerListFilterOptions}
                      aria-label={t('Filter partners by status')}
                      wrapperClassName="w-full sm:w-52"
                    />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">
                    {filteredBusinesses.length} / {(allBusinesses.data ?? []).length} partners
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-3 lg:hidden">
                {filteredBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="space-y-4 rounded-2xl border border-primary-container/15 bg-[var(--muted)] p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {business.logoUrl ? (
                        <img
                          src={business.logoUrl}
                          alt={business.name}
                          className="size-12 shrink-0 rounded-2xl border border-outline-variant/10 object-cover"
                        />
                      ) : (
                        <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-lg ${bizColorClass(business.id)}`}>
                          <Store className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 truncate font-serif text-xl text-primary">{business.name}</p>
                          <Badge
                            variant="accent"
                            className={
                              business.active
                                ? 'border-success/20 bg-success/10 text-success'
                                : 'border-outline-variant/15 bg-outline-variant/10 text-on-surface-variant'
                            }
                          >
                            {business.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-on-surface-variant/75">{business.slug}</p>
                        <p className="mt-2 break-words text-xs text-on-surface-variant/80">
                          Owner: {business.ownerName || business.ownerEmail || 'Unassigned'}
                        </p>
                        {business.ownerEmail ? (
                          <p className="mt-1 break-words text-xs text-on-surface-variant/80">
                            Owner email: {business.ownerEmail}
                          </p>
                        ) : null}
                        {business.staffEmails.length > 0 ? (
                          <p className="mt-1 break-words text-xs text-on-surface-variant/80">
                            Staff email{business.staffEmails.length === 1 ? '' : 's'}: {business.staffEmails.join(', ')}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-primary-container/15 bg-[var(--card)] p-3">
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">Members</p>
                        <p className="mt-1 font-serif text-xl text-primary">{business.totalMembers}</p>
                      </div>
                      <div className="rounded-xl border border-primary-container/15 bg-[var(--card)] p-3">
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">QR Sales</p>
                        <p className="mt-1 font-serif text-xl text-primary">{business.memberTransactionCount}</p>
                      </div>
                      <div className="rounded-xl border border-primary-container/15 bg-[var(--card)] p-3">
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">Revenue</p>
                        <p className="mt-1 truncate font-semibold text-primary">{moneyFormatter(business.totalRevenue, business.currency)}</p>
                      </div>
                      <div className="rounded-xl border border-primary-container/15 bg-[var(--card)] p-3">
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant/70">Commission</p>
                        <p className="mt-1 truncate font-semibold text-primary">{formatCurrency(business.commissionOwed)}</p>
                        <p className="text-xs text-on-surface-variant/70">{formatCurrency(business.commissionPaid)} paid</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs font-semibold text-on-surface-variant/80">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="min-w-0 break-words">{business.address || 'No address yet'}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          business.latitude !== null && business.longitude !== null
                            ? 'border-success/20 bg-success/10 text-success'
                            : 'border-warning/20 bg-warning/10 text-warning'
                        }
                      >
                        {business.latitude !== null && business.longitude !== null ? 'Pinned' : 'Missing coordinates'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-outline-variant/15 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-full px-2 text-xs"
                        onClick={() => {
                          setPartnerActionError(null)
                          setBusinessAccessDialog({
                            businessId: business.id,
                            role: 'business-owner',
                          })
                        }}
                      >
                        Owner
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-full px-2 text-xs"
                        onClick={() => {
                          setPartnerActionError(null)
                          setBusinessAccessDialog({
                            businessId: business.id,
                            role: 'business-staff',
                          })
                        }}
                      >
                        Staff
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-full px-2 text-xs"
                        onClick={() =>
                          editingBusinessId === business.id
                            ? setEditingBusinessId(null)
                            : beginBusinessEdit(business)
                        }
                      >
                        {editingBusinessId === business.id ? 'Close' : 'Edit'}
                      </Button>
                    </div>

                    {editingBusinessId === business.id ? (
                      <form
                        className="grid gap-3 rounded-2xl border border-primary-container/20 bg-primary-container/10 p-3"
                        onSubmit={async (event) => {
                          event.preventDefault()
                          try {
                            setPartnerActionError(null)
                            const latitude = parseBusinessCoordinate(businessPatch.latitude, 'Latitude', -90, 90)
                            const longitude = parseBusinessCoordinate(businessPatch.longitude, 'Longitude', -180, 180)
                            await updateBusiness.mutateAsync({
                              id: business.id,
                              patch: {
                                name: businessPatch.name.trim(),
                                description: businessPatch.description.trim(),
                                address: businessPatch.address.trim(),
                                latitude,
                                longitude,
                                logoUrl: businessPatch.logoUrl.trim(),
                              },
                            })
                            setEditingBusinessId(null)
                            toast.success('Business updated.')
                          } catch (error) {
                            setPartnerActionError(
                              error instanceof Error ? error.message : 'Failed to update partner info.',
                            )
                          }
                        }}
                      >
                        <div className="grid gap-2">
                          <Label htmlFor={`partner-name-mobile-${business.id}`}>Name</Label>
                          <Input
                            id={`partner-name-mobile-${business.id}`}
                            value={businessPatch.name}
                            onChange={(event) =>
                              setBusinessPatch((current) => ({ ...current, name: event.target.value }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`partner-address-mobile-${business.id}`}>Address</Label>
                          <Input
                            id={`partner-address-mobile-${business.id}`}
                            value={businessPatch.address}
                            onChange={(event) =>
                              setBusinessPatch((current) => ({ ...current, address: event.target.value }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <Label htmlFor={`partner-latitude-mobile-${business.id}`}>Latitude</Label>
                            <Input
                              id={`partner-latitude-mobile-${business.id}`}
                              type="number"
                              step="0.0001"
                              value={businessPatch.latitude}
                              onChange={(event) =>
                                setBusinessPatch((current) => ({ ...current, latitude: event.target.value }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`partner-longitude-mobile-${business.id}`}>Longitude</Label>
                            <Input
                              id={`partner-longitude-mobile-${business.id}`}
                              type="number"
                              step="0.0001"
                              value={businessPatch.longitude}
                              onChange={(event) =>
                                setBusinessPatch((current) => ({ ...current, longitude: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button type="submit" className="rounded-full" disabled={updateBusiness.isPending}>
                            {updateBusiness.isPending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setEditingBusinessId(null)}
                            disabled={updateBusiness.isPending}
                          >
                            Cancel
                          </Button>
                          {partnerActionError ? (
                            <p className="basis-full text-sm font-bold text-red-500">{partnerActionError}</p>
                          ) : null}
                        </div>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>

              <ScrollArea className="hidden w-full lg:block" data-testid="partner-management-table-scroll">
                <div className="min-w-[960px]">
                  <div className="grid grid-cols-[minmax(190px,1.15fr)_minmax(160px,0.9fr)_76px_76px_104px_112px_136px] gap-3 border-b border-outline-variant/10 bg-[var(--muted)] px-4 py-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                    <span>Partner</span>
                    <span>Location</span>
                    <span className="whitespace-nowrap">Members</span>
                    <span className="whitespace-nowrap">QR Sales</span>
                    <span className="whitespace-nowrap">Revenue</span>
                    <span className="whitespace-nowrap">Commission</span>
                    <span className="text-right">Actions</span>
                  </div>

                  <div className="divide-y divide-outline-variant/10">
                    {filteredBusinesses.map((business) => (
                      <div key={business.id}>
                        <div className="grid grid-cols-[minmax(190px,1.15fr)_minmax(160px,0.9fr)_76px_76px_104px_112px_136px] gap-3 px-4 py-5 text-sm">
                          <div className="flex min-w-0 items-start gap-3">
                            {business.logoUrl ? (
                              <img
                                src={business.logoUrl}
                                alt={business.name}
                                className="size-12 shrink-0 rounded-2xl border border-outline-variant/10 object-cover"
                              />
                            ) : (
                              <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-lg ${bizColorClass(business.id)}`}>
                                <Store className="size-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate font-serif text-lg text-primary">{business.name}</p>
                                <Badge
                                  variant="accent"
                                  className={
                                    business.active
                                      ? 'border-success/20 bg-success/10 text-success'
                                      : 'border-outline-variant/15 bg-outline-variant/10 text-on-surface-variant'
                                  }
                                >
                                  {business.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="mt-1 truncate text-xs text-on-surface-variant/75">{business.slug}</p>
                              <p className="mt-2 truncate text-xs text-on-surface-variant/80">
                                Owner: {business.ownerName || business.ownerEmail || 'Unassigned'}
                              </p>
                              {business.ownerEmail ? (
                                <p className="mt-1 truncate text-xs text-on-surface-variant/80" title={business.ownerEmail}>
                                  Owner email: {business.ownerEmail}
                                </p>
                              ) : null}
                              {business.staffEmails.length > 0 ? (
                                <p
                                  className="mt-1 truncate text-xs text-on-surface-variant/80"
                                  title={business.staffEmails.join(', ')}
                                >
                                  Staff email{business.staffEmails.length === 1 ? '' : 's'}: {business.staffEmails.join(', ')}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-4 shrink-0 text-primary" />
                              <span className="truncate text-xs font-semibold text-on-surface-variant/80">
                                {business.address || 'No address yet'}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                business.latitude !== null && business.longitude !== null
                                  ? 'border-success/20 bg-success/10 text-success'
                                  : 'border-warning/20 bg-warning/10 text-warning'
                              }
                            >
                              {business.latitude !== null && business.longitude !== null ? 'Pinned' : 'Missing coordinates'}
                            </Badge>
                          </div>
                          <div className="font-semibold text-primary">{business.totalMembers}</div>
                          <div className="font-semibold text-primary">{business.memberTransactionCount}</div>
                          <div className="truncate font-semibold text-primary">{moneyFormatter(business.totalRevenue, business.currency)}</div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">{formatCurrency(business.commissionOwed)}</p>
                            <p className="text-xs text-on-surface-variant/70">{formatCurrency(business.commissionPaid)} paid</p>
                          </div>
                          <div className="flex min-w-0 flex-wrap justify-end gap-1.5" data-testid="partner-row-actions">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 rounded-full px-2 text-xs"
                              onClick={() => {
                                setPartnerActionError(null)
                                setBusinessAccessDialog({
                                  businessId: business.id,
                                  role: 'business-owner',
                                })
                              }}
                            >
                              Owner
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 rounded-full px-2 text-xs"
                              onClick={() => {
                                setPartnerActionError(null)
                                setBusinessAccessDialog({
                                  businessId: business.id,
                                  role: 'business-staff',
                                })
                              }}
                            >
                              Staff
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 rounded-full px-2 text-xs"
                              onClick={() =>
                                editingBusinessId === business.id
                                  ? setEditingBusinessId(null)
                                  : beginBusinessEdit(business)
                              }
                            >
                              {editingBusinessId === business.id ? 'Close' : 'Edit'}
                            </Button>
                          </div>
                        </div>

                        {editingBusinessId === business.id ? (
                          <form
                            className="mx-6 mb-5 grid gap-4 rounded-[2rem] border border-primary-container/20 bg-primary-container/10 p-5 md:grid-cols-3"
                            onSubmit={async (event) => {
                              event.preventDefault()
                              try {
                                setPartnerActionError(null)
                                const latitude = parseBusinessCoordinate(businessPatch.latitude, 'Latitude', -90, 90)
                                const longitude = parseBusinessCoordinate(businessPatch.longitude, 'Longitude', -180, 180)
                                await updateBusiness.mutateAsync({
                                  id: business.id,
                                  patch: {
                                    name: businessPatch.name.trim(),
                                    description: businessPatch.description.trim(),
                                    address: businessPatch.address.trim(),
                                    latitude,
                                    longitude,
                                    logoUrl: businessPatch.logoUrl.trim(),
                                  },
                                })
                                setEditingBusinessId(null)
                                toast.success('Business updated.')
                              } catch (error) {
                                setPartnerActionError(
                                  error instanceof Error ? error.message : 'Failed to update partner info.',
                                )
                              }
                            }}
                          >
                            <div className="grid gap-2">
                              <Label htmlFor={`partner-name-${business.id}`}>Name</Label>
                              <Input
                                id={`partner-name-${business.id}`}
                                value={businessPatch.name}
                                onChange={(event) =>
                                  setBusinessPatch((current) => ({ ...current, name: event.target.value }))
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`partner-description-${business.id}`}>Description</Label>
                              <Input
                                id={`partner-description-${business.id}`}
                                value={businessPatch.description}
                                onChange={(event) =>
                                  setBusinessPatch((current) => ({ ...current, description: event.target.value }))
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`partner-address-${business.id}`}>Address</Label>
                              <Input
                                id={`partner-address-${business.id}`}
                                value={businessPatch.address}
                                onChange={(event) =>
                                  setBusinessPatch((current) => ({ ...current, address: event.target.value }))
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`partner-latitude-${business.id}`}>Latitude</Label>
                              <Input
                                id={`partner-latitude-${business.id}`}
                                type="number"
                                step="0.0001"
                                value={businessPatch.latitude}
                                onChange={(event) =>
                                  setBusinessPatch((current) => ({ ...current, latitude: event.target.value }))
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`partner-longitude-${business.id}`}>Longitude</Label>
                              <Input
                                id={`partner-longitude-${business.id}`}
                                type="number"
                                step="0.0001"
                                value={businessPatch.longitude}
                                onChange={(event) =>
                                  setBusinessPatch((current) => ({ ...current, longitude: event.target.value }))
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`partner-logo-${business.id}`}>Logo URL</Label>
                              <Input
                                id={`partner-logo-${business.id}`}
                                value={businessPatch.logoUrl}
                                onChange={(event) =>
                                  setBusinessPatch((current) => ({ ...current, logoUrl: event.target.value }))
                                }
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 md:col-span-3">
                              <Button type="submit" className="rounded-full" disabled={updateBusiness.isPending}>
                                {updateBusiness.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setEditingBusinessId(null)}
                                disabled={updateBusiness.isPending}
                              >
                                Cancel
                              </Button>
                              {partnerActionError ? (
                                <p className="text-sm font-bold text-red-500">{partnerActionError}</p>
                              ) : null}
                            </div>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>

              {allBusinesses.isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-2xl" />
                  ))}
                </div>
              ) : null}

              {!allBusinesses.isLoading && (allBusinesses.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={<Store className="size-8" />}
                  title={t('No partners yet')}
                  description={t('Create a partner business before assigning owners or reviewing metrics.')}
                />
              ) : !allBusinesses.isLoading && filteredBusinesses.length === 0 ? (
                <EmptyState
                  icon={<Store className="size-8" />}
                  title={t('No partners match this search')}
                  description={t('Try a different search or partner filter.')}
                />
              ) : null}
            </div>

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card">
              <div className="border-b border-outline-variant/10 px-6 py-5">
                <h3 className="font-serif text-2xl text-primary">Recent Referral Activity</h3>
                <p className="mt-1 text-sm text-on-surface-variant/75">Receptionist-level attribution across all businesses.</p>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {(partnerReferrals.data ?? []).slice(0, 6).map((referral) => (
                  <div key={referral.id} className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-serif text-xl text-primary">{referral.partnerReferrer.contactName}</p>
                      <p className="text-sm text-on-surface-variant/80">{referral.customer.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="accent"
                        className={
                          referral.status === 'credited'
                            ? 'border-success/20 bg-success/10 text-success'
                            : 'border-primary-container/20 bg-primary-container/12 text-primary'
                        }
                      >
                        {getPartnerReferralStatusLabel(referral.status)}
                      </Badge>
                      <span className="text-xs uppercase tracking-[0.18em] text-on-surface-variant/70">
                        {formatDate(referral.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {partnerReferrals.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="px-6 py-5">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="mt-3 h-4 w-64" />
                    </div>
                  ))
                ) : null}
                {!partnerReferrals.isLoading && (partnerReferrals.data?.length ?? 0) === 0 ? (
                  <EmptyState
                    className="border-0 shadow-none"
                    icon={<Users className="size-8" />}
                    title={t('No partner referrals yet')}
                    description={t('Partner referral records will appear here after attribution.')}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <Dialog
            open={Boolean(businessAccessDialog)}
            onOpenChange={(open) => {
              if (!open) {
                setBusinessAccessDialog(null)
              }
            }}
          >
            <DialogContent className="max-w-lg rounded-3xl border border-primary-container/20 bg-[var(--card)] text-on-surface shadow-card">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-primary">
                  {businessAccessDialog?.role === 'business-staff' ? 'Add Staff' : 'Assign Owner'}
                </DialogTitle>
                <DialogDescription className="text-sm text-on-surface-variant/80">
                  {accessDialogBusiness
                    ? businessAccessDialog?.role === 'business-staff'
                      ? `Add a staff account to ${accessDialogBusiness.name}.`
                      : `Assign the canonical owner for ${accessDialogBusiness.name}.`
                    : 'Manage business access.'}
                </DialogDescription>
              </DialogHeader>

              <form
                className="space-y-5 pt-2"
                onSubmit={assignOwnerForm.handleSubmit(async (values) => {
                  if (!businessAccessDialog) return

                  try {
                    if (businessAccessDialog.role === 'business-staff') {
                      await assignBusinessStaffFromList.mutateAsync({
                        email: values.email,
                        businessId: businessAccessDialog.businessId,
                      })
                    } else {
                      await assignBusinessOwnerFromList.mutateAsync({
                        email: values.email,
                        businessId: businessAccessDialog.businessId,
                      })
                    }
                    toast.success(
                      businessAccessDialog.role === 'business-staff'
                        ? 'Business staff assigned.'
                        : 'Business owner assigned.',
                    )
                    setBusinessAccessDialog(null)
                    assignOwnerForm.reset({ email: '' })
                  } catch (error) {
                    if (error instanceof OwnerNotFoundError || error instanceof StaffNotFoundError) {
                      toast.error('No user account matches that email.')
                      return
                    }

                    toast.error(
                      error instanceof Error
                        ? error.message
                        : businessAccessDialog.role === 'business-staff'
                          ? 'Failed to assign staff.'
                          : 'Failed to assign business owner.',
                    )
                  }
                })}
              >
                <div className="grid gap-3">
                  <Label htmlFor="assign-owner-email">
                    {businessAccessDialog?.role === 'business-staff' ? 'Staff Email' : 'Owner Email'}
                  </Label>
                  <Input
                    id="assign-owner-email"
                    type="email"
                    className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                    placeholder={
                      businessAccessDialog?.role === 'business-staff'
                        ? 'staff@partner.com'
                        : 'owner@partner.com'
                    }
                    {...assignOwnerForm.register('email')}
                  />
                  {assignOwnerForm.formState.errors.email ? (
                    <p className="text-xs text-red-500">{assignOwnerForm.formState.errors.email.message}</p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setBusinessAccessDialog(null)}
                    disabled={assignBusinessOwnerFromList.isPending || assignBusinessStaffFromList.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={assignBusinessOwnerFromList.isPending || assignBusinessStaffFromList.isPending}
                  >
                    {assignBusinessOwnerFromList.isPending || assignBusinessStaffFromList.isPending
                      ? 'Saving...'
                      : businessAccessDialog?.role === 'business-staff'
                        ? 'Add Staff'
                        : 'Assign Owner'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Audit</span>
                <h2 className="font-serif text-3xl text-primary">Credit Verification — Recent Orders</h2>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="verification-business" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/80">
                  Filter Partner
                </Label>
                <select
                  id="verification-business"
                  value={verificationBusinessId}
                  onChange={(event) => setVerificationBusinessId(event.target.value)}
                  className="h-12 min-w-56 rounded-2xl border border-primary-container/20 bg-[var(--muted)] px-4 text-sm text-on-surface shadow-sm outline-none transition focus:border-primary/30"
                >
                  <option value="all">All Partners</option>
                  {(allBusinesses.data ?? []).map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
              <ScrollArea className="h-[520px]">
                <div className="min-w-[900px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-left">
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Date</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Partner</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Member ID</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Order Total</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Expected Pts</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Awarded Pts</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(verificationOrders.data ?? []).map((order) => {
                        const partnerCurrency =
                          allBusinesses.data?.find((business) => business.id === order.businessId)?.currency ?? 'USD'

                        return (
                          <tr key={order.id} className="border-b border-outline-variant/5 bg-transparent">
                            <td className="px-6 py-4 text-on-surface-variant/85">{formatDate(order.createdAt)}</td>
                            <td className="px-6 py-4 font-semibold text-primary">{order.businessName}</td>
                            <td className="px-6 py-4 font-mono text-xs text-on-surface-variant/85">{order.profileId}</td>
                            <td className="px-6 py-4 text-on-surface-variant/85">
                              {moneyFormatter(order.total, partnerCurrency)}
                            </td>
                            <td className="px-6 py-4 font-semibold text-primary">{order.expectedPoints}</td>
                            <td className="px-6 py-4 font-semibold text-primary">{order.pointsEarned}</td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="accent"
                                className={
                                  order.mismatch
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-success/10 text-success border-success/20'
                                }
                              >
                                {order.mismatch ? 'Mismatch' : 'Match'}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {verificationOrders.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-6 py-4">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))
                  ) : null}

                  {!verificationOrders.isLoading && (verificationOrders.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<Activity className="size-8" />}
                      title={t('No orders found')}
                      description={t('Orders matching this filter will appear here.')}
                    />
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ambassadors" className="space-y-12 outline-none">
          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Lead Generation</span>
                <h2 className="font-serif text-3xl text-primary">Ambassador Leads</h2>
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                {(ambassadorLeads.data ?? []).length} requests
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {ambassadorStatusOptions.map((status) => (
                <div key={status} className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{getAmbassadorLeadStatusLabel(status)}</p>
                  <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                    {(ambassadorLeads.data ?? []).filter((lead) => lead.status === status).length}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
              <ScrollArea className="h-[680px]">
                <div className="min-w-[980px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-left">
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Lead</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Socials</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Partner</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Note</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ambassadorLeads.data ?? []).map((lead) => {
                        const socialEntries = Object.entries(lead.socialLinks).filter(([, value]) => Boolean(value))

                        return (
                          <tr key={lead.id} className="border-b border-outline-variant/5 bg-transparent align-top">
                            <td className="px-6 py-5">
                              <p className="font-serif text-xl text-primary">{lead.fullName}</p>
                              <p className="mt-1 text-sm text-on-surface-variant/80">{lead.email}</p>
                              {lead.phone ? <p className="text-xs text-on-surface-variant/70">{lead.phone}</p> : null}
                              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-on-surface-variant/65">
                                {lead.city} · {formatDate(lead.createdAt)}
                              </p>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-2">
                                {socialEntries.map(([key, value]) => (
                                  <p key={key} className="max-w-[16rem] break-words text-xs font-semibold text-primary">
                                    <span className="uppercase tracking-[0.14em] text-on-surface-variant/65">{key}: </span>
                                    {value}
                                  </p>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-on-surface-variant/85">
                              {lead.businessId ? businessNameById.get(lead.businessId) ?? 'Unknown partner' : 'Platform-wide'}
                            </td>
                            <td className="px-6 py-5">
                              <p className="max-w-xs text-sm leading-6 text-on-surface-variant/80">{lead.notes || 'No note'}</p>
                            </td>
                            <td className="px-6 py-5">
                              <select
                                className={adminNativeSelectClass}
                                value={lead.status}
                                disabled={updateAmbassadorLeadStatus.isPending}
                                onChange={(event) => {
                                  updateAmbassadorLeadStatus.mutate({
                                    id: lead.id,
                                    status: event.target.value as typeof ambassadorStatusOptions[number],
                                  })
                                }}
                              >
                                {ambassadorStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {getAmbassadorLeadStatusLabel(status)}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {ambassadorLeads.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-6 py-4">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))
                  ) : null}

                  {!ambassadorLeads.isLoading && (ambassadorLeads.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<Megaphone className="size-8" />}
                      title="No ambassador leads yet"
                      description="Public ambassador requests will appear here after people submit the form."
                    />
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="early-access" className="space-y-12 outline-none">
          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Public Requests</span>
                <h2 className="font-serif text-3xl text-primary">Lead Pipeline</h2>
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                {(earlyAccessLeads.data ?? []).length} leads
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {earlyAccessLeadStatusOptions.map((status) => (
                <div key={status} className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{getEarlyAccessLeadStatusLabel(status)}</p>
                  <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                    {(earlyAccessLeads.data ?? []).filter((lead) => lead.status === status).length}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
              <ScrollArea className="h-[680px]">
                <div className="min-w-[900px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-left">
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Contact Details</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Source</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Other Information</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(earlyAccessLeads.data ?? []).map((lead) => (
                        <tr key={lead.id} className="border-b border-outline-variant/5 bg-transparent align-top">
                          <td className="px-6 py-5">
                            <div className="space-y-2">
                              <div>
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Name</p>
                                <p className="font-serif text-xl text-primary">{lead.fullName || 'Public lead'}</p>
                              </div>
                              <div>
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">WhatsApp</p>
                                <p className="break-all text-sm text-on-surface-variant/80">{lead.whatsapp || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Email</p>
                                <p className="break-all text-sm text-on-surface-variant/80">{lead.email || 'Not provided'}</p>
                              </div>
                              <div>
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Submitted</p>
                                <p className="text-sm text-on-surface-variant/80">{formatDate(lead.createdAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <Badge variant="outline" className="max-w-[14rem] truncate border-primary-container/20 bg-[var(--muted)] text-on-surface-variant">
                              {lead.source}
                            </Badge>
                          </td>
                          <td className="px-6 py-5">
                            <div className="max-w-sm space-y-2 text-sm leading-6 text-on-surface-variant/80">
                              <div>
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/60">Instagram / Notes</p>
                                <p>{lead.notes || 'No note'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <select
                              className={adminNativeSelectClass}
                              value={lead.status}
                              disabled={updateEarlyAccessLeadStatus.isPending}
                              onChange={(event) => {
                                updateEarlyAccessLeadStatus.mutate({
                                  id: lead.id,
                                  status: event.target.value as typeof earlyAccessLeadStatusOptions[number],
                                })
                              }}
                            >
                              {earlyAccessLeadStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {getEarlyAccessLeadStatusLabel(status)}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {earlyAccessLeads.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-6 py-4">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))
                  ) : null}

                  {!earlyAccessLeads.isLoading && (earlyAccessLeads.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<Mail className="size-8" />}
                      title="No public leads yet"
                      description="Early adopter and business onboarding requests will appear here after people submit the public forms."
                    />
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-12 outline-none">
          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Referral Program</span>
                <h2 className="font-serif text-3xl text-primary">Referrals</h2>
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                {(allReferrals.data ?? []).length} records
              </span>
            </div>

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
              <div className="space-y-3 p-3 md:hidden">
                {(allReferrals.data ?? []).map((referral) => {
                  const referrer = referralProfileLabel(referral.referrerId, referral.referrer)
                  const referee = referralProfileLabel(referral.refereeId, referral.referee)

                  return (
                    <div
                      key={referral.id}
                      className="space-y-4 rounded-2xl border border-primary-container/15 bg-[var(--muted)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                            Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-primary">{formatDate(referral.createdAt)}</p>
                        </div>
                        <Badge
                          variant="accent"
                          className={
                            referral.status === 'approved'
                              ? 'border-success/20 bg-success/10 text-success'
                              : referral.status === 'rejected'
                                ? 'border-red-200 bg-red-50 text-red-600'
                                : 'border-warning/20 bg-warning/10 text-warning'
                          }
                        >
                          {getReferralStatusLabel(referral.status)}
                        </Badge>
                      </div>

                      <div className="grid gap-3">
                        <div>
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                            Referrer
                          </p>
                          <p className="mt-1 break-words font-semibold text-primary">{referrer.fullName}</p>
                          <p className="break-all text-xs text-on-surface-variant/75">{referrer.email}</p>
                        </div>
                        <div>
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                            Referee
                          </p>
                          <p className="mt-1 break-words font-semibold text-primary">{referee.fullName}</p>
                          <p className="break-all text-xs text-on-surface-variant/75">{referee.email}</p>
                        </div>
                      </div>

                      <div className="border-t border-outline-variant/15 pt-3">
                        {referral.status === 'pending' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-full bg-success/10 text-success hover:bg-success/15"
                              disabled={approveReferral.isPending || rejectReferral.isPending || !profile?.id}
                              onClick={() => {
                                if (!profile?.id) return
                                approveReferral.mutate({ id: referral.id, approverId: profile.id })
                              }}
                            >
                              <CheckCircle className="size-4" />
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                              disabled={approveReferral.isPending || rejectReferral.isPending}
                              onClick={() => rejectReferral.mutate(referral.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-on-surface-variant/70">No action</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {allReferrals.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-primary-container/15 bg-[var(--muted)] p-4">
                      <Skeleton className="h-28 w-full" />
                    </div>
                  ))
                ) : null}

                {!allReferrals.isLoading && (allReferrals.data?.length ?? 0) === 0 ? (
                  <EmptyState
                    className="border-0 shadow-none"
                    icon={<Users className="size-8" />}
                    title={t('No referrals found')}
                    description={t('Customer referral records will appear here.')}
                  />
                ) : null}
              </div>

              <ScrollArea className="hidden h-[620px] md:block">
                <div className="min-w-[760px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-left">
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Date</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Referrer</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Referee</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Status</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allReferrals.data ?? []).map((referral) => {
                        const referrer = referralProfileLabel(referral.referrerId, referral.referrer)
                        const referee = referralProfileLabel(referral.refereeId, referral.referee)

                        return (
                        <tr key={referral.id} className="border-b border-outline-variant/5 bg-transparent">
                          <td className="px-6 py-4 text-on-surface-variant/85">{formatDate(referral.createdAt)}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{referrer.fullName}</p>
                            <p className="text-xs text-on-surface-variant/75">{referrer.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{referee.fullName}</p>
                            <p className="text-xs text-on-surface-variant/75">{referee.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="accent"
                              className={
                                referral.status === 'approved'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : referral.status === 'rejected'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-warning/10 text-warning border-warning/20'
                              }
                            >
                              {getReferralStatusLabel(referral.status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {referral.status === 'pending' ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-full bg-success/10 text-success hover:bg-success/15"
                                  disabled={approveReferral.isPending || rejectReferral.isPending || !profile?.id}
                                  onClick={() => {
                                    if (!profile?.id) return
                                    approveReferral.mutate({ id: referral.id, approverId: profile.id })
                                  }}
                                >
                                  <CheckCircle className="size-4" />
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                                  disabled={approveReferral.isPending || rejectReferral.isPending}
                                  onClick={() => rejectReferral.mutate(referral.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-on-surface-variant/70">No action</span>
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {allReferrals.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-6 py-4">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))
                  ) : null}

                  {!allReferrals.isLoading && (allReferrals.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<Users className="size-8" />}
                      title={t('No referrals found')}
                      description={t('Customer referral records will appear here.')}
                    />
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agreements" className="space-y-12 outline-none">
          <AgreementStatusPanel
            records={agreementStatuses.data ?? []}
            isLoading={agreementStatuses.isLoading}
            businessOptions={allBusinessRows.map((business) => ({
              id: business.id,
              name: business.name,
              ownerName: business.ownerName,
              ownerEmail: business.ownerEmail,
            }))}
            isCreatingAgreement={createBusinessAgreement.isPending}
            onCreateBusinessAgreement={async (values) => {
              await createBusinessAgreement.mutateAsync(values)
              toast.success('Required signing document added.')
            }}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Fulfillment</span>
                <h2 className="font-serif text-3xl text-primary">Fulfillment Queue</h2>
              </div>
              <div className="rounded-3xl bg-card border border-outline-variant/20 shadow-sm overflow-hidden">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-3 sm:p-4">
                    {(overview.data?.redemptions ?? []).map((redemption) => (
                      <div key={redemption.id} className="rounded-2xl bg-surface-lowest hover:bg-surface-low p-4 border border-outline-variant/5 hover:border-outline-variant/10 transition-all sm:p-5">
                        <div className="grid gap-3 sm:flex sm:items-start sm:justify-between sm:gap-4">
                          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                            <div className="size-11 rounded-xl bg-tertiary/30 flex items-center justify-center text-primary shrink-0 sm:size-12">
                              <Gift className="size-5" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="font-serif text-lg tracking-tight text-primary sm:text-xl">{redemption.rewardTitle}</p>
                              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75 italic">
                                Member ID: {redemption.profileId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-3">
                            <Badge variant={redemption.status === 'ready' ? 'outline' : 'accent'} className={
                              redemption.status === 'ready'
                                ? 'border-warning/50 text-warning bg-warning/10'
                                : 'bg-success/10 text-success border-success/20'
                            }>
                              {getRedemptionStatusLabel(redemption.status)}
                            </Badge>
                            {redemption.status === 'ready' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full bg-success/5 text-success hover:bg-success/10 border-success/20 h-8 px-3"
                                onClick={() => fulfillRedemption.mutate(redemption.id)}
                                disabled={fulfillRedemption.isPending}
                              >
                                <CheckCircle className="size-4 mr-1.5" />
                                Fulfill
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/5 pt-4">
                           <div className="flex items-center gap-2">
                             <TrendingUp className="size-4 text-secondary" />
                             <span className="text-sm font-bold text-primary">{redemption.pointsCost} {t('points')}</span>
                           </div>
                           <span className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
                             {formatDate(redemption.redeemedAt)}
                           </span>
                        </div>
                      </div>
                    ))}
                    {(overview.data?.redemptions?.length ?? 0) === 0 && (
                      <EmptyState
                        className="border-0 shadow-none"
                        icon={<Gift className="size-8" />}
                        title={t('No redemptions yet')}
                        description={t('Reward fulfillment requests will appear here.')}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Audit Log</span>
                <h2 className="font-serif text-3xl text-primary">Admin Logs</h2>
              </div>
               <div className="rounded-3xl bg-card border border-outline-variant/20 shadow-sm overflow-hidden">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-3 sm:p-4">
                    {(overview.data?.adminLogs ?? []).map((log) => (
                      <div key={log.id} className="rounded-2xl bg-surface-lowest hover:bg-surface-low p-4 border border-outline-variant/5 hover:border-outline-variant/10 transition-all sm:p-5">
                        <div className="grid gap-3 sm:flex sm:items-start sm:justify-between sm:gap-4">
                          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                            <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 sm:size-12">
                              <Activity className="size-5" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="font-serif text-lg tracking-tight text-primary leading-tight">{log.action}</p>
                              <p className="mt-2 break-words text-sm font-medium leading-relaxed text-on-surface-variant/85">{log.details}</p>
                            </div>
                          </div>
                          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75 sm:whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant/5">
                           <div className="flex items-center gap-2">
                             <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary italic">By {log.actorName}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                    {(overview.data?.adminLogs?.length ?? 0) === 0 ? (
                      <EmptyState
                        className="border-0 shadow-none"
                        icon={<Activity className="size-8" />}
                        title={t('No admin logs yet')}
                        description={t('Administrative changes will appear here.')}
                      />
                    ) : null}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">All Activity</span>
                <h2 className="font-serif text-3xl text-primary">Recent Activity</h2>
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">Latest 6</span>
            </div>
            <ActivityList items={overview.data?.activities.slice(0, 6) ?? []} />
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-12 outline-none">
          <div className="space-y-8">
            <div className="space-y-2 border-b border-outline-variant/10 pb-4">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Commission Ledger</span>
              <h2 className="font-serif text-3xl text-primary">Member QR Transactions</h2>
            </div>

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
              <ScrollArea className="h-[680px]">
                <div className="min-w-[960px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-left">
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Date</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Business</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Member</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Purchase</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Rewards</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Commission</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(memberTransactions.data ?? []).map((transaction) => (
                        <tr key={transaction.id} className="border-b border-outline-variant/5 bg-transparent">
                          <td className="px-6 py-4 text-on-surface-variant/85">{formatDate(transaction.createdAt)}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{transaction.business?.name ?? businessNameById.get(transaction.businessId) ?? 'Unknown business'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{transaction.member?.fullName ?? 'Unknown member'}</p>
                            <p className="text-xs text-on-surface-variant/75">{transaction.member?.email ?? transaction.profileId}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{formatCurrency(transaction.purchaseAmount)}</p>
                            <p className="text-xs text-on-surface-variant/75">
                              Receipt: {transaction.receiptNumber ?? 'Not recorded'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{formatCurrency(transaction.rewardValue)}</p>
                            <p className="text-xs text-on-surface-variant/75">{transaction.pointsAwarded} points</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="accent"
                              className={
                                transaction.commissionStatus === 'commission_paid'
                                  ? 'border-success/20 bg-success/10 text-success'
                                  : 'border-warning/20 bg-warning/10 text-warning'
                              }
                            >
                              {formatCurrency(transaction.commissionAmount)} · {transaction.commissionStatus === 'commission_paid' ? 'paid' : 'owed'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {transaction.commissionStatus === 'commission_unpaid' ? (
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-full"
                                disabled={markCommissionPaid.isPending}
                                onClick={() => markCommissionPaid.mutate({ transactionId: transaction.id })}
                              >
                                Mark paid
                              </Button>
                            ) : (
                              <span className="text-xs font-medium text-on-surface-variant/70">
                                {transaction.commissionPaidAt ? formatDate(transaction.commissionPaidAt) : 'Paid'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {memberTransactions.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-6 py-4">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))
                  ) : null}

                  {!memberTransactions.isLoading && (memberTransactions.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<ReceiptText className="size-8" />}
                      title="No member QR transactions yet"
                      description="Scanned outside-app purchases will appear here for commission tracking."
                    />
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
