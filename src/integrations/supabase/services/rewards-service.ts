import { createClientRequestId, isPickupWindow } from '@/features/critical-flows/critical-flow'
import type { Redemption, Reward } from '@/types/domain'
import type { RedeemFormValues, RewardDraftFormValues } from '@/types/forms'
import { camelCaseRow, friendlySupabaseError, requireSupabase, snakeCaseObj } from './shared'

interface RedeemInput extends RedeemFormValues {
  profileId: string
  rewardId: string
}

export const rewardsService = {
  async getRewards(businessId?: string): Promise<Reward[]> {
    const sb = requireSupabase()

    let query = sb.from('rewards').select('*')
    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load rewards.')

    return (data as Record<string, unknown>[])
      .map((row) => camelCaseRow(row) as unknown as Reward)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
  },

  async getRewardById(rewardId: string): Promise<Reward | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single()

    if (error || !data) return null
    return camelCaseRow(data) as unknown as Reward
  },

  async redeemReward(input: RedeemInput): Promise<Redemption> {
    const sb = requireSupabase()

    if (!isPickupWindow(input.pickupWindow)) {
      throw new Error('Invalid pickup window.')
    }

    const { data, error } = await sb.rpc('redeem_reward', {
      p_reward_id: input.rewardId,
      p_pickup_window: input.pickupWindow,
      p_notes: input.notes ?? null,
      p_client_request_id: createClientRequestId(),
    })

    const redemptionRow = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (error || !redemptionRow) {
      throw new Error(friendlySupabaseError(error, 'Failed to create redemption.'))
    }

    const mapped = camelCaseRow(redemptionRow)
    if (mapped.profileId !== input.profileId) {
      throw new Error('Reward was redeemed for the wrong member.')
    }

    return {
      id: mapped.id as string,
      profileId: mapped.profileId as string,
      rewardId: mapped.rewardId as string,
      rewardTitle: mapped.rewardTitle as string,
      pointsCost: mapped.pointsCost as number,
      notes: mapped.notes as string | undefined,
      redeemedAt: mapped.redeemedAt as string,
      status: mapped.status as 'ready' | 'fulfilled',
    }
  },

  async createReward(
    values: RewardDraftFormValues,
    actorName = 'Business Owner',
  ): Promise<Reward> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('rewards')
      .insert({ ...snakeValues, inventory: 30, featured: false })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create reward.')
    }

    const reward = camelCaseRow(data) as unknown as Reward

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Reward created',
      details: `Added ${reward.title} to the catalog.`,
    })

    if (logError) {
      throw new Error(logError.message)
    }

    return reward
  },

  async deleteReward(rewardId: string, actorName = 'Platform Admin'): Promise<void> {
    const sb = requireSupabase()

    const reward = await this.getRewardById(rewardId)
    if (!reward) return

    const { error } = await sb.from('rewards').delete().eq('id', rewardId)

    if (error) {
      throw new Error(error.message)
    }

    await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Reward deleted',
      details: `Removed ${reward.title} from the catalog.`,
    })
  },

  async updateReward(
    rewardId: string,
    values: Partial<RewardDraftFormValues>,
    actorName = 'Platform Admin',
  ): Promise<Reward> {
    const sb = requireSupabase()
    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('rewards')
      .update(snakeValues)
      .eq('id', rewardId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update reward.')
    }

    const reward = camelCaseRow(data) as unknown as Reward

    await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Reward updated',
      details: `Updated details for ${reward.title}.`,
    })

    return reward
  },
}
