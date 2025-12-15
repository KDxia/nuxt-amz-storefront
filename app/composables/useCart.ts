/**
 * Cart composable
 * Manages shopping cart state on the client side
 */
import { v4 as uuidv4 } from 'uuid'

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

const CART_SESSION_KEY = 'cart_session_id'

export function useCart() {
  const cart = useState<Cart>('cart', () => ({
    items: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }))
  
  const loading = useState('cartLoading', () => false)
  const error = useState<string | null>('cartError', () => null)
  
  // Get or create session ID
  const getSessionId = (): string => {
    if (import.meta.client) {
      let sessionId = localStorage.getItem(CART_SESSION_KEY)
      if (!sessionId) {
        sessionId = uuidv4()
        localStorage.setItem(CART_SESSION_KEY, sessionId)
      }
      return sessionId
    }
    return ''
  }
  
  // Fetch cart from server
  const fetchCart = async () => {
    const sessionId = getSessionId()
    if (!sessionId) return
    
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<Cart>('/api/cart', {
        query: { sessionId }
      })
      cart.value = data
    } catch (e) {
      console.error('Failed to fetch cart:', e)
      error.value = 'Failed to load cart'
    } finally {
      loading.value = false
    }
  }
  
  // Add item to cart
  const addToCart = async (productId: string, quantity: number = 1) => {
    const sessionId = getSessionId()
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<{ success: boolean; cart: Cart }>('/api/cart', {
        method: 'POST',
        body: { sessionId, productId, quantity }
      })
      cart.value = data.cart
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || 'Failed to add item'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Update item quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    const sessionId = getSessionId()
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<{ success: boolean; cart: Cart }>('/api/cart', {
        method: 'PUT',
        body: { sessionId, productId, quantity }
      })
      cart.value = data.cart
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || 'Failed to update item'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    const sessionId = getSessionId()
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<{ success: boolean; cart: Cart }>('/api/cart', {
        method: 'DELETE',
        body: { sessionId, productId }
      })
      cart.value = data.cart
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || 'Failed to remove item'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Get cart item count
  const itemCount = computed(() => {
    return cart.value.items.reduce((sum, item) => sum + item.quantity, 0)
  })
  
  // Checkout
  const checkout = async (email?: string, state?: string) => {
    const sessionId = getSessionId()
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<{ url: string; sessionId: string }>('/api/checkout', {
        method: 'POST',
        body: { sessionId, email, state }
      })
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
      return true
    } catch (e: any) {
      error.value = e.data?.statusMessage || 'Failed to checkout'
      return false
    } finally {
      loading.value = false
    }
  }
  
  return {
    cart: readonly(cart),
    loading: readonly(loading),
    error: readonly(error),
    itemCount,
    getSessionId,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    checkout
  }
}
