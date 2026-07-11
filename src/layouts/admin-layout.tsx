import {
  Activity,
  FileSignature,
  LayoutDashboard,
  CreditCard,
  Hotel,
  LogOut,
  Mail,
  Menu,
  Megaphone,
  MonitorPlay,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { cn, getInitials } from '@/lib/utils'

const navigation = [
  { to: '/admin/portal', label: 'Operations', icon: LayoutDashboard },
  { to: '/admin/gift-cards', label: 'Gift Cards', icon: CreditCard },
  { to: '/admin/guide', label: 'Guia', icon: MonitorPlay },
]

const adminPortalSections = [
  { value: 'members', label: 'Members', icon: Users },
  { value: 'promotions', label: 'Promotions', icon: Sparkles },
  { value: 'partners', label: 'Partners', icon: Hotel },
  { value: 'ambassadors', label: 'Ambassadors', icon: Megaphone },
  { value: 'early-access', label: 'Leads', icon: Mail },
  { value: 'referrals', label: 'Referrals', icon: TrendingUp },
  { value: 'agreements', label: 'Agreements', icon: FileSignature },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'commissions', label: 'Commissions', icon: ReceiptText },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isAdminPortal = location.pathname === '/admin/portal'
  const activeAdminSection = location.hash.replace('#', '') || 'members'

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
        <div className="flex items-center gap-3">
          <div className="luxe-art flex size-10 items-center justify-center rounded-[0.9rem]">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-lg font-semibold text-[var(--foreground)]">{t('Admin Portal')}</span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('Platform Operations')}
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

        {isAdminPortal ? (
          <nav className="mt-7 flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="grid content-start gap-1">
              <NavLink
                title="Guia"
                to="/admin/guide"
                onClick={() => setIsSidebarOpen(false)}
                className="group mb-3 flex items-center justify-start rounded-[0.9rem] px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <MonitorPlay className="mr-3 size-5 shrink-0 opacity-80 group-hover:opacity-100" />
                <span className="truncate">Guia</span>
              </NavLink>
              {adminPortalSections.map((item) => (
                <a
                  key={item.value}
                  title={t(item.label)}
                  href={`/admin/portal#${item.value}`}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group flex items-center justify-start rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition-colors ${
                    activeAdminSection === item.value
                      ? 'bg-[var(--muted)] text-[var(--foreground)] shadow-soft'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <item.icon className="mr-3 size-5 shrink-0 opacity-80 group-hover:opacity-100" />
                  <span className="truncate">{t(item.label)}</span>
                </a>
              ))}
            </div>
          </nav>
        ) : (
          <nav className="mt-7 grid flex-1 content-start gap-1">
            {navigation.map((item) => (
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
        )}

        <div className="mt-4 shrink-0">
          <Separator className="bg-[var(--border)]" />

          <div className="mt-3 flex items-center gap-3 px-2">
            <Avatar className="size-9 rounded-lg border border-[var(--border)]">
              <AvatarFallback className="rounded-lg bg-[var(--muted)] text-[var(--foreground)] font-semibold">
                {getInitials(profile?.fullName ?? 'AD')}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-[var(--foreground)]">{profile?.fullName}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{t('Operations Lead')}</span>
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

      <main className="min-h-screen min-w-0 flex-1 xl:ml-72">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 pb-8 pt-20 sm:px-6 lg:px-8 xl:px-10 xl:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
