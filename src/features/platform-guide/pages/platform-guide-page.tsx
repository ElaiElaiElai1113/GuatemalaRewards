import {
  MapPinned,
  MonitorPlay,
  QrCode,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage, type Language } from '@/lib/language'

const screenshotGalleryByLanguage: Record<Language, {
  eyebrow: string
  title: string
  badge: string
  items: Array<{
    title: string
    caption: string
    imageSrc: string
    route: string
  }>
}> = {
  es: {
    eyebrow: 'Fotos reales',
    title: 'Pantallas para el walkthrough',
    badge: 'Listas para traducir',
    items: [
      {
        title: 'Guia publica',
        caption: 'La pagina base para explicar Guatemala Rewards y el orden de la demo.',
        imageSrc: '/walkthrough-screenshots/guide.png',
        route: '/guide',
      },
      {
        title: 'Mapa de negocios',
        caption: 'Los clientes exploran negocios aliados y eligen donde comprar.',
        imageSrc: '/walkthrough-screenshots/public-map.png',
        route: '/shop',
      },
      {
        title: 'Pagina para negocios',
        caption: 'El equipo explica el valor para aliados antes de entrar al portal.',
        imageSrc: '/walkthrough-screenshots/business-page.png',
        route: '/business',
      },
      {
        title: 'Login negocio',
        caption: 'Staff y duenos entran al portal para registrar ventas QR.',
        imageSrc: '/walkthrough-screenshots/business-login.png',
        route: '/business/login',
      },
      {
        title: 'Login admin',
        caption: 'El equipo operativo entra para revisar miembros, aliados y comisiones.',
        imageSrc: '/walkthrough-screenshots/admin-login.png',
        route: '/admin',
      },
    ],
  },
  en: {
    eyebrow: 'Real photos',
    title: 'Screens for the walkthrough',
    badge: 'Translation-ready',
    items: [
      {
        title: 'Public guide',
        caption: 'The base page for explaining Guatemala Rewards and the demo order.',
        imageSrc: '/walkthrough-screenshots/guide.png',
        route: '/guide',
      },
      {
        title: 'Business map',
        caption: 'Customers explore partner businesses and choose where to shop.',
        imageSrc: '/walkthrough-screenshots/public-map.png',
        route: '/shop',
      },
      {
        title: 'Business page',
        caption: 'The team explains partner value before entering the portal.',
        imageSrc: '/walkthrough-screenshots/business-page.png',
        route: '/business',
      },
      {
        title: 'Business login',
        caption: 'Staff and owners enter the portal to record QR sales.',
        imageSrc: '/walkthrough-screenshots/business-login.png',
        route: '/business/login',
      },
      {
        title: 'Admin login',
        caption: 'The operations team enters to review members, partners, and commissions.',
        imageSrc: '/walkthrough-screenshots/admin-login.png',
        route: '/admin',
      },
    ],
  },
}

