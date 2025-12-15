/**
 * Product Management - Create/Update Product
 * POST /api/admin/products
 */
import { setStock } from '../../utils/inventory'

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
  const { product, stock } = body as { product: Product; stock?: number }
  
  if (!product || !product.id || !product.slug || !product.title) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'product.id, product.slug, and product.title are required' 
    })
  }
  
  // Get existing products from KV
  const kv = await useStorage('data')
  let products: Product[] = await kv.getItem('products') || []
  
  // Check if updating or creating
  const existingIndex = products.findIndex(p => p.id === product.id)
  
  if (existingIndex >= 0) {
    // Update existing product
    products[existingIndex] = { ...products[existingIndex], ...product }
  } else {
    // Add new product
    products.push(product)
  }
  
  // Save products
  await kv.setItem('products', products)
  
  // Set stock if provided
  if (stock !== undefined) {
    await setStock(product.id, stock)
  }
  
  return {
    success: true,
    product,
    isNew: existingIndex < 0
  }
})
