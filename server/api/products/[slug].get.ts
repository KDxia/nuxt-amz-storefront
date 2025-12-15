/**
 * Get single product by slug
 * GET /api/products/:slug
 */
import { getStock } from '../../utils/inventory'

// Static product data
const staticProducts: Record<string, any> = {
  'wireless-earbuds-pro': {
    id: 'prod_001',
    slug: 'wireless-earbuds-pro',
    title: 'Wireless Earbuds Pro',
    price: 79.99,
    originalPrice: 99.99,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600'],
    category: 'electronics',
    rating: 4.5,
    reviewCount: 1250,
    featured: true,
    description: 'Experience premium sound quality with our Wireless Earbuds Pro.'
  },
  'smart-fitness-watch': {
    id: 'prod_002',
    slug: 'smart-fitness-watch',
    title: 'Smart Fitness Watch',
    price: 149.99,
    originalPrice: 199.99,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600'],
    category: 'electronics',
    rating: 4.7,
    reviewCount: 3420,
    featured: true,
    description: 'Track your fitness journey with our Smart Fitness Watch.'
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product slug is required'
    })
  }
  
  const product = staticProducts[slug]
  
  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found'
    })
  }
  
  // Get real-time stock (or default if KV not configured)
  let stock = 100
  try {
    stock = await getStock(product.id)
  } catch (e) {
    // KV not configured, use default
  }
  
  return {
    ...product,
    stock,
    inStock: stock > 0
  }
})
