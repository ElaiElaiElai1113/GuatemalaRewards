import { type CSSProperties, useState } from 'react'
import { Compass, MapPin, Minus, Navigation, PackageSearch, Plus, ShoppingCart, Store, Ticket } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useLoginGate } from '@/hooks/use-login-gate'
import { useAddToCart, useBusinesses, useProducts } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { Business, Product } from '@/types/domain'

const Guatemala_BOUNDS = {
  minLat: 6.17,
  maxLat: 6.31,
  minLng: -75.62,
  maxLng: -75.52,
}

const PREVIEW_PIN_POSITIONS = [
  { left: 28, top: 34 },
  { left: 58, top: 26 },
  { left: 72, top: 54 },
  { left: 42, top: 68 },
  { left: 20, top: 58 },
  { left: 82, top: 36 },
  { left: 36, top: 44 },
  { left: 64, top: 72 },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hasExactMapPin(business: Business) {
  return business.latitude !== null && business.longitude !== null
}

function getPreviewMapPosition(index: number) {
  const base = PREVIEW_PIN_POSITIONS[index % PREVIEW_PIN_POSITIONS.length]
  const lap = Math.floor(index / PREVIEW_PIN_POSITIONS.length)
  const offset = lap * 4

  return {
    left: `${clamp(base.left + offset, 10, 90)}%`,
    top: `${clamp(base.top + (lap % 2 === 0 ? offset : -offset), 10, 90)}%`,
  }
}

function getMapPosition(business: Business, index: number) {
  if (!hasExactMapPin(business)) {
    return getPreviewMapPosition(index)
  }

  const longitude = business.longitude ?? Guatemala_BOUNDS.minLng
  const latitude = business.latitude ?? Guatemala_BOUNDS.minLat
  const x = ((longitude - Guatemala_BOUNDS.minLng) / (Guatemala_BOUNDS.maxLng - Guatemala_BOUNDS.minLng)) * 100
  const y = ((Guatemala_BOUNDS.maxLat - latitude) / (Guatemala_BOUNDS.maxLat - Guatemala_BOUNDS.minLat)) * 100

  return {
    left: `${clamp(x, 8, 92)}%`,
    top: `${clamp(y, 8, 92)}%`,
  }
}

function PartnerMapBackdrop() {
  return (
    <>
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
        viewBox="0 0 1000 680"
      >
        <defs>
          <pattern id="partner-map-grid" width="54" height="54" patternUnits="userSpaceOnUse">
            <path d="M 54 0 L 0 0 0 54" fill="none" stroke="#d7c8ad" strokeOpacity="0.28" strokeWidth="1" />
          </pattern>
          <linearGradient id="partner-map-river" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#79b6b0" />
            <stop offset="100%" stopColor="#3b7d85" />
          </linearGradient>
        </defs>

        <rect width="1000" height="680" fill="#f3e7d1" />
        <rect width="1000" height="680" fill="url(#partner-map-grid)" />

        <path
          d="M -34 134 C 122 210 207 206 328 164 C 456 119 565 148 674 235 C 779 320 878 325 1042 259"
          fill="none"
          stroke="url(#partner-map-river)"
          strokeLinecap="round"
          strokeOpacity="0.72"
          strokeWidth="46"
        />
        <path
          d="M -34 134 C 122 210 207 206 328 164 C 456 119 565 148 674 235 C 779 320 878 325 1042 259"
          fill="none"
          stroke="#eaf7f1"
          strokeLinecap="round"
          strokeOpacity="0.48"
          strokeWidth="8"
        />

        <path d="M 62 610 C 178 516 238 402 312 246 C 377 111 454 54 574 -24" fill="none" stroke="#d1b178" strokeLinecap="round" strokeWidth="28" />
        <path d="M 62 610 C 178 516 238 402 312 246 C 377 111 454 54 574 -24" fill="none" stroke="#fff8eb" strokeLinecap="round" strokeWidth="15" />
        <path d="M -34 408 C 148 374 311 390 471 452 C 628 513 793 537 1036 474" fill="none" stroke="#d1b178" strokeLinecap="round" strokeWidth="26" />
        <path d="M -34 408 C 148 374 311 390 471 452 C 628 513 793 537 1036 474" fill="none" stroke="#fff8eb" strokeLinecap="round" strokeWidth="13" />
        <path d="M 104 62 C 226 139 342 218 455 312 C 584 420 706 496 908 610" fill="none" stroke="#d1b178" strokeLinecap="round" strokeWidth="24" />
        <path d="M 104 62 C 226 139 342 218 455 312 C 584 420 706 496 908 610" fill="none" stroke="#fff8eb" strokeLinecap="round" strokeWidth="12" />
        <path d="M 29 278 C 233 238 406 230 576 258 C 727 283 862 280 1019 228" fill="none" stroke="#c4a36c" strokeLinecap="round" strokeWidth="18" />
        <path d="M 29 278 C 233 238 406 230 576 258 C 727 283 862 280 1019 228" fill="none" stroke="#f7eddc" strokeLinecap="round" strokeWidth="9" />

        <g fill="none" stroke="#cbb78e" strokeLinecap="round" strokeOpacity="0.76" strokeWidth="5">
          <path d="M 154 20 C 201 168 225 308 225 646" />
          <path d="M 388 -14 C 405 122 421 268 484 682" />
          <path d="M 683 15 C 625 152 606 288 625 662" />
          <path d="M 815 20 C 786 184 747 356 708 674" />
          <path d="M 86 508 C 256 487 379 489 541 514 C 688 536 838 534 968 500" />
          <path d="M 110 166 C 283 204 424 198 545 171 C 718 133 834 155 965 204" />
          <path d="M 31 332 C 181 308 324 325 468 376 C 638 436 793 444 958 396" />
        </g>

        <g fill="#ead9bd" opacity="0.86" stroke="#d4bf97" strokeWidth="1">
          <rect height="74" rx="12" transform="rotate(-9 116 230)" width="126" x="116" y="230" />
          <rect height="92" rx="12" transform="rotate(10 270 116)" width="112" x="270" y="116" />
          <rect height="92" rx="12" transform="rotate(-7 482 92)" width="146" x="482" y="92" />
          <rect height="108" rx="14" transform="rotate(8 704 120)" width="132" x="704" y="120" />
          <rect height="86" rx="12" transform="rotate(-8 160 430)" width="136" x="160" y="430" />
          <rect height="112" rx="14" transform="rotate(8 382 496)" width="148" x="382" y="496" />
          <rect height="94" rx="12" transform="rotate(-10 618 394)" width="128" x="618" y="394" />
          <rect height="110" rx="14" transform="rotate(7 802 474)" width="154" x="802" y="474" />
        </g>

        <g fill="#a8c49a" opacity="0.75" stroke="#7b9b6e" strokeWidth="1">
          <path d="M 62 82 C 117 42 184 58 202 118 C 220 177 163 220 101 203 C 42 187 18 119 62 82 Z" />
          <path d="M 791 75 C 869 26 950 71 946 154 C 942 239 827 260 779 198 C 747 156 751 101 791 75 Z" />
          <path d="M 39 548 C 92 501 172 517 191 586 C 211 654 119 696 54 659 C 12 635 6 579 39 548 Z" />
        </g>

        <path d="M 6 632 C 209 596 379 586 536 606 C 700 626 816 618 994 580" fill="none" stroke="#8a6d9e" strokeDasharray="12 14" strokeLinecap="round" strokeOpacity="0.46" strokeWidth="7" />

        <g fill="#7e6848" fontFamily="Manrope, sans-serif" fontSize="18" fontWeight="800" opacity="0.55">
          <text transform="rotate(-8 120 292)" x="120" y="292">Laureles</text>
          <text transform="rotate(7 706 184)" x="706" y="184">Poblado</text>
          <text transform="rotate(-6 586 458)" x="586" y="458">Centro</text>
          <text transform="rotate(8 792 556)" x="792" y="556">Provenza</text>
        </g>
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_250_241_/_0.16),rgb(117_87_49_/_0.08))]" />
      <div className="absolute inset-5 rounded-[1.6rem] border border-[#b88c55]/45" />
    </>
  )
}

