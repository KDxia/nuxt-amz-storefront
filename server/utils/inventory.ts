/**
 * Inventory Management Utilities
 * Uses Vercel KV for real-time stock tracking
 */
import { createClient } from '@vercel/kv'

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

/**
 * Get stock quantity for a product
 */
export async function getStock(productId: string): Promise<number> {
  try {
    const kv = getKVClient()
    const stock = await kv.get<number>(`inventory:${productId}`)
    return stock ?? 0
  } catch (error) {
    console.error(`Failed to get stock for ${productId}:`, error)
    return 0
  }
}

/**
 * Set stock quantity for a product
 */
export async function setStock(productId: string, quantity: number): Promise<void> {
  const kv = getKVClient()
  await kv.set(`inventory:${productId}`, quantity)
}

/**
 * Decrement stock atomically (prevents overselling)
 */
export async function decrementStock(productId: string, amount: number): Promise<number> {
  const kv = getKVClient()
  const newStock = await kv.decrby(`inventory:${productId}`, amount)
  
  if (newStock < 0) {
    // Rollback if oversold
    await kv.incrby(`inventory:${productId}`, amount)
    throw new Error(`Insufficient stock for product ${productId}`)
  }
  
  return newStock
}

/**
 * Increment stock (for restocking or order cancellation)
 */
export async function incrementStock(productId: string, amount: number): Promise<number> {
  const kv = getKVClient()
  return await kv.incrby(`inventory:${productId}`, amount)
}

/**
 * Get stock for multiple products
 */
export async function getMultipleStock(productIds: string[]): Promise<Record<string, number>> {
  const kv = getKVClient()
  const keys = productIds.map(id => `inventory:${id}`)
  const values = await kv.mget<number[]>(...keys)
  
  const result: Record<string, number> = {}
  productIds.forEach((id, index) => {
    result[id] = values[index] ?? 0
  })
  
  return result
}
