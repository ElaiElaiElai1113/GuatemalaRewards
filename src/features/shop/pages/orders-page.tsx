import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useBusinesses, useOrders } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency, formatDate } from '@/lib/utils'

export function OrdersPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const orders = useOrders(profile?.id)
  const businesses = useBusinesses()

  const getBusinessName = (businessId: string) =>
    businesses.data?.find((b) => b.id === businessId)?.name ?? 'Unknown'

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="accent" className="bg-tertiary/20 text-primary">
          {t('Order History')}
        </Badge>
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
          {t('Your Orders')}
        </h1>
        <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
          {t('View your past purchases and the points posted from each confirmed order.')}
        </p>
      </div>

      {orders.isLoading ? (
        <div className="space-y-6">
          <LoadingState
            className="py-2"
            title={t('Loading')}
            description={t('Loading your order history.')}
          />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (orders.data ?? []).length === 0 ? (
        <EmptyState
          title={t('No orders yet')}
          description={t('Purchases placed from partner businesses will appear here together with their posted points.')}
          action={
            <Button asChild variant="default" size="lg" className="rounded-full">
              <Link to="/shop">{t('Browse businesses')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {(orders.data ?? []).map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-surface-low p-6 border border-outline-variant/5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-serif text-xl text-primary">{getBusinessName(order.businessId)}</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-2xl text-primary">{formatCurrency(order.total)}</p>
                  <Badge variant="accent" className="bg-success/10 text-success border-none text-[0.55rem]">
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-outline-variant/5 pt-3 space-y-1">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm text-on-surface-variant">
                    <span>{t(item.productTitle)} x{item.quantity}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-outline-variant/5 pt-3">
                <span className="text-sm font-bold text-primary">
                  +{order.pointsEarned} {order.pointsStatus === 'pending' ? t('points pending') : t('points posted')}
                </span>
                <Badge
                  variant={order.pointsStatus === 'pending' ? 'outline' : 'success'}
                  className="text-[0.55rem]"
                >
                  {order.pointsStatus === 'pending' ? t('Pending') : t('Posted')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
