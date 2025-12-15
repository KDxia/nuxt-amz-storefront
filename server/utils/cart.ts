/**
 * Shopping Cart Utilities
 * Uses Vercel KV for cart persistence (with in-memory fallback for local dev)
 */
import { createClient } from '@vercel/kv'

export interface CartItem {
  productId: string
  quantity: number
  addedAt: number
}

export interface Cart {
  items: CartItem[]
  email?: string
  createdAt: number
  updatedAt: number
}

// In-memory storage for local development
const memoryStore = new Map<string, { data: Cart; expiry: number }>()

let kvClient: ReturnType<typeof createClient> | null = null
let useMemoryFallback = false

function getKVClient() {
  if (useMemoryFallback) return null
  
  if (!kvClient) {
    const config = useRuntimeConfig()
    // Check if KV is configured
    if (!config.kvRestApiUrl || !config.kvRestApiToken) {
      console.warn('[Cart] Vercel KV not configured, using in-memory storage')
      useMemoryFallback = true
      return null
    }
    kvClient = createClient({
      url: config.kvRestApiUrl,
      token: config.kvRestApiToken
    })
  }
  return kvClient
}

// Memory storage helpers
function memoryGet<T>(key: string): T | null {
  const item = memoryStore.get(key)
  if (!item) return null
  if (Date.now() > item.expiry) {
    memoryStore.delete(key)
    return null
  }
  return item.data as T
}

function memorySet(key: string, data: Cart, expirySeconds: number): void {
  memoryStore.set(key, {
    data,
    expiry: Date.now() + expirySeconds * 1000
  })
}

function memoryDel(key: string): void {
  memoryStore.delete(key)
}

const CART_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds

/**
 * Get cart by session ID
 */
export async function getCart(sessionId: string): Promise<Cart> {
  const emptyCart: Cart = {
    items: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  try {
    const kv = getKVClient()
    
    // Use memory fallback
    if (!kv) {
      return memoryGet<Cart>(`cart:${sessionId}`) ?? emptyCart
    }
    
    const cart = await kv.get<Cart>(`cart:${sessionId}`)
    return cart ?? emptyCart
  } catch (error) {
    console.error(`Failed to get cart for ${sessionId}:`, error)
    return emptyCart
  }
}

/**
 * Save cart
 */
export async function saveCart(sessionId: string, cart: Cart): Promise<void> {
  cart.updatedAt = Date.now()
  const kv = getKVClient()
  
  // Use memory fallback
  if (!kv) {
    memorySet(`cart:${sessionId}`, cart, CART_EXPIRY)
    return
  }
  
  await kv.set(`cart:${sessionId}`, cart, { ex: CART_EXPIRY })
}

/**
 * Add item to cart
 */
export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number = 1
): Promise<Cart> {
  const cart = await getCart(sessionId)
  const existingIndex = cart.items.findIndex(item => item.productId === productId)

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += quantity
  } else {
    cart.items.push({
      productId,
      quantity,
      addedAt: Date.now()
    })
  }

  await saveCart(sessionId, cart)
  return cart
}

/**
 * Update item quantity in cart
 */
export async function updateCartItem(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<Cart> {
  const cart = await getCart(sessionId)
  const existingIndex = cart.items.findIndex(item => item.productId === productId)

  if (existingIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(existingIndex, 1)
    } else {
      cart.items[existingIndex].quantity = quantity
    }
  }

  await saveCart(sessionId, cart)
  return cart
}

/**
 * Remove item from cart
 */
export async function removeFromCart(sessionId: string, productId: string): Promise<Cart> {
  return updateCartItem(sessionId, productId, 0)
}

/**
 * Clear cart
 */
export async function clearCart(sessionId: string): Promise<void> {
  const kv = getKVClient()
  
  // Use memory fallback
  if (!kv) {
    memoryDel(`cart:${sessionId}`)
    return
  }
  
  await kv.del(`cart:${sessionId}`)
}

/**
 * Set customer email for cart (used for abandoned cart emails)
 */
export async function setCartEmail(sessionId: string, email: string): Promise<Cart> {
  const cart = await getCart(sessionId)
  cart.email = email
  await saveCart(sessionId, cart)
  return cart
}

/**
 * Get abandoned carts (for cron job processing)
 * Note: This requires scanning keys, which may need optimization for large scale
 */
export async function getAbandonedCarts(olderThanHours: number = 24): Promise<string[]> {
  const kv = getKVClient()
  const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
  const keys: string[] = []
  
  // Use memory fallback
  if (!kv) {
    for (const [key, item] of memoryStore.entries()) {
      if (key.startsWith('cart:') && item.data.email && item.data.items.length > 0 && item.data.updatedAt < cutoffTime) {
        keys.push(key)
      }
    }
    return keys
  }
  
  // Scan for cart keys
  for await (const key of kv.scanIterator({ match: 'cart:*' })) {
    const cart = await kv.get<Cart>(key)
    if (cart && cart.email && cart.items.length > 0 && cart.updatedAt < cutoffTime) {
      keys.push(key)
    }
  }
  
  return keys
}
