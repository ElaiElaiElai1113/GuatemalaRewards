export const MEMBER_TRANSACTION_POINTS_PER_REWARD_DOLLAR = 1

export interface MemberTransactionCalculationInput {
  purchaseAmount: number
  rewardRatePercent: number
  commissionRatePercent: number
}

export interface RewardablePurchaseCalculationInput {
  receiptTotal: number
  taxRate: number
  taxIncludedInBill: boolean
  serviceChargeRate: number
  serviceChargeEnabled: boolean
  giftCardAmount?: number
}

export interface RewardablePurchaseCalculation {
  originalReceiptTotal: number
  giftCardAmount: number
  amountAfterGiftCard: number
  taxableChargeAmount: number
  serviceChargeAmount: number
  finalPriceAmount: number
  rewardableAmount: number
}

export interface MemberTransactionCalculation {
  rewardValue: number
  pointsAwarded: number
  commissionAmount: number
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export function calculateRewardablePurchaseAmount({
  receiptTotal,
  taxRate,
  taxIncludedInBill,
  serviceChargeRate,
  serviceChargeEnabled,
  giftCardAmount = 0,
}: RewardablePurchaseCalculationInput): RewardablePurchaseCalculation {
  const safeReceiptTotal = Number.isFinite(receiptTotal) ? Math.max(receiptTotal, 0) : 0
  const safeGiftCardAmount = Number.isFinite(giftCardAmount) ? Math.max(giftCardAmount, 0) : 0
  const safeTaxRate = Number.isFinite(taxRate) ? Math.max(taxRate, 0) : 0
  const safeServiceChargeRate = serviceChargeEnabled && Number.isFinite(serviceChargeRate)
    ? Math.max(serviceChargeRate, 0)
    : 0
  const rewardableAmount = roundCurrency(safeReceiptTotal)
  const taxableChargeAmount = taxIncludedInBill ? roundCurrency(rewardableAmount * safeTaxRate) : 0
  const serviceChargeAmount = roundCurrency(rewardableAmount * safeServiceChargeRate)
  const totalBeforeGiftCard = roundCurrency(rewardableAmount + taxableChargeAmount + serviceChargeAmount)
  const appliedGiftCardAmount = roundCurrency(Math.min(safeGiftCardAmount, totalBeforeGiftCard))
  const amountAfterGiftCard = roundCurrency(Math.max(rewardableAmount - appliedGiftCardAmount, 0))
  const finalPriceAmount = roundCurrency(Math.max(totalBeforeGiftCard - appliedGiftCardAmount, 0))

  return {
    originalReceiptTotal: roundCurrency(safeReceiptTotal),
    giftCardAmount: appliedGiftCardAmount,
    amountAfterGiftCard,
    taxableChargeAmount,
    serviceChargeAmount,
    finalPriceAmount,
    rewardableAmount,
  }
}

export function calculateMemberTransaction({
  purchaseAmount,
  rewardRatePercent,
  commissionRatePercent,
}: MemberTransactionCalculationInput): MemberTransactionCalculation {
  if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
    throw new Error('Purchase amount must be greater than 0.')
  }

  const rewardValue = roundCurrency(purchaseAmount * (rewardRatePercent / 100))
  const commissionAmount = roundCurrency(purchaseAmount * (commissionRatePercent / 100))

  return {
    rewardValue,
    pointsAwarded: Math.floor(rewardValue * MEMBER_TRANSACTION_POINTS_PER_REWARD_DOLLAR),
    commissionAmount,
  }
}
