import { createContext } from 'react'

import type { Profile, SessionUser, UserRole } from '@/types/domain'
import type { AuthFormValues, MemberSignUpSubmission } from '@/types/forms'

export interface SignUpResult {
  profile: Profile
  warning?: string
}

export interface AuthContextValue {
  profile: Profile | null
  session: SessionUser | null
  isLoading: boolean
  signIn: (values: AuthFormValues) => Promise<Profile>
  signUp: (values: MemberSignUpSubmission) => Promise<SignUpResult>
  continueAsDemo: (role: UserRole) => Promise<Profile>
  signOut: (options?: { redirectTo?: string; skipRedirect?: boolean }) => Promise<void>
  syncProfile: (profile: Profile) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
