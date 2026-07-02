import {
  getPendingRequiredAgreements,
  hasCompletedRequiredAgreements,
} from '@/lib/agreement-requirements'
import type {
  AgreementAcceptance,
  AgreementKind,
  AgreementVersion,
  Profile,
  RequiredAgreementStatus,
  UserRole,
} from '@/types/domain'
import type { SignAgreementFormValues } from '@/types/forms'
import { requireSupabase } from './shared'

type AgreementVersionRow = {
  id: string
  kind: AgreementKind
  required_role: UserRole | null
  business_id: string | null
  version: number
  title: string
  body: string
  content_hash: string
  is_active: boolean
  effective_at: string
}

type AgreementAcceptanceRow = {
  id: string
  profile_id: string
  business_id: string | null
  agreement_version_id: string
  agreement_kind: AgreementKind
  agreement_version: number
  content_hash: string
  typed_signature: string
  signature_svg: string | null
  accepted_electronic_records: boolean
  accepted_terms: boolean
  signed_at: string
}

export type SignAgreementInput = SignAgreementFormValues & {
  agreementVersionId: string
}

function toAgreementVersion(row: AgreementVersionRow): AgreementVersion {
  return {
    id: row.id,
    kind: row.kind,
    requiredRole: row.required_role,
    businessId: row.business_id,
    version: row.version,
    title: row.title,
    body: row.body,
    contentHash: row.content_hash,
    isActive: row.is_active,
    effectiveAt: row.effective_at,
  }
}

function toAgreementAcceptance(row: AgreementAcceptanceRow): AgreementAcceptance {
  return {
    id: row.id,
    profileId: row.profile_id,
    businessId: row.business_id,
    agreementVersionId: row.agreement_version_id,
    agreementKind: row.agreement_kind,
    agreementVersion: row.agreement_version,
    contentHash: row.content_hash,
    typedSignature: row.typed_signature,
    signatureSvg: row.signature_svg,
    acceptedElectronicRecords: row.accepted_electronic_records,
    acceptedTerms: row.accepted_terms,
    signedAt: row.signed_at,
  }
}

export const legalService = {
  async getRequiredAgreements(profile: Profile): Promise<RequiredAgreementStatus> {
    if (profile.role === 'platform-admin') {
      return {
        pendingAgreements: [],
        activeAgreements: [],
        acceptances: [],
        isComplete: true,
      }
    }

    const sb = requireSupabase()

    const [versionsResult, acceptancesResult] = await Promise.all([
      sb
        .from('agreement_versions')
        .select('*')
        .eq('is_active', true)
        .order('kind', { ascending: true })
        .order('version', { ascending: false }),
      sb
        .from('agreement_acceptances')
        .select('*')
        .eq('profile_id', profile.id),
    ])

    if (versionsResult.error) {
      throw new Error('Failed to load required agreements.')
    }

    if (acceptancesResult.error) {
      throw new Error('Failed to load agreement signatures.')
    }

    const activeAgreements = ((versionsResult.data ?? []) as AgreementVersionRow[]).map(toAgreementVersion)
    const acceptances = ((acceptancesResult.data ?? []) as AgreementAcceptanceRow[]).map(toAgreementAcceptance)
    const pendingAgreements = getPendingRequiredAgreements({
      role: profile.role,
      businessId: profile.businessId,
      activeAgreements,
      acceptances,
    })

    return {
      pendingAgreements,
      activeAgreements,
      acceptances,
      isComplete: hasCompletedRequiredAgreements(pendingAgreements),
    }
  },

  async signAgreement(input: SignAgreementInput): Promise<AgreementAcceptance> {
    const sb = requireSupabase()
    const { data, error } = await sb.functions.invoke('sign-agreement', {
      body: input,
    })

    if (error) {
      throw new Error(error.message)
    }

    const acceptance = (data as { acceptance?: AgreementAcceptanceRow } | null)?.acceptance
    if (!acceptance) {
      throw new Error('Agreement signature was not returned.')
    }

    return toAgreementAcceptance(acceptance)
  },
}
