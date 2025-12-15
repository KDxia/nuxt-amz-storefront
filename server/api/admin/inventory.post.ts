/**
 * Set product stock
 * POST /api/admin/inventory
 */
import { setStock, getStock } from '../../utils/inventory'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Simple admin key check (set ADMIN_KEY in .env)
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')
  
  const expectedKey = config.adminKey || process.env.ADMIN_KEY || 'admin123'
  if (adminKey !== expectedKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  
  const { productId, quantity } = body
  
  if (!productId || quantity === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'productId and quantity are required'
    })
  }
  
  await setStock(productId, quantity)
  const newStock = await getStock(productId)
  
  return {
    success: true,
    productId,
    stock: newStock
  }
})
