import type { Profile, RewardBalance } from '@/types/domain'
import type { MemberVerificationSubmission, ProfileFormValues } from '@/types/forms'
import {
  getVerificationDocumentExtension,
  MEMBER_VERIFICATION_BUCKET,
  validateVerificationDocument,
} from '@/lib/member-verification'
import { requireSupabase, camelCaseRow } from './shared'

function toTierProgress(points: number, nextRewardPoints: number) {
  return Math.max(0, Math.min(100, Math.round((points / nextRewardPoints) * 100)))
}

export const profileService = {
  async getProfile(profileId: string): Promise<Profile | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error || !data) return null
    return camelCaseRow(data) as unknown as Profile
  },

  async getRewardBalance(profileId: string): Promise<RewardBalance | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('reward_balances')
      .select('*')
      .eq('profile_id', profileId)
      .single()

    if (error || !data) return null

    const mapped = camelCaseRow(data) as Record<string, unknown>
    return {
      profileId: mapped.profileId as string,
      points: mapped.points as number,
      nextRewardPoints: mapped.nextRewardPoints as number,
      availableCredits: mapped.availableCredits as number,
      tierProgress: toTierProgress(mapped.points as number, mapped.nextRewardPoints as number),
    }
  },

  async updateProfile(profileId: string, values: ProfileFormValues): Promise<Profile> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('update_own_profile', {
      p_full_name: values.fullName,
      p_phone: values.phone,
      p_location: values.location,
      p_favorite_order: values.favoriteOrder,
    })

    if (error || !data) {
      throw new Error('Failed to update profile.')
    }

    const row = Array.isArray(data) ? data[0] : data
    const profile = camelCaseRow(row as Record<string, unknown>) as unknown as Profile
    if (profile.id !== profileId) {
      throw new Error('Profile update returned the wrong member.')
    }

    return profile
  },

  async submitVerification(values: MemberVerificationSubmission): Promise<Profile> {
    const sb = requireSupabase()
    const verificationIdNumber = values.verificationIdNumber.trim()
    const documentError = validateVerificationDocument(values.verificationDocument)

    if (!verificationIdNumber) {
      throw new Error('Enter the ID number shown on your verification document.')
    }

    if (documentError) {
      throw new Error(documentError)
    }

    const extension = getVerificationDocumentExtension(values.verificationDocument)
    const documentPath = `pending/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await sb.storage
      .from(MEMBER_VERIFICATION_BUCKET)
      .upload(documentPath, values.verificationDocument, {
        contentType: values.verificationDocument.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`The ID document could not be uploaded: ${uploadError.message}`)
    }

    const { data, error } = await sb.rpc('submit_member_verification', {
      p_verification_id_number: verificationIdNumber,
      p_verification_document_path: documentPath,
      p_verification_document_filename: values.verificationDocument.name,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to submit verification.')
    }

    const row = Array.isArray(data) ? data[0] : data
    return camelCaseRow(row as Record<string, unknown>) as unknown as Profile
  },

  async ensureBalance(profileId: string): Promise<RewardBalance> {
    const existing = await this.getRewardBalance(profileId)
    if (existing) return existing

    const sb = requireSupabase()

    const { data, error } = await sb
      .from('reward_balances')
      .insert({ profile_id: profileId })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to create balance.')
    }

    const mapped = camelCaseRow(data) as Record<string, unknown>
    return {
      profileId: mapped.profileId as string,
      points: mapped.points as number,
      nextRewardPoints: mapped.nextRewardPoints as number,
      availableCredits: mapped.availableCredits as number,
      tierProgress: 0,
    }
  },
}
