import {
  Gift,
  ShoppingCart,
  LogOut,
  WalletCards,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { CustomerBottomNav } from '@/components/customer-bottom-nav'
import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { VerificationStatusPill } from '@/features/membership/components/verification-status-pill'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { getInitials } from '@/lib/utils'

const legalLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/reward-terms', label: 'Reward Terms' },
  { to: '/verification-policy', label: 'Verification Policy' },
]

const customerNavigation = [
  { to: '/dashboard', label: 'Home' },
  { to: '/shop', label: 'Businesses' },
  { to: '/gift-cards', label: 'Gift Cards' },
  { to: '/profile', label: 'Member QR' },
  { to: '/activity', label: 'Activity' },
]

export function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const cart = useCart()
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const cartCount = (cart.data ?? []).reduce((sum, item) => sum + item.quantity, 0)
  const compactGiftCardAction = pathname.startsWith('/gift-cards')
    ? { to: '/wallet/gift-cards', label: 'My Gift Cards', icon: WalletCards }
    : { to: '/gift-cards', label: 'Gift Cards', icon: Gift }
  const CompactGiftCardIcon = compactGiftCardAction.icon

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="fixed inset-x-0 top-0 z-50 shrink-0 border-b border-[var(--border)] bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full items-center justify-between gap-3 px-4 py-2 sm:px-5 md:px-6 2xl:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-4 xl:gap-10">
            <NavLink to="/dashboard" className="flex min-w-0 items-center gap-3">
              <BrandLogo
                markClassName="h-9"
                textClassName="max-w-28 text-lg text-[var(--foreground)] sm:max-w-none sm:text-xl"
              />
            </NavLink>

            <nav className="hidden items-center gap-0.5 xl:flex">
              {customerNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-2.5 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[var(--muted)] text-[var(--foreground)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                    }`
                  }
                >
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 xl:gap-5">
            <div className="hidden flex-col items-end xl:flex">
              <span className="text-sm font-semibold text-[var(--foreground)]">{profile?.fullName}</span>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Member')}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
              <VerificationStatusPill status={profile?.verificationStatus} className="hidden xl:inline-flex" />
              <NavLink
                to={compactGiftCardAction.to}
                className="relative rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] xl:hidden"
                aria-label={t(compactGiftCardAction.label)}
                title={t(compactGiftCardAction.label)}
              >
                <CompactGiftCardIcon className="size-5" />
              </NavLink>
              <NavLink
                to="/cart"
                className="relative rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label={t('View cart')}
              >
                <ShoppingCart className="size-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                ) : null}
              </NavLink>
              <LanguagePicker className="text-[var(--muted-foreground)]" compact />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)] xl:hidden"
                onClick={() => void signOut()}
                title={t('Sign out')}
                aria-label={t('Sign out')}
              >
                <LogOut className="size-5" />
              </Button>

              <Avatar className="hidden size-10 rounded-lg border border-[var(--border)] xl:flex">
                <AvatarFallback className="rounded-lg bg-[var(--muted)] font-semibold text-[var(--foreground)]">
                  {getInitials(profile?.fullName ?? 'CC')}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                size="icon"
                className="hidden text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] xl:inline-flex"
                onClick={() => void signOut()}
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-5 pb-32 pt-24 md:px-8 lg:px-10 xl:pb-8 2xl:px-12">
        <div className="mx-auto w-full">
        <Outlet />
        </div>
      </main>

      <CustomerBottomNav verificationStatus={profile?.verificationStatus} />

      <footer className="border-t border-[var(--border)] bg-card py-12">
        <div className="mx-auto w-full px-6 2xl:px-10">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
              <BrandLogo markClassName="h-10" textClassName="text-lg text-[var(--foreground)]" />
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {t('Use one member QR across partner businesses and keep every recorded purchase connected to your account.')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 sm:grid-cols-4">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Platform')}
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/shop" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Partner Map')}</NavLink>
                  <NavLink to="/gift-cards" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Gift Cards')}</NavLink>
                  <NavLink to="/profile" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Member QR')}</NavLink>
                  <NavLink to="/activity" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Activity')}</NavLink>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Company')}
                </span>
                <nav className="flex flex-col gap-2">
                  <span className="text-sm text-[var(--muted-foreground)]">{t('About Us')}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{t('Contact')}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{t('Store Locator')}</span>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Account')}
                </span>
                <nav className="flex flex-col gap-2">
                  <NavLink to="/profile" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Settings')}</NavLink>
                  <NavLink to="/orders" className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{t('Order History')}</NavLink>
                </nav>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {t('Legal')}
                </span>
                <nav className="flex flex-col gap-2">
                  {legalLinks.map((link) => (
                    <NavLink key={link.to} to={link.to} className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
                      {t(link.label)}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--muted-foreground)]">
          </div>
        </div>
      </footer>
    </div>
  )
}
