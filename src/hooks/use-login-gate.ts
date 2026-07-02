import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/use-auth'

export function useLoginGate() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return function requireAuth(action: () => void) {
    if (profile) {
      action()
      return
    }

    navigate(`/signin?redirect=${encodeURIComponent(location.pathname)}`)
  }
}
