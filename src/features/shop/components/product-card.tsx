import { Coffee, Cookie, PackagePlus, Shirt, Sparkles, Wrench } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/domain'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  isAdding?: boolean
}

export function ProductCard({ product, onAddToCart, isAdding }: ProductCardProps) {
  const { t } = useLanguage()
  const displayCategory = product.category === 'Coffee' ? 'Drinks' : product.category
  const CategoryIcon =
    product.category === 'Coffee'
      ? Coffee
      : product.category === 'Pastry'
        ? Cookie
        : product.category === 'Merch'
          ? Shirt
          : Wrench

  return (
    <div className="compact-catalog-card group flex h-full flex-col gap-4 p-4 text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-card">
        <div className="flex justify-between items-start">
          <Badge>
              {t(displayCategory)}
          </Badge>
          {product.featured && (
            <span className="featured-shimmer flex items-center gap-1.5 rounded-full border border-primary/15 bg-[linear-gradient(90deg,var(--tenant-accent-soft),var(--blush),var(--tenant-accent-soft))] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--foreground)]">
              <Sparkles className="size-3" />
              {t('Bonus Drop')}
            </span>
          )}
        </div>

        <div className="luxe-art relative min-h-32 overflow-hidden rounded-[1.15rem] p-4 shadow-soft">
          <div className="absolute -right-8 -top-8 size-28 rounded-full bg-[var(--champagne)]/20 blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="absolute bottom-4 right-5 h-16 w-24 rounded-[999px] border border-[var(--champagne)]/30 bg-[var(--cream)]/10" />
          <div className="relative flex h-full items-end justify-between">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--champagne)]/80">
                {t('Curated pick')}
              </p>
              <p className="mt-2 font-serif text-2xl leading-none text-[var(--cream)]">{formatCurrency(product.price)}</p>
            </div>
            <div className="animate-float-soft flex size-14 items-center justify-center rounded-[1.1rem] border border-[var(--champagne)]/30 bg-[var(--cream)]/12 text-[var(--champagne)] shadow-soft">
              <CategoryIcon className="size-7" />
            </div>
          </div>
        </div>

        <div className="grow space-y-3">
          <h3 className="text-lg font-bold leading-tight text-[var(--foreground)]">
            {t(product.title)}
          </h3>
          <p className="line-clamp-2 text-sm leading-5 text-[var(--muted-foreground)]">
            {t(product.description)}
          </p>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">{t('Cash Price')}</span>
            <p className="font-serif text-2xl font-semibold text-primary-container">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {product.inventory} {t('in stock')}
            </span>
            <Button
              onClick={() => onAddToCart(product)}
              disabled={product.inventory <= 0 || isAdding}
              isLoading={isAdding}
              variant={product.featured ? 'default' : 'secondary'}
              size="sm"
            >
              {!isAdding ? <PackagePlus className="size-4" /> : null}
              {isAdding ? t('Adding...') : t('Add to Cart')}
            </Button>
          </div>
        </div>
    </div>
  )
}
