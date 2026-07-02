import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

const navigation = [
  { to: '/guide', label: 'Guia' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/business', label: 'For Businesses' },
]

const legalLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/reward-terms', label: 'Reward Terms' },
  { to: '/verification-policy', label: 'Verification Policy' },
]

export function PublicBrowseLayout() {
  const { t } = useLanguage()
  const location = useLocation()
  const isBusinessOnboarding = location.pathname === '/business'

  return (
    <div className="soft-luxe-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-primary/15 bg-card/88 shadow-soft backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8 2xl:px-12">
          <div className="flex min-w-0 flex-1 items-center gap-5 xl:gap-10">
            <NavLink to="/" className="flex min-w-0 shrink-0 items-center gap-3">
              <span className="truncate font-serif text-xl font-semibold text-primary-container sm:text-2xl">
                Guatemala Rewards
              </span>
              <span className="hidden h-6 w-px bg-[var(--border)] xl:block" />
              <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary-container)] xl:block">
                Golden Circle
              </span>
            </NavLink>

            <nav className="hidden min-w-0 flex-wrap items-center gap-2 lg:flex xl:gap-5">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-2 text-xs font-bold transition-colors xl:text-sm ${
                      isActive
                        ? 'luxe-chip-active'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`
                  }
                >
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguagePicker className="hidden text-[var(--muted-foreground)] sm:inline-flex" compact />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            {isBusinessOnboarding ? (
              <>
                <Button asChild variant="secondary" size="sm">
                  <a href="#book-demo">{t('Start Onboarding')}</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <NavLink to="/business/login">{t('Business Login')}</NavLink>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="secondary" size="sm">
                  <NavLink to="/join">
                    <span className="hidden sm:inline">{t('Join Rewards Club')}</span>
                    <span className="sm:hidden">{t('Join')}</span>
                  </NavLink>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <NavLink to="/signin">{t('Sign In')}</NavLink>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-10 lg:px-8 2xl:px-12">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-primary/15 bg-card px-4 py-8 sm:px-6 lg:px-8 2xl:px-12">
        <div className="mx-auto flex w-full flex-col justify-between gap-4 text-sm text-[var(--muted-foreground)] md:flex-row md:items-center">
          <span className="font-semibold text-[var(--foreground)]">Guatemala Rewards</span>
          <nav className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className="transition-colors hover:text-[var(--foreground)]">
                {t(link.label)}
              </NavLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
