/**
 * Get all products
 * GET /api/products
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
  featured: boolean
}

// Default products (fallback)
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
  const query = getQuery(event)
  
  // Get products from storage or use defaults
  const kv = await useStorage('data')
  let products: Product[] = (await kv.getItem('products') as Product[] | null) || defaultProducts
  
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
