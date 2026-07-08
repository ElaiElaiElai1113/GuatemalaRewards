import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Gift, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessMembers, useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import type { GiftCardCatalogItem } from '@/types/domain'
import { ownerGiftCardCatalogItemSchema, type OwnerGiftCardCatalogItemFormValues } from '@/types/forms'
import {
  useCreateOwnerGiftCardCatalogItem,
  useDeleteGiftCardCatalogItem,
  useGiftCardCatalog,
  useIssueGiftCard,
  useUpdateGiftCardCatalogItem,
} from '../hooks/use-gift-cards'

export function BusinessGiftCardsPage() {
  const { profile } = useAuth()
  const { business } = useBusinessOwnerData()
  const catalog = useGiftCardCatalog(business?.id)
  const members = useBusinessMembers(business?.id)
  const createItem = useCreateOwnerGiftCardCatalogItem(business?.id)
  const updateItem = useUpdateGiftCardCatalogItem()
  const deleteItem = useDeleteGiftCardCatalogItem()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [issueCatalogId, setIssueCatalogId] = useState('')
  const [issueCustomerId, setIssueCustomerId] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const issueCard = useIssueGiftCard(issueCustomerId)

  const form = useForm<OwnerGiftCardCatalogItemFormValues>({
    resolver: zodResolver(ownerGiftCardCatalogItemSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      pointsCost: 500,
      valueLabel: 'PHP 250',
      expiryDays: 30,
      isActive: true,
    },
  })

  const canCurateCatalog = profile?.role === 'business-owner'
  const canIssueCards = profile?.role === 'business-owner' || profile?.role === 'business-staff'

  if (!canIssueCards) {
    return <div className="rounded-xl border border-[var(--border)] bg-card shadow-sm p-10 text-on-surface-variant">Only business teams can manage gift cards.</div>
  }

  function openForCreate() {
    if (!business) {
      setActionError('Business context is still loading. Please try again in a moment.')
      return
    }

    setEditingId(null)
    form.reset({
      title: '',
      description: '',
      imageUrl: '',
      pointsCost: 500,
      valueLabel: 'PHP 250',
      expiryDays: 30,
      isActive: true,
    })
    setActionError(null)
    setOpen(true)
  }

  function openForEdit(item: GiftCardCatalogItem) {
    setEditingId(item.id)
    form.reset({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl ?? '',
      pointsCost: item.pointsCost,
      valueLabel: item.valueLabel,
      expiryDays: item.expiryDays,
      isActive: item.isActive,
    })
    setOpen(true)
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      setActionError(null)
      if (editingId) {
        await updateItem.mutateAsync({ id: editingId, values })
      } else {
        await createItem.mutateAsync(values)
      }
      setOpen(false)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Gift card could not be saved.')
    }
  })

  async function submitIssue() {
    try {
      setActionError(null)
      if (!issueCatalogId || !issueCustomerId) {
        setActionError('Select a gift card and a customer before issuing.')
        return
      }

      await issueCard.mutateAsync(issueCatalogId)
      setIssueCatalogId('')
      setIssueCustomerId('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Gift card could not be issued.')
    }
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Gift Card Catalog</h1>
          <p className="text-lg text-on-surface-variant/85">Create and manage gift cards customers can buy with points.</p>
        </div>
        <Button className="h-14 rounded-full px-8" onClick={openForCreate} disabled={!business || !canCurateCatalog}>
          <Gift className="size-5" />
          Add Gift Card
        </Button>
      </div>
      {!business ? (
        <p className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          Business context is still loading.
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <Badge variant="accent" className="w-fit">Business issue</Badge>
          <h2 className="font-serif text-3xl text-primary-container">Issue Gift Card To Customer</h2>
          <p className="text-sm text-on-surface-variant">
            Use this when a customer buys or receives a gift card directly from the business. Business-issued cards do not spend the customer's reward points.
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,1fr,auto] lg:items-end">
          <div className="grid gap-2">
            <Label>Gift card</Label>
            <Select value={issueCatalogId} onValueChange={setIssueCatalogId}>
              <SelectTrigger>
                <SelectValue placeholder="Select gift card" />
              </SelectTrigger>
              <SelectContent>
                {(catalog.data ?? [])
                  .filter((item) => item.isActive)
                  .map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} - {item.valueLabel}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Customer</Label>
            <Select value={issueCustomerId} onValueChange={setIssueCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={members.isLoading ? 'Loading customers...' : 'Select customer'} />
              </SelectTrigger>
              <SelectContent>
                {(members.data ?? []).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.fullName} - {member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Gift Card' : 'New Gift Card'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="gift-card-title">Title</Label>
              <Input id="gift-card-title" {...form.register('title')} />
              {form.formState.errors.title ? <p className="text-xs text-red-500">{form.formState.errors.title.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gift-card-description">Description</Label>
              <Textarea id="gift-card-description" {...form.register('description')} />
              {form.formState.errors.description ? <p className="text-xs text-red-500">{form.formState.errors.description.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gift-card-image">Image URL</Label>
              <Input id="gift-card-image" {...form.register('imageUrl')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="gift-card-points">Points</Label>
                <Input id="gift-card-points" type="number" {...form.register('pointsCost', { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gift-card-value">Value</Label>
                <Input id="gift-card-value" {...form.register('valueLabel')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gift-card-expiry">Expiry Days</Label>
                <Input id="gift-card-expiry" type="number" {...form.register('expiryDays', { valueAsNumber: true })} />
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" {...form.register('isActive')} />
              Active
            </label>
            {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting || (!editingId && !business)}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 sm:grid-cols-2">
        {(catalog.data ?? []).map((item) => (
          <div key={item.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-7">
            <div className="flex items-start justify-between gap-4">
              <Badge variant={item.isActive ? 'accent' : 'outline'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
              {canCurateCatalog ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openForEdit(item)}>
                    <Edit2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-error" onClick={() => void deleteItem.mutateAsync(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
            <h3 className="mt-5 font-serif text-3xl text-primary-container">{item.title}</h3>
            <p className="mt-3 text-sm text-on-surface-variant">{item.description}</p>
            <div className="mt-6 flex justify-between text-sm font-bold text-on-surface">
              <span>{item.pointsCost} points</span>
              <span>{item.valueLabel}</span>
              <span>{item.expiryDays} days</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
