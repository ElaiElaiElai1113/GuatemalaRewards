export type UserRole = 'customer' | 'platform-admin' | 'business-owner' | 'business-staff'

export type AgreementKind = 'member' | 'business_affiliate' | 'business_custom' | 'trade_deal'

export interface Business {
  id: string
  name: string
  slug: string
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  earnRate: number // points earned per $1 spent
  rewardRatePercent: number
  commissionRatePercent: number
  taxRate: number // e.g. 0.0875 for 8.75%
  taxIncludedInBill: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: number
  currency: string
  active: boolean
  logoUrl?: string | null
  ownerProfileId?: string | null
}

export interface BusinessWithMetrics {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  latitude: number | null
  longitude: number | null
  earnRate: number
  rewardRatePercent: number
  commissionRatePercent: number
  currency: string
  active: boolean
  logoUrl: string | null
  totalMembers: number
  totalRevenue: number
  pointsIssued: number
  creditsOutstanding: number
  commissionOwed: number
  commissionPaid: number
  memberTransactionCount: number
  ownerProfileId: string | null
  ownerName: string | null
  ownerEmail: string | null
  staffCount: number
  staffEmails: string[]
}

export interface Profile {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  favoriteOrder: string
  joinedAt: string
  role: UserRole
  businessId?: string // For business owners - which business they belong to
  referralCode: string
  verificationIdNumber?: string | null
  verificationDocumentPath?: string | null
  verificationDocumentFilename?: string | null
  verificationDocumentUrl?: string | null
  verificationSubmittedAt?: string | null
  verificationStatus?: 'not_submitted' | 'pending_document' | 'submitted' | 'verified' | 'rejected'
  verificationReviewedAt?: string | null
  verificationReviewedBy?: string | null
  verificationRejectionReason?: string | null
  memberQrToken?: string | null
  membership?: Membership | null
}

export interface RewardBalance {
  profileId: string
  points: number
  nextRewardPoints: number
  availableCredits: number
  tierProgress: number
}

export type MembershipStatus = 'active' | 'canceled'

export interface Membership {
  id: string
  profileId: string
  status: MembershipStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  priceCents: number
  currency: string
  provider: string
  providerSubscriptionId: string | null
  lastCreditAt: string | null
  createdAt: string
  updatedAt: string
}

export type ReferralStatus = 'pending' | 'approved' | 'rejected'
export type PartnerReferralStatus = 'attributed' | 'credited' | 'voided'
export type AmbassadorLeadStatus = 'new' | 'contacted' | 'converted' | 'archived'
export type EarlyAccessLeadStatus = 'new' | 'contacted' | 'invited' | 'archived'

export interface EarlyAccessLead {
  id: string
  fullName: string | null
  email: string | null
  whatsapp: string | null
  notes: string
  source: string
  status: EarlyAccessLeadStatus
  marketingConsentAt: string
  createdAt: string
  updatedAt: string
}

export interface AmbassadorLead {
  id: string
  fullName: string
  email: string
  phone: string | null
  city: string
  socialLinks: {
    instagram?: string
    tiktok?: string
    other?: string
  }
  notes: string
  businessId: string | null
  source: string
  status: AmbassadorLeadStatus
  marketingConsentAt: string
  createdAt: string
  updatedAt: string
}

export interface ReferralWithProfiles {
  id: string
  referrerId: string
  refereeId: string
  businessId: string | null
  status: ReferralStatus
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  referrer: {
    fullName: string
    email: string
  }
  referee: {
    fullName: string
    email: string
  }
}

