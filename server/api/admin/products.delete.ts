/**
 * Product Management - Delete Product
 * DELETE /api/admin/products
 */
import { deleteProduct } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')
  
  const expectedKey = config.adminKey || process.env.ADMIN_KEY || 'admin123'
  if (adminKey !== expectedKey) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const body = await readBody(event)
  const { productId } = body
  
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'productId is required' })
  }
  
  // Delete product using Vercel KV
  const deleted = await deleteProduct(productId)
  
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  
  return {
    success: true,
    deletedId: productId
  }
})
