/**
 * Get all products with stock
 * GET /api/admin/inventory
 */
import { getMultipleStock } from '../../utils/inventory'
import { getProducts } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')

  const expectedKey = config.adminKey || process.env.ADMIN_KEY || 'admin123'
  if (adminKey !== expectedKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const products = await getProducts()

  try {
    const productIds = products.map(p => p.id)
    const stocks = await getMultipleStock(productIds)

    return products.map(product => ({
      ...product,
      stock: stocks[product.id] ?? 0
    }))
  } catch (error) {
    // KV not configured, return with default stock
    return products.map(product => ({
      ...product,
      stock: 100
    }))
  }
})
