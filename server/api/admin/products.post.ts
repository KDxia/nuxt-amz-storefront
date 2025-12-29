/**
 * Product Management - Create/Update Product
 * POST /api/admin/products
 */
import { setStock } from '../../utils/inventory'
import { getProducts, upsertProduct, type Product } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')
  
  const expectedKey = config.adminKey || process.env.ADMIN_KEY || 'admin123'
  if (adminKey !== expectedKey) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const body = await readBody(event)
  const { product, stock } = body as { product: Product; stock?: number }
  
  if (!product || !product.id || !product.slug || !product.title) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'product.id, product.slug, and product.title are required' 
    })
  }
  
  // Keep slug as-is (allow special characters). Only trim and prevent duplicates.
  product.slug = product.slug.trim()
  const existing = await getProducts()
  const conflict = existing.find(p => p.slug === product.slug && p.id !== product.id)
  if (conflict) {
    throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
  }

  // Upsert product using Vercel KV
  const isNew = await upsertProduct(product)

  // Set stock if provided
  if (stock !== undefined) {
    await setStock(product.id, stock)
  }
  
  return {
    success: true,
    product,
    isNew
  }
})
