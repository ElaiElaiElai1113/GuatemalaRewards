import {
  CreditCard,
  Hotel,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorPlay,
  Package,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { canAccessBusinessPath } from '@/lib/business-role-policy'
import { useLanguage } from '@/lib/language'
import { cn, getInitials } from '@/lib/utils'

const businessNavigationItems = [
  { to: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/business/gift-cards', label: 'Gift Cards', icon: CreditCard },
  { to: '/business/redemptions', label: 'Transactions', icon: CreditCard },
  { to: '/business/promotions', label: 'Promotions', icon: Sparkles },
  { to: '/business/members', label: 'Customers', icon: Users },
  { to: '/business/partners', label: 'Partners', icon: Hotel },
  { to: '/business/guide', label: 'Guia', icon: MonitorPlay },
  { to: '/business/settings', label: 'Settings', icon: Settings },
]

export function BusinessOwnerLayout() {
  const { profile, signOut } = useAuth()
  const { business, isBusinessLoading, error } = useBusinessOwnerData()
  const { t } = useLanguage()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  if (isBusinessLoading) {
    return (
      <div className="soft-luxe-shell flex min-h-screen items-center justify-center">
        <div className="absolute right-6 top-6">
          <LanguagePicker className="text-[var(--muted-foreground)]" />
        </div>
        <LoadingState
          title={t('Loading workspace')}
          description={t('Fetching your business portal data.')}
        />
      </div>
    )
  }

  if (profile?.role !== 'business-owner' && profile?.role !== 'business-staff') {
    return (
      <div className="soft-luxe-shell flex min-h-screen items-center justify-center">
        <div className="absolute right-6 top-6">
          <LanguagePicker className="text-[var(--muted-foreground)]" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">{t('Access Denied')}</h1>
          <p className="text-[var(--muted-foreground)]">{t('This area is for business owners only.')}</p>
          <Button onClick={() => (window.location.href = '/dashboard')}>{t('Return Home')}</Button>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="soft-luxe-shell flex min-h-screen items-center justify-center">
        <div className="absolute right-6 top-6">
          <LanguagePicker className="text-[var(--muted-foreground)]" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">{t('Business Setup Required')}</h1>
          <p className="text-[var(--muted-foreground)]">
            {error instanceof Error
              ? error.message
              : t('This account does not have a business assigned yet.')}
          </p>
          <Button onClick={() => void signOut()}>{t('Sign out')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="soft-luxe-shell flex min-h-screen">
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 border border-primary/15 bg-card/95 text-[var(--foreground)] shadow-soft backdrop-blur-xl xl:hidden"
        onClick={() => setIsSidebarOpen(true)}
        aria-label={t('Menu')}
      >
        <Menu className="size-5" />
      </Button>

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] xl:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label={t('Close menu')}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden border-r border-primary/15 bg-card/95 px-4 py-4 shadow-soft backdrop-blur-xl transition-transform duration-200 xl:w-72 xl:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Business Logo/Identity */}
        <div className="flex items-center gap-3">
          <div className="luxe-art flex size-10 items-center justify-center rounded-[0.9rem]">
            <Package className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <span className="truncate text-lg font-semibold text-[var(--foreground)]">{business.name}</span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('Business Overview')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={t('Close menu')}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-7 grid min-h-0 flex-1 content-start gap-1 overflow-y-auto pr-1">
          {businessNavigationItems
            .filter((item) => canAccessBusinessPath(profile?.role, item.to))
            .map((item) => (
            <NavLink
              key={item.to}
              title={t(item.label)}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center justify-start rounded-[0.9rem] px-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--muted)] py-2 text-[var(--foreground)] shadow-soft'
                    : 'py-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-5 opacity-80 group-hover:opacity-100" />
                <span>{t(item.label)}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="mt-4 shrink-0">
          <Separator className="bg-[var(--border)]" />

          <div className="mt-3 flex items-center gap-3 px-2">
            <Avatar className="size-9 rounded-lg border border-[var(--border)]">
              <AvatarFallback className="rounded-lg bg-[var(--muted)] text-[var(--foreground)] font-semibold">
                {getInitials(profile?.fullName ?? 'BO')}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-[var(--foreground)]">{profile?.fullName}</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {profile?.role === 'business-owner' ? t('Business Owner') : 'Business Staff'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <LanguagePicker
              compact
              className="w-full justify-between rounded-lg border border-[var(--border)] bg-card px-3 py-2 text-[var(--muted-foreground)]"
            />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                className="flex-1 justify-start text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)]"
                onClick={() => void signOut()}
                title={t('Sign out')}
                aria-label={t('Sign out')}
              >
                <LogOut className="size-4" />
                {t('Sign out')}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen min-w-0 flex-1 xl:ml-72">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 pb-8 pt-20 sm:px-6 lg:px-8 xl:px-10 xl:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