const guideContent = {
  es: {
    eyebrow: 'Guia interna y para clientes',
    title: 'Guia de la plataforma',
    intro:
      'Un lugar corto y claro para explicar que es Guatemala Rewards, como se usa y que debe mostrar el equipo en una demo.',
    links: {
      map: 'Ver mapa',
      business: 'Portal negocio',
      admin: 'Admin',
      openView: 'Abrir vista',
    },
    videoTitle: 'Video aqui proximamente',
    videoBody: 'Este bloque se reemplazara por el video oficial de entrenamiento.',
    chapters: ['Introduccion', 'Demo cliente', 'Demo negocio', 'Demo admin'],
    storyboardEyebrow: 'Storyboard con pantallas',
    storyboardTitle: 'Que screenshots usar en el video',
    storyboardBadge: 'Version texto primero',
    storyboard: [
      {
        icon: QrCode,
        label: 'Cliente',
        title: 'QR personal',
        route: '/profile',
        caption: 'El cliente muestra su QR para ganar puntos en compras presenciales.',
        mock: ['Perfil verificado', 'QR de miembro', 'Historial de actividad'],
      },
      {
        icon: MapPinned,
        label: 'Descubrimiento',
        title: 'Mapa de negocios',
        route: '/shop',
        caption: 'Los usuarios exploran negocios aliados y eligen donde comprar.',
        mock: ['Mapa visual', 'Pines de aliados', 'Productos por negocio'],
      },
      {
        icon: ScanLine,
        label: 'Negocio',
        title: 'Transacciones',
        route: '/business/redemptions',
        caption: 'El negocio procesa ventas con o sin gift card y revisa historial.',
        mock: ['QR del cliente', 'Gift card opcional', 'Puntos y total'],
      },
      {
        icon: ShieldCheck,
        label: 'Admin',
        title: 'Operaciones',
        route: '/admin/portal#members',
        caption: 'El equipo administra miembros, aliados, verificaciones, gift cards y comisiones.',
        mock: ['Miembros', 'Gift cards', 'Comisiones'],
      },
    ],
    nextEyebrow: 'Proximo paso',
    nextTitle: 'Cuando el video este listo',
    nextBody:
      'El bloque superior se reemplazara por el video oficial para que clientes, negocios y admins puedan ver la guia directamente en la plataforma.',
    badges: ['Espanol primero', 'Video listo despues'],
  },
  en: {
    eyebrow: 'Internal and customer guide',
    title: 'Platform guide',
    intro:
      'A short, clear place to explain what Guatemala Rewards is, how it works, and what the team should show in a demo.',
    links: {
      map: 'View map',
      business: 'Business portal',
      admin: 'Admin',
      openView: 'Open view',
    },
    videoTitle: 'Video coming soon',
    videoBody: 'This block will be replaced by the official training video.',
    chapters: ['Introduction', 'Customer demo', 'Business demo', 'Admin demo'],
    storyboardEyebrow: 'Screen storyboard',
    storyboardTitle: 'Which screenshots to use in the video',
    storyboardBadge: 'Text-first version',
    storyboard: [
      {
        icon: QrCode,
        label: 'Customer',
        title: 'Personal QR',
        route: '/profile',
        caption: 'The customer shows their QR to earn points from in-person purchases.',
        mock: ['Verified profile', 'Member QR', 'Activity history'],
      },
      {
        icon: MapPinned,
        label: 'Discovery',
        title: 'Business map',
        route: '/shop',
        caption: 'Users explore partner businesses and choose where to shop.',
        mock: ['Visual map', 'Partner pins', 'Business products'],
      },
      {
        icon: ScanLine,
        label: 'Business',
        title: 'Transactions',
        route: '/business/redemptions',
        caption: 'The business processes sales with or without a gift card and reviews history.',
        mock: ['Customer QR', 'Optional gift card', 'Points and total'],
      },
      {
        icon: ShieldCheck,
        label: 'Admin',
        title: 'Operations',
        route: '/admin/portal#members',
        caption: 'The team manages members, partners, verifications, gift cards, and commissions.',
        mock: ['Members', 'Gift cards', 'Commissions'],
      },
    ],
    nextEyebrow: 'Next step',
    nextTitle: 'When the video is ready',
    nextBody:
      'The top block will be replaced by the official video so customers, businesses, and admins can watch the guide directly in the platform.',
    badges: ['English version', 'Video ready later'],
  },
} satisfies Record<Language, {
  eyebrow: string
  title: string
  intro: string
  links: {
    map: string
    business: string
    admin: string
    openView: string
  }
  videoTitle: string
  videoBody: string
  chapters: string[]
  storyboardEyebrow: string
  storyboardTitle: string
  storyboardBadge: string
  storyboard: Array<{
    icon: typeof QrCode
    label: string
    title: string
    route: string
    caption: string
    mock: string[]
  }>
  nextEyebrow: string
  nextTitle: string
  nextBody: string
  badges: string[]
}>

