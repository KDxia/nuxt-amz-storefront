/**
 * Product Management - Get All Products
 * GET /api/admin/products
 */
import { getMultipleStock } from '../../utils/inventory'

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

// Default products (used for initial data)
const defaultProducts: Product[] = [
  {
    id: 'prod_001',
    slug: 'wireless-earbuds-pro',
    title: 'Wireless Earbuds Pro',
    price: 79.99,
    originalPrice: 99.99,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
    category: 'electronics',
    rating: 4.5,
    reviewCount: 1250,
    featured: true
  },
  {
    id: 'prod_002',
    slug: 'smart-fitness-watch',
    title: 'Smart Fitness Watch',
    price: 149.99,
    originalPrice: 199.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    category: 'electronics',
    rating: 4.7,
    reviewCount: 3420,
    featured: true
  }
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')
  
  const expectedKey = process.env.ADMIN_KEY || config.adminKey || 'admin123'
  console.log('Expected:', expectedKey, 'Got:', adminKey, 'ENV:', process.env.ADMIN_KEY)
  if (adminKey !== expectedKey) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  // Get products from storage
  const kv = await useStorage('data')
  let products: Product[] = await kv.getItem('products') || []
  
  // Initialize with default products if empty
  if (products.length === 0) {
    products = defaultProducts
    await kv.setItem('products', products)
  }
  
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
