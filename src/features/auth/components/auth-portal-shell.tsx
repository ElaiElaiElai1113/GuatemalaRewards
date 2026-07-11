import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { useLanguage } from '@/lib/language'

type AuthPortalShellProps = {
  activeTab?: 'signin' | 'signup'
  children: ReactNode
  showTabs?: boolean
}

function tabClass(isActive: boolean) {
  return [
    'flex h-10 flex-1 items-center justify-center rounded-[9px] text-[13px] font-semibold transition',
    isActive
      ? 'bg-[#d1ad4a] text-[#060606]'
      : 'text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--surface-container-highest)_34%,transparent)] hover:text-[#d1ad4a]',
  ].join(' ')
}

export function AuthPortalShell({ activeTab, children, showTabs = true }: AuthPortalShellProps) {
  const { t } = useLanguage()

  return (
    <main className="auth-portal-shell relative flex min-h-screen items-start justify-center overflow-hidden bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6">
      <div
        className="auth-portal-backdrop pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, color-mix(in srgb, var(--champagne) 30%, transparent) 0%, color-mix(in srgb, var(--surface-container-highest) 58%, transparent) 34%, color-mix(in srgb, var(--surface-container-lowest) 88%, transparent) 76%), linear-gradient(135deg, var(--surface-container-lowest) 0%, var(--background) 46%, var(--surface-container-low) 100%)',
        }}
      />
      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center">
        <div className="mb-4 flex w-full items-center justify-between gap-3 text-[var(--foreground)]">
          <Link
            to="/landing-page"
            className="inline-flex min-h-9 items-center gap-2 rounded-[8px] border border-[#d1ad4a]/35 bg-[color-mix(in_srgb,var(--surface-container-lowest)_82%,transparent)] px-3 text-[12px] font-semibold text-[#d1ad4a] transition hover:bg-[#d1ad4a] hover:text-[#060606]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('Back')}
          </Link>
          <div className="flex items-center gap-2">
          <LanguagePicker className="text-current" compact />
          <ThemeToggle className="border border-[#d1ad4a]/45 bg-[color-mix(in_srgb,var(--surface-container-lowest)_86%,transparent)] text-[#d1ad4a] hover:bg-[#d1ad4a] hover:text-[#060606]" />
          </div>
        </div>

        {showTabs ? (
          <nav className="grid h-[42px] w-full grid-cols-2 rounded-[10px] border border-[#d1ad4a] bg-[color-mix(in_srgb,var(--surface-container-lowest)_94%,var(--espresso))] p-0">
            <Link to="/signin" className={tabClass(activeTab === 'signin')}>
              {t('Sign in')}
            </Link>
            <Link to="/join" className={tabClass(activeTab === 'signup')}>
              {t('Create account')}
            </Link>
          </nav>
        ) : null}

        <section className={`${showTabs ? 'mt-8' : 'mt-4'} w-full rounded-[12px] border border-[#d1ad4a] bg-[color-mix(in_srgb,var(--surface-container-lowest)_94%,var(--espresso))] px-8 pb-9 pt-9 text-[var(--foreground)] shadow-[0_18px_60px_rgba(0,0,0,0.25)] sm:px-8`}>
          {children}
        </section>
      </div>
    </main>
  )
}
