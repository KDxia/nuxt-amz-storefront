/**
 * Product Management - Delete Product
 * DELETE /api/admin/products
 */

interface Product {
  id: string
  slug: string
  title: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  rating: number
  reviewCount: number
  description?: string
  featured: boolean
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')
  
  if (adminKey !== config.adminKey) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const body = await readBody(event)
  const { productId } = body
  
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'productId is required' })
  }
  
  // Get existing products
  const kv = await useStorage('data')
  let products: Product[] = await kv.getItem('products') || []
  
  const initialLength = products.length
  products = products.filter(p => p.id !== productId)
  
  if (products.length === initialLength) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  
  // Save products
  await kv.setItem('products', products)
  
  return {
    success: true,
    deletedId: productId
  }
})