export interface PartnerReferrer {
  id: string
  businessId: string
  partnerName: string
  contactName: string
  contactEmail: string | null
  code: string
  active: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PartnerReferral {
  id: string
  partnerReferrerId: string
  customerProfileId: string
  sourceBusinessId: string
  status: PartnerReferralStatus
  attributedAt: string
  firstOrderId: string | null
  creditedAt: string | null
  createdAt: string
  partnerReferrer: {
    partnerName: string
    contactName: string
    code: string
  }
  customer: {
    fullName: string
    email: string
  }
  firstOrder: {
    id: string
    total: number
    createdAt: string
  } | null
}

export interface PartnerCreditLedgerEntry {
  id: string
  partnerReferrerId: string
  partnerReferralId: string
  orderId: string
  creditType: string
  creditUnits: number
  details: string
  createdAt: string
  redeemedAt: string | null
}

export interface PartnerPerformanceSummary {
  partnerReferrerId: string
  partnerName: string
  contactName: string
  code: string
  active: boolean
  referralsAttributed: number
  referralsCredited: number
  creditsEarned: number
  creditsRedeemed: number
}

export interface Reward {
  id: string
  businessId: string
  title: string
  description: string
  category: 'Drink' | 'Pastry' | 'Merch' | 'Experience'
  pointsCost: number
  inventory: number
  featured: boolean
  highlight: string
}

export interface Product {
  id: string
  businessId: string
  title: string
  description: string
  category: 'Coffee' | 'Pastry' | 'Merch' | 'Equipment'
  price: number
  inventory: number
  featured: boolean
  highlight: string
}

export interface CartItem {
  productId: string
  quantity: number
}

export interface OrderLineItem {
  productId: string
  productTitle: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  profileId: string
  businessId: string
  items: OrderLineItem[]
  subtotal: number
  tax: number
  total: number
  pointsEarned: number
  pointsStatus: 'pending' | 'posted'
  paymentMethod: string
  status: 'confirmed' | 'processing' | 'delivered'
  createdAt: string
}

export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled'

export interface GiftCardCatalogItem {
  id: string
  businessId: string
  title: string
  description: string
  imageUrl: string | null
  pointsCost: number
  valueLabel: string
  expiryDays: number
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
  business?: Pick<Business, 'id' | 'name' | 'logoUrl'>
}

export interface GiftCard {
  id: string
  catalogId: string | null
  businessId: string
  customerId: string
  issuedBy: string | null
  code: string
  publicToken: string
  status: GiftCardStatus
  pointsSpent: number
  expiresAt: string
  redeemedAt: string | null
  redeemedBy: string | null
  redeemedAtBusiness: string | null
  createdAt: string
  updatedAt: string
  redemptionOriginalBill?: number | null
  redemptionGiftCardAmount?: number | null
  redemptionReceiptNumber?: string | null
  catalog?: Pick<GiftCardCatalogItem, 'id' | 'title' | 'description' | 'valueLabel' | 'imageUrl'>
  business?: Pick<Business, 'id' | 'name' | 'logoUrl'>
  customerFirstName?: string
}

export interface PublicGiftCard extends GiftCard {
  businessName: string
  businessLogoUrl: string | null
  businessPrimaryColor: string
  businessAccentColor: string
  customerFirstName: string
  title: string
  description: string
  valueLabel: string
  imageUrl: string | null
}

export interface GiftCardEvent {
  id: string
  giftCardId: string
  eventType: string
  actorId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface OrderForVerification {
  id: string
  profileId: string
  businessId: string
  businessName: string
  total: number
  pointsEarned: number
  expectedPoints: number
  mismatch: boolean
  createdAt: string
}

export type MemberTransactionStatus = 'commission_unpaid' | 'commission_paid'

export interface MemberTransaction {
  id: string
  profileId: string
  businessId: string
  purchaseAmount: number
  rewardRatePercent: number
  rewardValue: number
  pointsAwarded: number
  commissionRatePercent: number
  commissionAmount: number
  commissionStatus: MemberTransactionStatus
  commissionPaidAt: string | null
  commissionPaidBy: string | null
  commissionPaymentNote: string | null
  recordedBy: string | null
  receiptNumber: string | null
  note: string | null
  clientRequestId: string | null
  createdAt: string
  updatedAt: string
  member?: Pick<Profile, 'id' | 'fullName' | 'email' | 'verificationStatus'>
  business?: Pick<Business, 'id' | 'name' | 'currency'>
}

export interface ScannedMember {
  id: string
  fullName: string
  email: string
  verificationStatus: Profile['verificationStatus']
  memberQrToken: string
}

export interface Promotion {
  id: string
  businessId: string
  title: string
  description: string
  badge: string
  cta: string
  expiresAt: string
  audience: string
}

export interface Activity {
  id: string
  profileId: string
  type: 'earned' | 'redeemed' | 'bonus' | 'adjustment' | 'gift_card_issued' | 'gift_card_redeemed'
  title: string
  description: string
  points: number
  createdAt: string
  status: 'posted' | 'pending'
}

export interface Redemption {
  id: string
  profileId: string
  rewardId: string
  rewardTitle: string
  pointsCost: number
  notes?: string
  redeemedAt: string
  status: 'ready' | 'fulfilled'
}

export interface AdminLog {
  id: string
  actorName: string
  action: string
  details: string
  createdAt: string
}

export interface AgreementVersion {
  id: string
  kind: AgreementKind
  requiredRole: UserRole | null
  businessId: string | null
  version: number
  title: string
  body: string
  contentHash: string
  isActive: boolean
  effectiveAt: string
}

export interface AgreementAcceptance {
  id: string
  profileId: string
  businessId: string | null
  agreementVersionId: string
  agreementKind: AgreementKind
  agreementVersion: number
  contentHash: string
  typedSignature: string
  signatureSvg: string | null
  acceptedElectronicRecords: boolean
  acceptedTerms: boolean
  signedAt: string
}

export interface AgreementStatusRecord {
  profileId: string
  fullName: string
  email: string
  role: UserRole
  businessId: string | null
  agreementVersionId: string
  agreementBusinessId: string | null
  agreementKind: AgreementKind
  agreementTitle: string
  agreementVersion: number
  contentHash: string
  isSigned: boolean
  signedAt: string | null
  typedSignature: string | null
  signatureSvg: string | null
}

export interface RequiredAgreementStatus {
  pendingAgreements: AgreementVersion[]
  activeAgreements: AgreementVersion[]
  acceptances: AgreementAcceptance[]
  isComplete: boolean
}

export interface SessionUser {
  profileId: string
  role: UserRole
  businessId?: string // Business owner's business
}

export interface BusinessMetrics {
  totalMembers: number
  totalOrders: number
  totalRevenue: number
  pointsIssued: number
  pointsRedeemed: number
  activePromotions: number
  memberTransactionCount: number
  inPersonRevenue: number
  inPersonRewardsIssued: number
  commissionOwed: number
  commissionPaid: number
}

export interface MockStore {
  businesses: Business[]
  profiles: Profile[]
  balances: RewardBalance[]
  rewards: Reward[]
  products: Product[]
  promotions: Promotion[]
  activities: Activity[]
  redemptions: Redemption[]
  orders: Order[]
  adminLogs: AdminLog[]
  session: SessionUser | null
}
