import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useLanguage } from '@/lib/language'

export function OfflineNotice() {
  const { t } = useLanguage()
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed inset-x-3 top-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-warning/25 bg-card px-4 py-3 text-card-foreground shadow-luxe sm:inset-x-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <WifiOff className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--foreground)]">{t('You are offline')}</p>
          <p className="mt-1 text-sm leading-5 text-[var(--muted-foreground)]">
            {t('Guatemala Rewards needs internet for account data, QR sale recording, rewards, and admin operations. Reconnect to continue.')}
          </p>
        </div>
      </div>
    </div>
  )
}
