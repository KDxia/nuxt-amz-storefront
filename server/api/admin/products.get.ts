/**
 * Product Management - Get All Products
 * GET /api/admin/products
 */
import { getMultipleStock } from '../../utils/inventory'
import { getProducts } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')
  
  const expectedKey = process.env.ADMIN_KEY || config.adminKey || 'admin123'
  console.log('Expected:', expectedKey, 'Got:', adminKey, 'ENV:', process.env.ADMIN_KEY)
  if (adminKey !== expectedKey) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  // Get products from Vercel KV
  const products = await getProducts()
  
  // Get stock for all products
  try {
    const productIds = products.map(p => p.id)
    const stocks = await getMultipleStock(productIds)
    
    return products.map(product => ({
      ...product,
      stock: stocks[product.id] ?? 100
    }))
  } catch (error) {
    return products.map(product => ({
      ...product,
      stock: 100
    }))
  }
})
