import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Gift, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import type { GiftCardCatalogItem } from '@/types/domain'
import { ownerGiftCardCatalogItemSchema, type OwnerGiftCardCatalogItemFormValues } from '@/types/forms'
import {
  useCreateOwnerGiftCardCatalogItem,
  useDeleteGiftCardCatalogItem,
  useGiftCardCatalog,
  useUpdateGiftCardCatalogItem,
} from '../hooks/use-gift-cards'

export function BusinessGiftCardsPage() {
  const { profile } = useAuth()
  const { business } = useBusinessOwnerData()
  const catalog = useGiftCardCatalog(business?.id)
  const createItem = useCreateOwnerGiftCardCatalogItem(business?.id)
  const updateItem = useUpdateGiftCardCatalogItem()
  const deleteItem = useDeleteGiftCardCatalogItem()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  if (profile?.role !== 'business-owner') {
    return <div className="rounded-xl border border-[var(--border)] bg-card shadow-sm p-10 text-on-surface-variant">Only business owners can curate gift cards.</div>
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

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Gift Card Catalog</h1>
          <p className="text-lg text-on-surface-variant/85">Create and manage gift cards customers can buy with points.</p>
        </div>
        <Button className="h-14 rounded-full px-8" onClick={openForCreate} disabled={!business}>
          <Gift className="size-5" />
          Add Gift Card
        </Button>
      </div>
      {!business ? (
        <p className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          Business context is still loading.
        </p>
      ) : null}

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
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openForEdit(item)}>
                  <Edit2 className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-error" onClick={() => void deleteItem.mutateAsync(item.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
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
