import type { Activity } from '@/types/domain'
import { requireSupabase, camelCaseRow } from './shared'

export const activityService = {
  async getActivities(profileId: string): Promise<Activity[]> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('activities')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Failed to load activities.')

    return (data as Record<string, unknown>[]).map((row) => {
      const mapped = camelCaseRow(row)
      return {
        id: mapped.id as string,
        profileId: mapped.profileId as string,
        type: mapped.type as Activity['type'],
        title: mapped.title as string,
        description: mapped.description as string,
        points: mapped.points as number,
        createdAt: mapped.createdAt as string,
        status: mapped.status as Activity['status'],
      }
    })
  },
}
