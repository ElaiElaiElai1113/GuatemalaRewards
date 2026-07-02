import type { Membership } from '@/types/domain'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

function mapMembership(row: Record<string, unknown>): Membership {
  const mapped = camelCaseRow(row)

  return {
    id: mapped.id as string,
    profileId: mapped.profileId as string,
    status: mapped.status as Membership['status'],
    currentPeriodStart: mapped.currentPeriodStart as string,
    currentPeriodEnd: mapped.currentPeriodEnd as string,
    cancelAtPeriodEnd: mapped.cancelAtPeriodEnd as boolean,
    priceCents: mapped.priceCents as number,
    currency: mapped.currency as string,
    provider: mapped.provider as string,
    providerSubscriptionId: (mapped.providerSubscriptionId as string | null) ?? null,
    lastCreditAt: (mapped.lastCreditAt as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
  }
}

async function callMembershipRpc(name: 'mock_subscribe' | 'mock_renew' | 'mock_cancel'): Promise<Membership> {
  const sb = requireSupabase()
  const { data, error } = await sb.rpc(name)
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null

  if (error || !row) {
    if (error?.message.includes(name) && error.message.includes('schema cache')) {
      throw new Error('Demo membership setup is not active on this database yet. Ask an admin to apply the latest Supabase membership migration.')
    }

    throw new Error(friendlySupabaseError(error, 'Membership update failed.'))
  }

  return mapMembership(row)
}

export const membershipService = {
  async getMyMembership(): Promise<Membership | null> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('memberships')
      .select('*')
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data ? mapMembership(data as Record<string, unknown>) : null
  },

  async mockSubscribe(): Promise<Membership> {
    return callMembershipRpc('mock_subscribe')
  },

  async mockRenew(): Promise<Membership> {
    return callMembershipRpc('mock_renew')
  },

  async mockCancel(): Promise<Membership> {
    return callMembershipRpc('mock_cancel')
  },
}
