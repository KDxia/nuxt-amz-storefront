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
  const slugRaw = Array.isArray(raw) ? raw.join('/') : (raw as string | undefined)

  if (!slugRaw) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product slug is required'
    })
  }

  // IMPORTANT: Use the same source of truth as admin (Vercel KV)
  const products: Product[] = await getProducts()

  const safeDecode = (s: string) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  }

  const slugDecoded = slugRaw
    .split('/')
    .map(seg => (seg.includes('%') ? safeDecode(seg) : seg))
    .join('/')

  const slugWholeDecoded = slugRaw.includes('%') ? safeDecode(slugRaw) : slugRaw

  const candidates = [slugRaw, slugDecoded, slugWholeDecoded]
    .map(s => s.trim())
    .filter(Boolean)

  const query = getQuery(event)
  const id = typeof query.id === 'string' ? query.id : undefined

  const product = products.find(p => {
    const ps = String(p.slug || '').trim()
    return candidates.includes(ps)
  }) || (id ? products.find(p => p.id === id) : undefined)

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
