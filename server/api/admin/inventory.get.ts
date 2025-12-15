/**
 * Get all products with stock
 * GET /api/admin/inventory
 */
import { getMultipleStock } from '../../utils/inventory'

// Import static products list
const staticProducts = [
  { id: 'prod_001', slug: 'wireless-earbuds-pro', title: 'Wireless Earbuds Pro', price: 79.99 },
  { id: 'prod_002', slug: 'smart-fitness-watch', title: 'Smart Fitness Watch', price: 149.99 }
]

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
  
  try {
    const productIds = staticProducts.map(p => p.id)
    const stocks = await getMultipleStock(productIds)
    
    return staticProducts.map(product => ({
      ...product,
      stock: stocks[product.id] ?? 0
    }))
  } catch (error) {
    // KV not configured, return with default stock
    return staticProducts.map(product => ({
      ...product,
      stock: 100
    }))
  }
})
