/**
 * Get all products
 * GET /api/products
 */
import { getMultipleStock } from '../../utils/inventory'
import { getProducts, type Product } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Avoid serving stale data via intermediary caches
  setHeader(event, 'Cache-Control', 'no-store')

  // IMPORTANT: Use the same source of truth as admin (Vercel KV)
  let products: Product[] = await getProducts()

  // Filter by category
  if (query.category) {
    products = products.filter(p => p.category === query.category)
  }

  // Filter featured products
  if (query.featured === 'true') {
    products = products.filter(p => p.featured)
  }

  // Sort options
  if (query.sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price)
  } else if (query.sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price)
  } else if (query.sort === 'rating') {
    products.sort((a, b) => b.rating - a.rating)
  }

  // Limit results
  if (query.limit) {
    products = products.slice(0, parseInt(query.limit as string))
  }

  // Get stock for all products (skip if KV not configured)
  let stocks: Record<string, number> = {}
  try {
    const productIds = products.map(p => p.id)
    stocks = await getMultipleStock(productIds)
  } catch (e) {
    // KV not configured, use default stock
    products.forEach(p => { stocks[p.id] = 100 })
  }

  // Merge stock data
  return products.map(product => ({
    ...product,
    stock: stocks[product.id] ?? 100,
    inStock: (stocks[product.id] ?? 100) > 0
  }))
})
