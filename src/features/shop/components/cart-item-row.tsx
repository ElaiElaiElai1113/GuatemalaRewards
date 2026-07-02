import { Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/domain'

interface CartItemRowProps {
  product: Product
  quantity: number
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartItemRow({ product, quantity, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { t } = useLanguage()

  return (
    <div className="flex items-center gap-6 rounded-2xl bg-surface-lowest p-6 border border-outline-variant/5">
      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-xl tracking-tight text-primary leading-tight truncate">
          {t(product.title)}
        </h3>
        <p className="text-sm text-on-surface-variant/80">{formatCurrency(product.price)} {t('each')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full"
          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center font-bold text-primary">{quantity}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full"
          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <p className="font-serif text-xl text-primary w-24 text-right">
        {formatCurrency(product.price * quantity)}
      </p>

      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full text-on-surface-variant/60 hover:text-red-500"
        onClick={() => onRemove(product.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
