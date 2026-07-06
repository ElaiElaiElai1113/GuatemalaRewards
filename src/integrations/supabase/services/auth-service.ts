import type { Membership, Profile, UserRole } from '@/types/domain'
import type { AuthFormValues, MemberSignUpSubmission } from '@/types/forms'
import { requireSupabase, camelCaseRow } from './shared'

let pendingSignInRole: AuthFormValues['role'] | null = null

function getUrlTokenParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }

  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.get('type') === 'recovery') {
    return searchParams
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash

  return new URLSearchParams(hash)
}

function clearRecoveryParamsFromUrl() {
  if (typeof window === 'undefined') return

  const nextUrl = new URL(window.location.href)
  nextUrl.hash = ''
  ;[
    'access_token',
    'refresh_token',
    'expires_at',
    'expires_in',
    'token_type',
    'type',
    'code',
  ].forEach((key) => {
    nextUrl.searchParams.delete(key)
  })

  window.history.replaceState({}, document.title, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
}

function getPublicSiteUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim()
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '')
  }

  return typeof window === 'undefined' ? '' : window.location.origin
}

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

async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const sb = requireSupabase()

  const [{ data: row, error }, { data: membershipRow }] = await Promise.all([
    sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    sb
      .from('memberships')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle(),
  ])

  if (error || !row) return null
  return {
    ...(camelCaseRow(row) as unknown as Profile),
    membership: membershipRow ? mapMembership(membershipRow as Record<string, unknown>) : null,
  }
}

function profileMatchesRequestedRole(
  profile: Profile,
  requestedRole: AuthFormValues['role'],
) {
  if (requestedRole === 'customer') {
    return profile.role === 'customer'
  }

  if (requestedRole === 'platform-admin') {
    return profile.role === 'platform-admin'
  }

  return profile.role === 'business-owner' || profile.role === 'business-staff'
}

export const authService = {
  async getProfileForUserId(userId: string): Promise<Profile | null> {
    return getProfileByUserId(userId)
  },

  async getSessionProfile(): Promise<Profile | null> {
    const sb = requireSupabase()

    const { data: { session } } = await sb.auth.getSession()
    if (!session) return null

    return getProfileByUserId(session.user.id)
  },

  async signIn(input: AuthFormValues): Promise<Profile> {
    const sb = requireSupabase()
    const email = input.email.trim().toLowerCase()
    pendingSignInRole = input.role

    const { data, error: authError } = await sb.auth.signInWithPassword({
      email,
      password: input.password,
    })

    if (authError) {
      pendingSignInRole = null
      throw new Error(authError.message)
    }

    const userId = data.user?.id
    if (!userId) {
      pendingSignInRole = null
      throw new Error('Sign-in succeeded but the session user could not be loaded.')
    }

    const profile = await getProfileByUserId(userId)
    if (!profile) {
      await sb.auth.signOut()
      throw new Error('Profile not found. Try creating an account first.')
    }

    const isBusinessPortalSignIn =
      input.role === 'business-owner' || input.role === 'business-staff'
    const isAllowedBusinessRole =
      profile.role === 'business-owner' || profile.role === 'business-staff'

    if (isBusinessPortalSignIn && !isAllowedBusinessRole) {
      await sb.auth.signOut()
      throw new Error('This account does not have access to the business portal.')
    }

    if (input.role === 'platform-admin' && profile.role !== 'platform-admin') {
      await sb.auth.signOut()
      throw new Error('This account does not have access to the admin portal.')
    }

    if (input.role === 'customer' && profile.role !== 'customer') {
      await sb.auth.signOut()
      throw new Error('This sign-in page is for customer accounts only.')
    }

    if (!isBusinessPortalSignIn && profile.role !== input.role) {
      await sb.auth.signOut()
      throw new Error(`This account is a ${profile.role}, not a ${input.role}.`)
    }

    return profile
  },

  async signUp(input: MemberSignUpSubmission): Promise<Profile> {
    const sb = requireSupabase()

    const name = input.fullName?.trim()
    const email = input.email.trim().toLowerCase()
    const phone = input.phone.trim()
    if (!name) {
      throw new Error('Enter your full name to create an account.')
    }
    if (!phone) {
      throw new Error('Enter your WhatsApp or phone number to create an account.')
    }

    const { data, error: authError } = await sb.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          full_name: name,
          phone,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('That email already exists. Try signing in instead.')
      }
      if (authError.message.includes('Database error saving new user')) {
        throw new Error('Account could not be created. Please check your details and try again.')
      }
      throw new Error(authError.message)
    }

    // Auth trigger creates profile & balance automatically.
    // Fetch the profile that was just created.
    const userId = data.user?.id
    if (!userId) {
      throw new Error('Account created but the session user could not be loaded. Please sign in.')
    }

    const profile = await getProfileByUserId(userId)
    if (!profile) {
      throw new Error('Account created but profile could not be loaded. Please sign in.')
    }

    return profile
  },

  async continueAsDemo(role: UserRole): Promise<Profile> {
    void role
    throw new Error(
      'Demo mode is not available with the live database. Please sign in or create an account.',
    )
  },

  async resetPassword(email: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${getPublicSiteUrl()}/reset-password`,
    })

    if (error) throw error
  },

  async updatePassword(password: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.auth.updateUser({
      password,
    })

    if (error) throw error
  },

  async signOut(): Promise<void> {
    const sb = requireSupabase()
    await sb.auth.signOut()
  },

  async ensureRecoverySession(): Promise<boolean> {
    const sb = requireSupabase()
    const params = getUrlTokenParams()
    const recoveryType = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (recoveryType === 'recovery' && accessToken && refreshToken) {
      const { error } = await sb.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        throw error
      }

      clearRecoveryParamsFromUrl()
      return true
    }

    const {
      data: { session },
    } = await sb.auth.getSession()

    return Boolean(session)
  },

  getPendingSignInRole(): AuthFormValues['role'] | null {
    return pendingSignInRole
  },

  clearPendingSignInRole() {
    pendingSignInRole = null
  },

  isProfileAllowedForRole(profile: Profile, requestedRole: AuthFormValues['role']) {
    return profileMatchesRequestedRole(profile, requestedRole)
  },
}
