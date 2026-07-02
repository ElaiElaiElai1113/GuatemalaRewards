import { Package, Plus, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { CompactSearch } from '@/components/ui/compact-search'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useBusinessOwnerData, useCreateOwnerProduct } from '@/hooks/use-business-owner-data'
import { useDeleteProduct, useUpdateProduct } from '@/hooks/use-admin-data'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { searchMatches } from '@/lib/search'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/domain'
import { ownerProductDraftSchema, type OwnerProductDraftFormValues } from '@/types/forms'
import { Controller } from 'react-hook-form'

export function ProductsPage() {
  const { business, products } = useBusinessOwnerData()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const createProduct = useCreateOwnerProduct(profile, business?.id)
  const deleteProduct = useDeleteProduct(profile?.fullName)
  const updateProduct = useUpdateProduct(profile?.fullName)

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')

  const form = useForm<OwnerProductDraftFormValues>({
    resolver: zodResolver(ownerProductDraftSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Coffee',
      price: 4.5,
      highlight: '',
      inventory: 50,
    },
  })

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    form.reset({
      title: product.title,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      highlight: product.highlight || '',
      inventory: product.inventory,
    })
    setOpen(true)
  }

  const handleOpenForCreate = () => {
    if (!business) {
      setError('Business context is still loading. Please try again in a moment.')
      return
    }

    setEditingId(null)
    form.reset({
      title: '',
      description: '',
      category: 'Coffee',
      price: 4.5,
      highlight: '',
      inventory: 50,
    })
    setError(null)
    setOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (confirm(t('Are you sure you want to delete this product?'))) {
      await deleteProduct.mutateAsync(productId)
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null)
      if (editingId) {
        await updateProduct.mutateAsync({ productId: editingId, values })
      } else {
        await createProduct.mutateAsync(values)
      }
      form.reset()
      setOpen(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Action failed.'))
    }
  })

  const businessColors =
    business?.slug === 'velvet-brew'
      ? { primary: 'from-primary to-primary-container', light: 'from-primary/10 to-primary-container/10' }
      : { primary: 'from-tertiary to-primary-container', light: 'from-tertiary/10 to-primary-container/10' }
  const filteredProducts = products.filter((product) =>
    searchMatches(productSearch, [
      product.title,
      product.description,
      product.category,
      product.highlight,
      product.inventory,
      product.price,
    ]),
  )

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Products')}</h1>
          <p className="text-lg text-on-surface-variant/85">
            {t('View and manage your product catalog and inventory.')}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <CompactSearch
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder={t('Search products')}
            aria-label={t('Search products')}
          />
          <Button className="h-14 rounded-full px-8 font-semibold" onClick={handleOpenForCreate} disabled={!business}>
            <Plus className="size-5 mr-2" />
            {t('Add Product')}
          </Button>
        </div>
      </div>
      {!business ? (
        <p className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          {t('Business context is still loading.')}
        </p>
      ) : null}

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              {editingId ? t('Edit Product') : t('New Product')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="product-title">{t('Title')}</Label>
              <Input id="product-title" placeholder="Nitro Cold Brew" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-description">{t('Description')}</Label>
              <Textarea id="product-description" placeholder="Our signature nitro brew..." {...form.register('description')} />
              {form.formState.errors.description && (
                <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>{t('Category')}</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder={t('Select a category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coffee">{t('Drinks')}</SelectItem>
                      <SelectItem value="Pastry">{t('Bites')}</SelectItem>
                      <SelectItem value="Merch">{t('Gear')}</SelectItem>
                      <SelectItem value="Equipment">{t('Tools')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">{t('Price ($)')}</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                placeholder="4.50"
                {...form.register('price', { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-inventory">{t('Inventory')}</Label>
              <Input
                id="product-inventory"
                type="number"
                min="0"
                step="1"
                placeholder="50"
                {...form.register('inventory', { valueAsNumber: true })}
              />
              {form.formState.errors.inventory && (
                <p className="text-xs text-red-500">{form.formState.errors.inventory.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-highlight">{t('Highlight')}</Label>
              <Input id="product-highlight" placeholder="Special Roast" {...form.register('highlight')} />
            </div>
            {error && <p className="text-sm font-bold text-red-500 text-center">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" className="rounded-full" disabled={form.formState.isSubmitting || (!editingId && !business)}>
                {form.formState.isSubmitting ? t('Saving...') : editingId ? t('Update Product') : t('Add Product')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Products Grid */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <EmptyState
            icon={<Package className="size-8" />}
            title={t('No products yet')}
            description={t('Create your first product to make it available in the shop.')}
            action={
              <Button className="rounded-full" onClick={handleOpenForCreate} disabled={!business}>
                <Plus className="size-4" />
                {t('Add Product')}
              </Button>
            }
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="size-8" />}
            title={t('No products match this search')}
            description={t('Try a product title, category, or highlight.')}
          />
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group flex items-center justify-between rounded-3xl bg-card hover:bg-surface-low p-6 border border-outline-variant/20 hover:border-primary/30 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`size-14 rounded-2xl flex items-center justify-center text-primary-foreground text-lg font-bold ${businessColors.primary}`}
                >
                  {product.title.charAt(0)}
                </div>
                <div className="space-y-1">
                  <p className="font-serif text-xl text-primary">{product.title}</p>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant/70">
                    <span>{t(product.category)}</span>
                    <span className="size-1 rounded-full bg-outline-variant/30"></span>
                    <span>{product.inventory} {t('in stock')}</span>
                    {product.featured && (
                      <>
                        <span className="size-1 rounded-full bg-outline-variant/30"></span>
                        <span className="text-secondary font-medium">{t('Featured')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                  {product.highlight && (
                    <p className="text-xs text-on-surface-variant/60 mt-1">{product.highlight}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="size-9 rounded-full" onClick={() => handleEdit(product)}>
                    <Edit2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-9 rounded-full text-error hover:text-error hover:bg-error/10" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
