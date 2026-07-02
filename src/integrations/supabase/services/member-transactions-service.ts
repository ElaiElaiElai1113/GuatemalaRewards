import type { MemberTransaction, Profile, ScannedMember } from '@/types/domain'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

function isMissingReceiptNumberRpc(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''

  return (
    code === 'PGRST202' ||
    (
      message.includes('record_member_transaction') &&
      (
        message.includes('schema cache') ||
        message.includes('p_receipt_number')
      )
    )
  )
}

function mapMemberTransaction(row: Record<string, unknown>): MemberTransaction {
  const transaction = camelCaseRow(row)
  const rawMember = row.profiles as Record<string, unknown> | undefined
  const rawBusiness = row.businesses as Record<string, unknown> | undefined
  const memberFullName = (transaction.memberFullName ?? rawMember?.full_name) as string | undefined
  const memberEmail = (transaction.memberEmail ?? rawMember?.email) as string | undefined
  const memberVerificationStatus = (transaction.memberVerificationStatus ?? rawMember?.verification_status) as Profile['verificationStatus'] | undefined
  const businessName = (transaction.businessName ?? rawBusiness?.name) as string | undefined
  const businessCurrency = (transaction.businessCurrency ?? rawBusiness?.currency) as string | undefined

  return {
    id: transaction.id as string,
    profileId: transaction.profileId as string,
    businessId: transaction.businessId as string,
    purchaseAmount: Number(transaction.purchaseAmount),
    rewardRatePercent: Number(transaction.rewardRatePercent),
    rewardValue: Number(transaction.rewardValue),
    pointsAwarded: Number(transaction.pointsAwarded),
    commissionRatePercent: Number(transaction.commissionRatePercent),
    commissionAmount: Number(transaction.commissionAmount),
    commissionStatus: transaction.commissionStatus as MemberTransaction['commissionStatus'],
    commissionPaidAt: (transaction.commissionPaidAt as string | null) ?? null,
    commissionPaidBy: (transaction.commissionPaidBy as string | null) ?? null,
    commissionPaymentNote: (transaction.commissionPaymentNote as string | null) ?? null,
    recordedBy: (transaction.recordedBy as string | null) ?? null,
    receiptNumber: (transaction.receiptNumber as string | null) ?? null,
    note: (transaction.note as string | null) ?? null,
    clientRequestId: (transaction.clientRequestId as string | null) ?? null,
    createdAt: transaction.createdAt as string,
    updatedAt: transaction.updatedAt as string,
    member: memberFullName && memberEmail && memberVerificationStatus
      ? {
          id: transaction.profileId as string,
          fullName: memberFullName,
          email: memberEmail,
          verificationStatus: memberVerificationStatus,
        }
      : undefined,
    business: businessName && businessCurrency
      ? {
          id: transaction.businessId as string,
          name: businessName,
          currency: businessCurrency,
        }
      : undefined,
  }
}

export const memberTransactionsService = {
  async getMemberByQrToken(token: string): Promise<ScannedMember | null> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('get_member_by_qr_token', {
      p_token: token,
    })

    if (error) throw new Error(friendlySupabaseError(error, 'Failed to load member.'))

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined
    if (!row) return null

    const member = camelCaseRow(row)
    return {
      id: member.id as string,
      fullName: member.fullName as string,
      email: member.email as string,
      verificationStatus: member.verificationStatus as ScannedMember['verificationStatus'],
      memberQrToken: member.memberQrToken as string,
    }
  },

  async recordTransaction(input: {
    token: string
    purchaseAmount: number
    receiptNumber: string
    note?: string
    clientRequestId: string
  }): Promise<MemberTransaction> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('record_member_transaction', {
      p_member_qr_token: input.token,
      p_purchase_amount: input.purchaseAmount,
      p_receipt_number: input.receiptNumber,
      p_note: input.note ?? null,
      p_client_request_id: input.clientRequestId,
    })

    if (error && isMissingReceiptNumberRpc(error)) {
      const { data: legacyData, error: legacyError } = await sb.rpc('record_member_transaction', {
        p_member_qr_token: input.token,
        p_purchase_amount: input.purchaseAmount,
        p_note: [`Receipt/bill: ${input.receiptNumber}.`, input.note].filter(Boolean).join(' '),
        p_client_request_id: input.clientRequestId,
      })

      const legacyRow = (Array.isArray(legacyData) ? legacyData[0] : legacyData) as Record<string, unknown> | null
      if (legacyError || !legacyRow) {
        throw new Error(friendlySupabaseError(legacyError, 'Failed to record member transaction.'))
      }

      return mapMemberTransaction(legacyRow)
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) {
      throw new Error(friendlySupabaseError(error, 'Failed to record member transaction.'))
    }

    return mapMemberTransaction(row)
  },

  async getBusinessTransactions(businessId?: string): Promise<MemberTransaction[]> {
    const sb = requireSupabase()

    if (businessId) {
      const { data, error } = await sb.rpc('get_business_member_transactions', {
        p_business_id: businessId,
      })

      if (!error) {
        return ((data ?? []) as Record<string, unknown>[]).map((row) => mapMemberTransaction(row))
      }
    }

    let query = sb
      .from('member_transactions')
      .select('*, profiles(id, full_name, email, verification_status), businesses(id, name, currency)')
      .order('created_at', { ascending: false })

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load member transactions.')

    return (data ?? []).map((row) => mapMemberTransaction(row as Record<string, unknown>))
  },

  async markCommissionPaid(transactionId: string, note?: string): Promise<MemberTransaction> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('mark_member_transaction_commission_paid', {
      p_transaction_id: transactionId,
      p_note: note ?? null,
    })

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !row) {
      throw new Error(friendlySupabaseError(error, 'Failed to mark commission paid.'))
    }

    return mapMemberTransaction(row)
  },
}
