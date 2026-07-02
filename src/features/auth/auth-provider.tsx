import { type ReactNode, useEffect, useState } from 'react'

import { AuthContext, type SignUpResult } from '@/features/auth/auth-context'
import { authService } from '@/integrations/supabase/services/auth-service'
import { partnerService } from '@/integrations/supabase/services/partner-service'
import { referralsService } from '@/integrations/supabase/services/referrals-service'
import { supabase } from '@/integrations/supabase/client'
import { getSignOutRedirectPath } from '@/lib/auth-navigation'
import { queryClient } from '@/lib/query-client'
import type { Profile, SessionUser, UserRole } from '@/types/domain'
import type { AuthFormValues, MemberSignUpSubmission } from '@/types/forms'

interface AuthProviderProps {
  children: ReactNode
}

async function createPendingReferralForProfile(profile: Profile) {
  const referralCode = sessionStorage.getItem('referralCode')
  if (!referralCode || referralCode === profile.id || referralCode === profile.referralCode) return null

  const referralBusinessId = sessionStorage.getItem('referralBusinessId')
  const result = await referralsService.createReferral(referralCode, profile.id, referralBusinessId ?? null)
  if (result) {
    sessionStorage.removeItem('referralCode')
    sessionStorage.removeItem('referralBusinessId')
  }
  return result
}

async function createPendingPartnerReferralForProfile(profile: Profile) {
  const partnerCode = sessionStorage.getItem('partnerReferrerCode')
  const partnerBusinessId = sessionStorage.getItem('partnerBusinessId')
  if (!partnerCode || !partnerBusinessId || profile.role !== 'customer') return

  await partnerService.attributePartnerReferral(partnerCode, profile.id, partnerBusinessId)
  sessionStorage.removeItem('partnerReferrerCode')
  sessionStorage.removeItem('partnerBusinessId')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    function syncSession(nextProfile: Profile | null) {
      if (!isActive) return

      setProfile(nextProfile)
      setSession(
        nextProfile
          ? {
              profileId: nextProfile.id,
              role: nextProfile.role,
              businessId: nextProfile.businessId,
            }
          : null,
      )
    }

    function finishLoading() {
      if (isActive) {
        setIsLoading(false)
      }
    }

    function handleResolvedProfile(nextProfile: Profile | null) {
      syncSession(nextProfile)
      finishLoading()
    }

    function handleProfileError(context: string, error: unknown) {
      console.error(context, error)
      syncSession(null)
      finishLoading()
    }

    const loadingFallback = window.setTimeout(() => {
      if (isActive) {
        setIsLoading(false)
      }
    }, 5000)

    void authService
      .getSessionProfile()
      .then((sessionProfile) => {
        handleResolvedProfile(sessionProfile)
      })
      .catch((error) => {
        handleProfileError('Failed to restore auth session:', error)
      })
      .finally(() => {
        window.clearTimeout(loadingFallback)
      })

    if (!supabase) {
      return () => {
        isActive = false
        window.clearTimeout(loadingFallback)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        authService.clearPendingSignInRole()
        queryClient.clear()
        syncSession(null)
        finishLoading()
        return
      }

      window.setTimeout(() => {
        void authService
          .getProfileForUserId(nextSession.user.id)
          .then((sessionProfile) => {
            if (!sessionProfile) {
              handleResolvedProfile(null)
              return
            }

            const pendingRole = authService.getPendingSignInRole()
            if (pendingRole && !authService.isProfileAllowedForRole(sessionProfile, pendingRole)) {
              void authService.signOut().finally(() => {
                queryClient.clear()
                syncSession(null)
                finishLoading()
              })
              return
            }

            if (pendingRole) {
              authService.clearPendingSignInRole()
            }

            handleResolvedProfile(sessionProfile)
          })
          .catch((error) => {
            handleProfileError('Failed to sync auth state:', error)
          })
      }, 0)
    })

    return () => {
      isActive = false
      window.clearTimeout(loadingFallback)
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    profile,
    session,
    isLoading,
    async signIn(values: AuthFormValues) {
      const sessionProfile = await authService.signIn(values)
      queryClient.clear()
      setProfile(sessionProfile)
      setSession({
        profileId: sessionProfile.id,
        role: sessionProfile.role,
        businessId: sessionProfile.businessId,
      })
      return sessionProfile
    },
    async signUp(values: MemberSignUpSubmission): Promise<SignUpResult> {
      const sessionProfile = await authService.signUp(values)
      const attributionWarnings: string[] = []

      try {
        const hadReferral = Boolean(sessionStorage.getItem('referralCode'))
        const referralResult = await createPendingReferralForProfile(sessionProfile)
        if (hadReferral && !referralResult) {
          attributionWarnings.push('We could not link your referral invite. Your account was created successfully.')
        }
      } catch (error) {
        console.warn('Pending referral creation skipped:', error)
        attributionWarnings.push('We could not link your referral invite. Your account was created successfully.')
      }

      try {
        await createPendingPartnerReferralForProfile(sessionProfile)
      } catch (error) {
        console.warn('Pending partner referral creation skipped:', error)
        attributionWarnings.push('We could not link your partner invite. Your account was created successfully.')
      }

      queryClient.clear()
      setProfile(sessionProfile)
      setSession({
        profileId: sessionProfile.id,
        role: sessionProfile.role,
        businessId: sessionProfile.businessId,
      })
      return {
        profile: sessionProfile,
        warning: attributionWarnings[0],
      }
    },
    async continueAsDemo(role: UserRole) {
      const sessionProfile = await authService.continueAsDemo(role)
      queryClient.clear()
      setProfile(sessionProfile)
      setSession({
        profileId: sessionProfile.id,
        role: sessionProfile.role,
        businessId: sessionProfile.businessId,
      })
      return sessionProfile
    },
    async signOut(options?: { redirectTo?: string; skipRedirect?: boolean }) {
      const redirectTo = options?.redirectTo ?? getSignOutRedirectPath(profile?.role)
      setIsLoading(true)
      try {
        await authService.signOut()
      } finally {
        queryClient.clear()
        setProfile(null)
        setSession(null)
        setIsLoading(false)

        if (!options?.skipRedirect && typeof window !== 'undefined') {
          window.location.replace(redirectTo)
        }
      }
    },
    syncProfile(nextProfile: Profile) {
      setProfile(nextProfile)
      setSession({
        profileId: nextProfile.id,
        role: nextProfile.role,
        businessId: nextProfile.businessId,
      })
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
