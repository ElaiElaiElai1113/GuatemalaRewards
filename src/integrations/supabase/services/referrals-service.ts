import type { ReferralWithProfiles } from '@/types/domain'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

type ProfileSummary = {
  fullName: string
  email: string
}

type ReferralRow = Record<string, unknown> & {
  referrer?: ProfileSummary | ProfileSummary[] | null
  referee?: ProfileSummary | ProfileSummary[] | null
}

type StaffReferralRow = {
  id: string
  referrer_id: string
  referee_id: string
  business_id: string | null
  status: ReferralWithProfiles['status']
  approved_by: string | null
  approved_at: string | null
  created_at: string
  referrer_full_name: string | null
  referrer_email: string | null
  referee_full_name: string | null
  referee_email: string | null
}

type ReferralCreateResult =
  | { status: 'created'; referral: Record<string, unknown> }
  | { status: 'skipped'; reason: 'duplicate' | 'missing-referrer' | 'self-referral' | 'cross-business' }

function firstProfile(value: ProfileSummary | ProfileSummary[] | null | undefined): ProfileSummary {
  const profile = Array.isArray(value) ? value[0] : value
  return {
    fullName: profile?.fullName ?? 'Unknown member',
    email: profile?.email ?? '',
  }
}

function mapReferral(row: ReferralRow): ReferralWithProfiles {
  const mapped = camelCaseRow(row)
  const rawReferrer = row.referrer
  const rawReferee = row.referee
  const referrer = Array.isArray(rawReferrer)
    ? rawReferrer.map((profile) => camelCaseRow(profile as unknown as Record<string, unknown>))[0]
    : rawReferrer
      ? camelCaseRow(rawReferrer as unknown as Record<string, unknown>)
      : null
  const referee = Array.isArray(rawReferee)
    ? rawReferee.map((profile) => camelCaseRow(profile as unknown as Record<string, unknown>))[0]
    : rawReferee
      ? camelCaseRow(rawReferee as unknown as Record<string, unknown>)
      : null

  return {
    id: mapped.id as string,
    referrerId: mapped.referrerId as string,
    refereeId: mapped.refereeId as string,
    businessId: (mapped.businessId as string | null) ?? null,
    status: mapped.status as ReferralWithProfiles['status'],
    approvedBy: (mapped.approvedBy as string | null) ?? null,
    approvedAt: (mapped.approvedAt as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    referrer: firstProfile(referrer as ProfileSummary | null),
    referee: firstProfile(referee as ProfileSummary | null),
  }
}

function mapStaffReferral(row: StaffReferralRow): ReferralWithProfiles {
  return {
    id: row.id,
    referrerId: row.referrer_id,
    refereeId: row.referee_id,
    businessId: row.business_id,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    referrer: {
      fullName: row.referrer_full_name || 'Unknown member',
      email: row.referrer_email || '',
    },
    referee: {
      fullName: row.referee_full_name || 'Unknown member',
      email: row.referee_email || '',
    },
  }
}

function generateSixDigitCode() {
  return (crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).toString().padStart(6, '0')
}

export const referralsService = {
  async generateCreditCode(profileId: string): Promise<string> {
    const sb = requireSupabase()
    const [{ data: profile }, { data: balance, error: balanceError }] = await Promise.all([
      sb
        .from('profiles')
        .select('verification_status')
        .eq('id', profileId)
        .single(),
      sb
        .from('reward_balances')
        .select('available_credits')
        .eq('profile_id', profileId)
        .single(),
    ])

    if (profile?.verification_status !== 'verified') {
      throw new Error('ID verification is required before using reward value actions.')
    }

    if (balanceError || !balance) {
      throw new Error('Balance not found.')
    }

    const availableCredits = Number(balance.available_credits ?? 0)
    if (availableCredits <= 0) {
      throw new Error('No Reward Credits are available for this member.')
    }

    const { error: expireError } = await sb
      .from('credit_redemptions')
      .update({ status: 'expired' })
      .eq('profile_id', profileId)
      .eq('status', 'pending')

    if (expireError) {
      throw new Error(expireError.message)
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateSixDigitCode()
      const { error: insertError } = await sb.from('credit_redemptions').insert({
        profile_id: profileId,
        code,
        expires_at: expiresAt,
      })

      if (!insertError) {
        return code
      }

      if (insertError.code !== '23505') {
        throw new Error(insertError.message)
      }
    }

    throw new Error('Could not generate a unique redemption code. Please try again.')
  },

  async validateCreditCode(code: string, businessId: string): Promise<{ profileId: string }> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('redeem_credit_code', {
      code,
      business_id: businessId,
    })

    if (error) throw new Error(friendlySupabaseError(error, 'Failed to redeem reward credit code.'))

    const row = Array.isArray(data) ? data[0] : data
    const profileId = (row as { profile_id?: string } | null)?.profile_id
    if (!profileId) throw new Error('Reward credit code was redeemed but no member was returned.')

    return { profileId }
  },

  async createReferral(referrerCode: string, refereeId: string, businessId: string | null): Promise<ReferralCreateResult | null> {
    try {
      const sb = requireSupabase()
      const { data, error } = await sb.rpc('create_referral', {
        referrer_code: referrerCode,
        referee_id: refereeId,
        target_business_id: businessId,
      })

      if (error) {
        console.warn('Referral creation skipped:', error?.message)
        return null
      }

      const row = Array.isArray(data) ? data[0] : data
      const status = (row as { status?: string } | null)?.status
      const referralId = (row as { referral_id?: string | null } | null)?.referral_id ?? null

      if (status === 'created') {
        return { status: 'created', referral: { id: referralId } }
      }
      if (
        status === 'duplicate'
        || status === 'missing-referrer'
        || status === 'self-referral'
        || status === 'cross-business'
      ) {
        return { status: 'skipped', reason: status }
      }

      return null
    } catch (error) {
      console.warn('Referral creation skipped:', error)
      return null
    }
  },

  async getPendingReferrals(businessId: string): Promise<ReferralWithProfiles[]> {
    const sb = requireSupabase()
    const { data: rpcData, error: rpcError } = await sb.rpc('get_staff_referrals', {
      target_business_id: businessId,
    })

    if (rpcError) {
      throw new Error('Failed to load pending referrals.')
    }

    return ((rpcData ?? []) as StaffReferralRow[])
        .filter((row) => row.status === 'pending' && row.business_id === businessId)
        .map(mapStaffReferral)
  },

  async getAllReferrals(): Promise<ReferralWithProfiles[]> {
    const sb = requireSupabase()
    const { data: rpcData, error: rpcError } = await sb.rpc('get_staff_referrals', {
      target_business_id: null,
    })

    if (rpcError) {
      throw new Error('Failed to load referrals.')
    }

    return ((rpcData ?? []) as StaffReferralRow[]).map(mapStaffReferral)
  },

  async getReferralForReferee(profileId: string): Promise<ReferralWithProfiles | null> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey(full_name,email),
        referee:profiles!referrals_referee_id_fkey(full_name,email)
      `)
      .eq('referee_id', profileId)
      .maybeSingle()

    if (error) {
      throw new Error('Failed to load referral status.')
    }

    return data ? mapReferral(data as ReferralRow) : null
  },

  async approveReferral(referralId: string, approverId: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.rpc('approve_referral', {
      referral_id: referralId,
      approver_id: approverId,
    })

    if (error) throw new Error(friendlySupabaseError(error, 'Failed to approve referral.'))
  },

  async rejectReferral(referralId: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.rpc('reject_referral', {
      referral_id: referralId,
    })

    if (error) throw new Error(error.message)
  },

  async useCredit(profileId: string, actorName: string): Promise<void> {
    const sb = requireSupabase()
    void actorName
    const { error } = await sb.rpc('consume_reward_credit', {
      p_profile_id: profileId,
    })

    if (error) {
      throw new Error(friendlySupabaseError(error, 'Failed to use reward credit.'))
    }
  },
}
