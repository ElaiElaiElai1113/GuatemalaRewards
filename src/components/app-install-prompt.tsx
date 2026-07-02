import { Download, Smartphone, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

declare global {
  interface Navigator {
    standalone?: boolean
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const installPromptDismissedKey = 'guatemalarewardsInstallPromptDismissed'

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  )
}

function isIosSafari() {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)

  return isIos && isSafari
}

export function AppInstallPrompt() {
  const { t } = useLanguage()
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(() =>
    typeof window === 'undefined' ? true : window.localStorage.getItem(installPromptDismissedKey) === 'true',
  )
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay)
  const showIosInstructions = useMemo(() => isIosSafari(), [])

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setIsStandalone(true)
      setInstallEvent(null)
      window.localStorage.setItem(installPromptDismissedKey, 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (isStandalone || isDismissed || (!installEvent && !showIosInstructions)) return null

  const dismissPrompt = () => {
    setIsDismissed(true)
    window.localStorage.setItem(installPromptDismissedKey, 'true')
  }

  const installApp = async () => {
    if (!installEvent) return

    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    dismissPrompt()
  }

  return (
    <aside className="fixed inset-x-3 bottom-4 z-[60] mx-auto max-w-md rounded-2xl border border-primary/15 bg-card p-4 text-card-foreground shadow-luxe sm:right-5 sm:left-auto sm:mx-0">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{t('Install Guatemala Rewards')}</p>
              <p className="mt-1 text-sm leading-5 text-[var(--muted-foreground)]">
                {showIosInstructions && !installEvent
                  ? t('On iPhone, tap Share, then Add to Home Screen to use this like an app.')
                  : t('Add this app to your phone home screen for quick access to QR, business, and admin tools.')}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-[var(--muted-foreground)]"
              onClick={dismissPrompt}
              aria-label={t('Dismiss install prompt')}
            >
              <X className="size-4" />
            </Button>
          </div>

          {installEvent ? (
            <Button type="button" className="mt-3 w-full rounded-xl" onClick={() => void installApp()}>
              <Download className="size-4" />
              {t('Install app')}
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
