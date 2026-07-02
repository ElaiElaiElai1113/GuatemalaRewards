import type { Product } from '@/types/domain'
import type { OwnerProductDraftFormValues, ProductDraftFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'

export const productsService = {
  async getProducts(businessId?: string): Promise<Product[]> {
    const sb = requireSupabase()

    let query = sb.from('products').select('*')
    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load products.')

    return (data as Record<string, unknown>[])
      .map((row) => camelCaseRow(row) as unknown as Product)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
  },

  async getProductById(productId: string): Promise<Product | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !data) return null
    return camelCaseRow(data) as unknown as Product
  },

  async createProduct(
    values: ProductDraftFormValues,
    actorName = 'Business Owner',
  ): Promise<Product> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('products')
      .insert({ ...snakeValues, featured: false })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create product.')
    }

    const product = camelCaseRow(data) as unknown as Product

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Product created',
      details: `Added ${product.title} to the shop.`,
    })

    if (logError) {
      throw new Error(logError.message)
    }

    return product
  },

  async createOwnerProduct(
    values: OwnerProductDraftFormValues,
    actorName = 'Business Owner',
  ): Promise<Product> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('create_owner_product', {
      p_title: values.title,
      p_description: values.description,
      p_category: values.category,
      p_price: values.price,
      p_highlight: values.highlight,
      p_inventory: values.inventory,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create product.')
    }

    const product = camelCaseRow(data as Record<string, unknown>) as unknown as Product

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Product created',
      details: `Added ${product.title} to the shop.`,
    })

    if (logError) {
      throw new Error(logError.message)
    }

    return product
  },

  async deleteProduct(productId: string, actorName = 'Platform Admin'): Promise<void> {
    const sb = requireSupabase()

    // Fetch product info for logging
    const product = await this.getProductById(productId)
    if (!product) return

    const { error } = await sb.from('products').delete().eq('id', productId)

    if (error) {
      throw new Error(error.message)
    }

    await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Product deleted',
      details: `Removed ${product.title} from the shop.`,
    })
  },

  async updateProduct(
    productId: string,
    values: Partial<ProductDraftFormValues>,
    actorName = 'Platform Admin',
  ): Promise<Product> {
    const sb = requireSupabase()
    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('products')
      .update(snakeValues)
      .eq('id', productId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update product.')
    }

    const product = camelCaseRow(data) as unknown as Product

    await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Product updated',
      details: `Updated details for ${product.title}.`,
    })

    return product
  },
}