function ScreenshotMockup({ items }: { items: string[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-primary-container/20 bg-surface-low shadow-soft">
      <div className="flex items-center gap-1.5 border-b border-primary-container/10 bg-[var(--card)] px-4 py-3">
        <span className="size-2 rounded-full bg-red-300" />
        <span className="size-2 rounded-full bg-yellow-300" />
        <span className="size-2 rounded-full bg-green-300" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded-full bg-primary/20" />
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-3 rounded-xl bg-[var(--card)] p-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container/15 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary">{item}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-outline-variant/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PlatformGuidePage() {
  const { language } = useLanguage()
  const content = guideContent[language]
  const screenshotGallery = screenshotGalleryByLanguage[language]

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-10">
      <section className="grid gap-8 rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-6 shadow-card lg:grid-cols-[minmax(0,1fr)_420px] lg:p-8">
        <div className="space-y-6">
          <Badge variant="accent" className="w-fit rounded-full border-primary-container/25 bg-primary-container/12 text-primary">
            {content.eyebrow}
          </Badge>
          <div className="space-y-4">
            <h1 className="font-serif text-5xl tracking-tight text-primary sm:text-6xl">
              {content.title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-on-surface-variant/85">
              {content.intro}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/shop">
                <MapPinned className="size-4" />
                {content.links.map}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/business/dashboard">
                <ScanLine className="size-4" />
                {content.links.business}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/admin/portal#members">
                <ShieldCheck className="size-4" />
                {content.links.admin}
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-primary-container/20 bg-primary text-primary-foreground shadow-card">
          <div className="aspect-video rounded-t-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(0,0,0,0.22))] p-6">
            <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-white/20 bg-black/18 text-center">
              <MonitorPlay className="size-14 text-primary-foreground" />
              <p className="mt-4 font-serif text-3xl">{content.videoTitle}</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-primary-foreground/80">
                {content.videoBody}
              </p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {content.chapters.map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                <span>{item}</span>
                <span className="font-mono text-primary-foreground/80">0{index}:00</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
              {screenshotGallery.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-primary">{screenshotGallery.title}</h2>
          </div>
          <Badge variant="outline" className="w-fit rounded-full">
            {screenshotGallery.badge}
          </Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {screenshotGallery.items.map((screen) => (
            <article key={screen.imageSrc} className="overflow-hidden rounded-[2rem] border border-primary-container/18 bg-[var(--card)] shadow-sm">
              <div className="aspect-[4/3] overflow-hidden bg-surface-low">
                <img
                  src={screen.imageSrc}
                  alt={screen.title}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-2xl text-primary">{screen.title}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant/85">{screen.caption}</p>
                <Button asChild variant="ghost" className="mt-4 w-full rounded-full">
                  <Link to={screen.route}>{content.links.openView}</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
              {content.storyboardEyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-primary">{content.storyboardTitle}</h2>
          </div>
          <Badge variant="outline" className="w-fit rounded-full">
            {content.storyboardBadge}
          </Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {content.storyboard.map((screen) => (
            <article key={screen.title} className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="accent" className="rounded-full border-primary-container/20 bg-primary-container/10 text-primary">
                    {screen.label}
                  </Badge>
                  <h3 className="mt-4 font-serif text-2xl text-primary">{screen.title}</h3>
                </div>
                <screen.icon className="size-6 text-primary-container" />
              </div>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant/85">{screen.caption}</p>
              <ScreenshotMockup items={screen.mock} />
              <Button asChild variant="ghost" className="mt-4 w-full rounded-full">
                <Link to={screen.route}>{content.links.openView}</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-6 shadow-sm lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
              {content.nextEyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-primary">{content.nextTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant/85">
              {content.nextBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {content.badges.map((badge) => (
              <Badge key={badge} variant="outline" className="rounded-full px-4 py-2">
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
