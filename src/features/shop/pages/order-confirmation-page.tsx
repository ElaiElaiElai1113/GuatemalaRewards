import { CheckCircle, MapPin } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useOrder } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency } from '@/lib/utils'

export function OrderConfirmationPage() {
  const location = useLocation()
  const { t } = useLanguage()
  const orderId = (location.state as { orderId?: string })?.orderId
  const order = useOrder(orderId)

  if (!order.data) {
    return (
      <div className="text-center py-20 space-y-6">
        <p className="text-on-surface-variant/60 font-medium">{t('Order not found.')}</p>
        <Button asChild variant="default" className="rounded-full">
          <Link to="/shop">{t('Explore businesses')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-16 pb-20">
      <div className="text-center space-y-6 py-12">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="size-10 text-success" />
        </div>
        <Badge variant="accent" className="bg-success/10 text-success">
          {t('Order Confirmed')}
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          {t('Thank you!')}
        </h1>
        <p className="text-lg text-on-surface-variant/85 font-medium max-w-xl mx-auto">
          {t('Your purchase has been made successfully and the order is now confirmed.')}
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-[2rem] bg-surface-low p-8 md:p-12 border border-outline-variant/10 shadow-card space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-3xl text-primary">{t('Order Details')}</h2>
          {order.data.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{t(item.productTitle)} x{item.quantity}</span>
              <span className="text-primary font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <div className="border-t border-outline-variant/10 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>{t('Total')}</span>
              <span className="font-bold text-primary">{formatCurrency(order.data.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-tertiary/20 p-6 text-center space-y-2">
          <p className="font-serif text-3xl text-primary">+{order.data.pointsEarned} {t('points')}</p>
          <p className="text-sm text-on-surface-variant/80">{t('Posted to your account')}</p>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-5 text-center text-sm font-medium text-primary">
          {t('You can review the order below or keep exploring partner businesses.')}
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild variant="default" className="rounded-full">
            <Link to="/shop" className="flex items-center gap-2">
              <MapPin className="size-4" />
              {t('Explore businesses')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/orders">{t('View Orders')}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
