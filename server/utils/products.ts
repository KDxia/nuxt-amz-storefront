/**
 * Product Storage Utilities
 * Uses Vercel KV for product data persistence
 */
import { createClient } from '@vercel/kv'

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

const PRODUCTS_KEY = 'products:all'

let kvClient: ReturnType<typeof createClient> | null = null

function getKVClient() {
  if (!kvClient) {
    const config = useRuntimeConfig()
    kvClient = createClient({
      url: config.kvRestApiUrl,
      token: config.kvRestApiToken
    })
  }
  return kvClient
}

// Default products
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

/**
 * Get all products from KV
 */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    // normalize common unicode dashes to '-'
    .replace(/[‐‑‒–—―]/g, '-')
    // treat separators as '-'
    .replace(/[\s/]+/g, '-')
    // replace '&' with 'and'
    .replace(/&/g, 'and')
    // drop any remaining characters that are not url-friendly
    .replace(/[^a-z0-9-]/g, '-')
    // collapse dashes
    .replace(/-+/g, '-')
    // trim dashes
    .replace(/^-|-$/g, '')
}

export async function getProducts(): Promise<Product[]> {
  try {
    const kv = getKVClient()
    const products = await kv.get<Product[]>(PRODUCTS_KEY)
    
    if (!products || products.length === 0) {
      // Initialize with default products
      await kv.set(PRODUCTS_KEY, defaultProducts)
      return defaultProducts
    }
    
    return products
  } catch (error) {
    console.error('Failed to get products:', error)
    return defaultProducts
  }
}

/**
 * Save all products to KV
 */
export async function saveProducts(products: Product[]): Promise<void> {
  const kv = getKVClient()
  await kv.set(PRODUCTS_KEY, products)
}

/**
 * Add or update a product
 */
export async function upsertProduct(product: Product): Promise<boolean> {
  const products = await getProducts()
  const existingIndex = products.findIndex(p => p.id === product.id)
  
  if (existingIndex >= 0) {
    products[existingIndex] = { ...products[existingIndex], ...product }
  } else {
    products.push(product)
  }
  
  await saveProducts(products)
  return existingIndex < 0 // true if new product
}

/**
 * Delete a product by ID
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  const products = await getProducts()
  const initialLength = products.length
  const filtered = products.filter(p => p.id !== productId)
  
  if (filtered.length === initialLength) {
    return false // Product not found
  }
  
  await saveProducts(filtered)
  return true
}

export type { Product }
