import {
  Activity,
  Home,
  LogOut,
  Megaphone,
  Settings2,
  ShieldCheck,
  QrCode,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'

const memberNavigation = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/profile', label: 'Member QR', icon: QrCode },
  { to: '/promotions', label: 'Promotions', icon: Megaphone },
  { to: '/activity', label: 'Activity', icon: Activity },
]

const adminNavigation = [{ to: '/admin/portal', label: 'Admin Portal', icon: ShieldCheck }]

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft'
    : 'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground'
}

export function AppShell() {
  const { profile, signOut } = useAuth()

  const navigation = [
    ...memberNavigation,
    ...(profile?.role === 'platform-admin' ? adminNavigation : []),
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-4 md:px-6 lg:flex-row lg:gap-6 lg:px-8">
        <aside className="rounded-[2rem] border border-border/80 bg-background/80 p-5 shadow-panel  lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[290px] lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <div>
              <BrandLogo markClassName="h-9" textClassName="text-lg text-foreground" />
              <h1 className="mt-1 font-serif text-3xl tracking-[-0.04em] text-foreground">
                Menu
              </h1>
            </div>
            <div className="rounded-full bg-secondary/80 p-3 text-primary">
              <QrCode className="size-5" />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-[1.6rem] bg-card px-4 py-4">
            <Avatar className="size-12">
              <AvatarFallback>{getInitials(profile?.fullName ?? 'CC')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{profile?.fullName}</p>
              <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">Member</Badge>
            <Badge variant={profile?.role === 'platform-admin' ? 'success' : 'accent'}>
              {profile?.role === 'platform-admin' ? 'Platform Admin' : 'Member'}
            </Badge>
          </div>

          <Separator className="my-6" />

          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {navigation.map((item) => (
              <NavLink key={item.to} className={navClassName} to={item.to}>
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-[1.6rem] bg-[var(--muted)] p-4">
            <p className="text-sm font-medium text-foreground">Built for repeat customers.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The data and services support multi-location and multi-brand reward programs.
            </p>
          </div>

          <Button
            variant="ghost"
            className="mt-6 w-full justify-start"
            onClick={() => {
              void signOut()
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </aside>

        <div className="mt-4 flex-1 lg:mt-0">
          <header className="mb-6 flex items-center justify-between rounded-[2rem] border border-border/80 bg-background/70 px-5 py-4 shadow-panel ">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Warm, premium member experience
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage balances, rewards, redemptions, and promotions from one interface.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <NavLink to={profile?.role === 'platform-admin' ? '/admin/portal' : '/profile'}>
                <Settings2 className="size-4" />
                {profile?.role === 'platform-admin' ? 'Staff tools' : 'Open QR'}
              </NavLink>
            </Button>
          </header>

          <main className="space-y-6 pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