export function ShopPage() {
  const requireAuth = useLoginGate()
  const { t } = useLanguage()
  const businesses = useBusinesses()
  const products = useProducts()
  const addToCart = useAddToCart()

  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const partnerBusinesses = businesses.data ?? []
  const previewPinnedBusinesses = partnerBusinesses.filter((business) => !hasExactMapPin(business))
  const selectedBusiness = partnerBusinesses.find((business) => business.id === selectedBusinessId) ?? null
  const selectedProducts = selectedBusiness
    ? (products.data ?? []).filter((product) => product.businessId === selectedBusiness.id)
    : []

  const openBusiness = (business: Business) => {
    setSelectedBusinessId(business.id)
    setSelectedProduct(null)
    setSelectedQuantity(1)
  }

  const chooseProduct = (product: Product) => {
    requireAuth(() => {
      setSelectedProduct(product)
      setSelectedQuantity(1)
    })
  }

  const addSelectedProduct = () => {
    if (!selectedProduct) return

    addToCart.mutate(
      { productId: selectedProduct.id, quantity: selectedQuantity },
      {
        onSuccess: () => {
          setSelectedProduct(null)
          setSelectedQuantity(1)
        },
      },
    )
  }

  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col gap-5 border-b border-primary/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge variant="accent" className="w-fit">
              {t('Partner Map')}
            </Badge>
            <h1 className="font-serif text-[clamp(3rem,7vw,7.25rem)] font-bold uppercase leading-[0.95] text-primary-container">
              {t('Explore Businesses')}
            </h1>
            <p className="max-w-2xl text-base font-medium leading-7 text-on-surface-variant/85 sm:text-lg">
              {t('Find partner businesses around Guatemala and open their products from the map.')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[31rem]">
            <div className="rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-soft">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">{t('Partners')}</p>
              <p className="mt-2 font-serif text-3xl text-primary">{partnerBusinesses.length}</p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-soft">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">{t('On Map')}</p>
              <p className="mt-2 font-serif text-3xl text-primary">{partnerBusinesses.length}</p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-soft">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">{t('Products')}</p>
              <p className="mt-2 font-serif text-3xl text-primary">{products.data?.length ?? 0}</p>
            </div>
          </div>
        </div>

        {businesses.isLoading ? (
          <LoadingState title={t('Loading')} description={t('Preparing your partner map.')} />
        ) : partnerBusinesses.length === 0 ? (
          <EmptyState
            icon={<Store className="size-8" />}
            title={t('No partner businesses yet')}
            description={t('Partner businesses will appear here when they are available.')}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-primary/20 bg-[#f3e7d1] shadow-card sm:min-h-[42rem]">
              <PartnerMapBackdrop />

              <div className="absolute left-5 top-5 rounded-2xl border border-primary/20 bg-card/88 px-4 py-3 text-primary shadow-soft backdrop-blur">
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">{t('Guatemala')}</span>
                </div>
              </div>

              {partnerBusinesses.map((business, index) => {
                const isExactPin = hasExactMapPin(business)
                const position = getMapPosition(business, index)

                return (
                  <button
                    key={business.id}
                    type="button"
                    className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={position as CSSProperties}
                    onClick={() => openBusiness(business)}
                    aria-label={`${t('Open business')} ${business.name}`}
                  >
                    <span
                      className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/18 opacity-70 transition group-hover:scale-125 group-hover:opacity-100"
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                    <span className="relative flex size-14 items-center justify-center rounded-[1.15rem] border border-white/35 bg-[var(--card)] text-primary shadow-luxe transition group-hover:-translate-y-1 group-hover:scale-105">
                      {business.logoUrl ? (
                        <img src={business.logoUrl} alt="" className="size-10 rounded-xl object-cover" />
                      ) : (
                        <span className="font-serif text-2xl font-bold">{business.name.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className="absolute left-1/2 top-[calc(100%+0.55rem)] min-w-32 -translate-x-1/2 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-bold text-white shadow-soft backdrop-blur">
                      {business.name}
                    </span>
                    {!isExactPin ? (
                      <span className="absolute -right-3 -top-3 rounded-full border border-white/30 bg-[#f2c978] px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-[0.08em] text-[#21140d] shadow-soft">
                        {t('Preview')}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </section>

            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-primary/18 bg-card/90 p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      {t('Business Directory')}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl text-primary">{t('Partner Businesses')}</h2>
                  </div>
                  <Navigation className="size-5 text-primary" />
                </div>

                <div className="mt-5 space-y-3">
                  {partnerBusinesses.map((business) => (
                    <button
                      key={business.id}
                      type="button"
                      className="w-full rounded-2xl border border-primary/12 bg-[var(--muted)] p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card"
                      onClick={() => openBusiness(business)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-serif text-xl text-primary">{business.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-on-surface-variant/80">
                            {business.address || business.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            hasExactMapPin(business)
                              ? 'shrink-0 border-success/20 bg-success/10 text-success'
                              : 'shrink-0 border-warning/20 bg-warning/10 text-warning'
                          }
                        >
                          {hasExactMapPin(business) ? t('Exact') : t('Preview')}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {previewPinnedBusinesses.length > 0 ? (
                <div className="rounded-[2rem] border border-warning/20 bg-warning/10 p-5 text-warning">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 size-5 shrink-0" />
                    <p className="text-sm font-semibold leading-6">
                      {t('Partners without coordinates are shown with preview pins until exact locations are added.')}
                    </p>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selectedBusiness)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBusinessId(null)
            setSelectedProduct(null)
            setSelectedQuantity(1)
          }
        }}
      >
        <DialogContent className="max-w-3xl rounded-[2rem] p-6 sm:p-8">
          {selectedBusiness ? (
            <>
              <DialogHeader>
                <Badge variant="accent" className="w-fit">{t('Partner Business')}</Badge>
                <DialogTitle className="text-4xl text-primary">{selectedBusiness.name}</DialogTitle>
                <DialogDescription>
                  {selectedBusiness.address || selectedBusiness.description}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary/12 bg-[var(--muted)] p-4">
                  <Ticket className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant/70">{t('Earn Rate')}</p>
                  <p className="mt-1 font-serif text-2xl text-primary">{selectedBusiness.earnRate} pts/$</p>
                </div>
                <div className="rounded-2xl border border-primary/12 bg-[var(--muted)] p-4">
                  <MapPin className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant/70">{t('Map Status')}</p>
                  <p className="mt-1 font-serif text-2xl text-primary">{hasExactMapPin(selectedBusiness) ? t('Exact') : t('Preview')}</p>
                </div>
                <div className="rounded-2xl border border-primary/12 bg-[var(--muted)] p-4">
                  <ShoppingCart className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant/70">{t('Products')}</p>
                  <p className="mt-1 font-serif text-2xl text-primary">{selectedProducts.length}</p>
                </div>
              </div>

              {selectedProduct ? (
                <div className="rounded-[1.5rem] border border-primary/20 bg-primary-container/10 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{t('Selected item')}</p>
                      <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">{t(selectedProduct.title)}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant/80">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedQuantity((value) => Math.max(1, value - 1))}
                        disabled={selectedQuantity <= 1}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="min-w-8 text-center text-lg font-bold text-primary">{selectedQuantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedQuantity((value) => Math.min(selectedProduct.inventory, value + 1))}
                        disabled={selectedQuantity >= selectedProduct.inventory}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        isLoading={addToCart.isPending}
                        disabled={selectedProduct.inventory <= 0 || addToCart.isPending}
                        onClick={addSelectedProduct}
                      >
                        {t('Add to Cart')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <h3 className="font-serif text-2xl text-primary">{t('Available Products')}</h3>
                {products.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 rounded-2xl" />
                    ))}
                  </div>
                ) : selectedProducts.length === 0 ? (
                  <EmptyState
                    icon={<PackageSearch className="size-8" />}
                    title={t('No products yet')}
                    description={t('Products from this partner will appear here when they are available.')}
                  />
                ) : (
                  <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
                    {selectedProducts.map((product) => (
                      <div key={product.id} className="rounded-2xl border border-primary/12 bg-card p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{t(product.category === 'Coffee' ? 'Drinks' : product.category)}</Badge>
                              {product.featured ? <Badge variant="accent">{t('Bonus Drop')}</Badge> : null}
                            </div>
                            <h4 className="mt-3 text-lg font-bold text-[var(--foreground)]">{t(product.title)}</h4>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-on-surface-variant/80">{t(product.description)}</p>
                          </div>
                          <div className="flex shrink-0 items-end justify-between gap-4 sm:flex-col sm:items-end">
                            <div className="text-right">
                              <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                              <p className="text-xs font-semibold text-on-surface-variant/70">{product.inventory} {t('in stock')}</p>
                            </div>
                            <Button
                              type="button"
                              variant={selectedProduct?.id === product.id ? 'default' : 'secondary'}
                              size="sm"
                              disabled={product.inventory <= 0}
                              onClick={() => chooseProduct(product)}
                            >
                              {selectedProduct?.id === product.id ? t('Selected') : t('Choose')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
