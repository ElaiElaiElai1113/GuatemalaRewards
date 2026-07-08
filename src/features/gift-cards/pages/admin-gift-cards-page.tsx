import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminAllBusinesses } from '@/hooks/use-admin-data'
import { requireSupabase } from '@/integrations/supabase/services/shared'
import { useGiftCardCatalog, useBusinessGiftCards, useIssueGiftCard } from '../hooks/use-gift-cards'

function useCustomerOptions() {
  return useQuery({
    queryKey: ['admin-gift-card-customers'],
    queryFn: async () => {
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'customer')
        .order('full_name', { ascending: true })

      if (error) throw new Error('Failed to load customers.')

      return (data ?? []).map((row) => ({
        id: row.id as string,
        fullName: row.full_name as string,
        email: row.email as string,
      }))
    },
  })
}

export function AdminGiftCardsPage() {
  const businesses = useAdminAllBusinesses()
  const [businessId, setBusinessId] = useState<string | undefined>(undefined)
  const [issueCatalogId, setIssueCatalogId] = useState('')
  const [issueCustomerId, setIssueCustomerId] = useState('')
  const catalog = useGiftCardCatalog(businessId)
  const giftCards = useBusinessGiftCards(businessId)
  const customers = useCustomerOptions()
  const issueCard = useIssueGiftCard(issueCustomerId)
  const activeCatalog = (catalog.data ?? []).filter((item) => item.isActive)

  async function submitIssue() {
    if (!issueCatalogId || !issueCustomerId) return
    await issueCard.mutateAsync(issueCatalogId)
    setIssueCatalogId('')
    setIssueCustomerId('')
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Gift Cards</h1>
          <p className="text-lg text-on-surface-variant/85">Review catalog items and issued cards across the platform.</p>
        </div>
        <div className="w-full sm:w-80">
          <Select
            value={businessId ?? 'all'}
            onValueChange={(value) => {
              setBusinessId(value === 'all' ? undefined : value)
              setIssueCatalogId('')
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All businesses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All businesses</SelectItem>
              {(businesses.data ?? []).map((business) => (
                <SelectItem key={business.id} value={business.id}>{business.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-6">
          <p className="text-sm text-on-surface-variant">Catalog Items</p>
          <p className="mt-2 font-serif text-4xl text-primary-container">{catalog.data?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-6">
          <p className="text-sm text-on-surface-variant">Issued Cards</p>
          <p className="mt-2 font-serif text-4xl text-primary-container">{giftCards.data?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-6">
          <p className="text-sm text-on-surface-variant">Active Cards</p>
          <p className="mt-2 font-serif text-4xl text-primary-container">
            {giftCards.data?.filter((card) => card.status === 'active').length ?? 0}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <Badge variant="accent" className="w-fit">Admin issue</Badge>
          <h2 className="font-serif text-3xl text-primary-container">Issue Gift Card</h2>
          <p className="text-sm text-on-surface-variant">Select a business, card, and customer to issue a card without spending customer points.</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,1fr,auto] lg:items-end">
          <Select value={issueCatalogId} onValueChange={setIssueCatalogId} disabled={!businessId}>
            <SelectTrigger>
              <SelectValue placeholder={businessId ? 'Select gift card' : 'Select a business first'} />
            </SelectTrigger>
            <SelectContent>
              {activeCatalog.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title} - {item.valueLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={issueCustomerId} onValueChange={setIssueCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder={customers.isLoading ? 'Loading customers...' : 'Select customer'} />
            </SelectTrigger>
            <SelectContent>
              {(customers.data ?? []).map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.fullName} - {customer.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="secondary"
            className="h-12 rounded-full px-6"
            disabled={!issueCatalogId || !issueCustomerId || issueCard.isPending}
            onClick={() => void submitIssue()}
          >
            {issueCard.isPending ? 'Issuing...' : 'Issue Card'}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-3xl text-primary-container">Catalog</h2>
        <div className="grid gap-4">
          {(catalog.data ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm flex items-center justify-between gap-4 p-5">
              <div>
                <h3 className="font-serif text-2xl text-primary-container">{item.title}</h3>
                <p className="text-sm text-on-surface-variant">{item.business?.name} · {item.pointsCost} points · {item.valueLabel}</p>
              </div>
              <Badge variant={item.isActive ? 'accent' : 'outline'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
          ))}
        </div>
      </section>

      {businessId ? (
        <section className="space-y-4">
          <h2 className="font-serif text-3xl text-primary-container">Issued</h2>
          <div className="grid gap-4">
            {(giftCards.data ?? []).map((card) => (
              <div key={card.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm flex items-center justify-between gap-4 p-5">
                <div>
                  <h3 className="font-serif text-2xl text-primary-container">{card.catalog?.title ?? card.code}</h3>
                  <p className="font-mono text-sm text-on-surface-variant">{card.code}</p>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Remaining {card.valueCurrency} {card.remainingValueAmount.toFixed(2)}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to={`/wallet/gift-cards/${card.id}`}>Open</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
