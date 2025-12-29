/**
 * Get single product by slug (supports slashes and special characters)
 * GET /api/products/:slug
 */
import { getStock } from '../../utils/inventory'
import { getProducts, type Product } from '../../utils/products'

export default defineEventHandler(async (event) => {
  // Avoid serving stale data via intermediary caches
  setHeader(event, 'Cache-Control', 'no-store')

  const raw = (event.context.params as Record<string, unknown> | undefined)?.slug
  const slug = Array.isArray(raw) ? raw.join('/') : (raw as string | undefined)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product slug is required'
    })
  }

  // IMPORTANT: Use the same source of truth as admin (Vercel KV)
  const products: Product[] = await getProducts()

  const product = products.find(p => p.slug === slug)

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found'
    })
  }

  // Get real-time stock (or default if KV not configured)
  let stock = 100
  try {
    stock = await getStock(product.id)
  } catch (e) {
    // KV not configured, use default
  }

  return {
    ...product,
    stock,
    inStock: stock > 0
  }
})
