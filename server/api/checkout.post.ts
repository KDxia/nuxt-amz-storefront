/**
 * Create Stripe Checkout Session
 * POST /api/checkout
 */
import { createCheckoutSession, type CheckoutLineItem } from '../utils/stripe'
import { getCart, setCartEmail } from '../utils/cart'
import { getStock } from '../utils/inventory'
import { calculateTaxManual } from '../utils/tax'

// Simple product lookup (in production, fetch from content API)
const products: Record<string, any> = {
  'prod_001': { id: 'prod_001', title: 'Wireless Earbuds Pro', price: 79.99, images: ['/images/products/earbuds-1.jpg'] },
  'prod_002': { id: 'prod_002', title: 'Smart Fitness Watch', price: 149.99, images: ['/images/products/watch-1.jpg'] }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  
  if (!body.sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }
  
  // Get cart
  const cart = await getCart(body.sessionId)
  
  if (cart.items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cart is empty'
    })
  }
  
  // Store email for abandoned cart tracking
  if (body.email) {
    await setCartEmail(body.sessionId, body.email)
  }
  
  // Build line items and verify stock
  const lineItems: CheckoutLineItem[] = []
  let subtotal = 0
  
  for (const item of cart.items) {
    // Get product details from simple lookup
    const product = products[item.productId]
    
    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `Product ${item.productId} not found`
      })
    }
    
    // Verify stock
    const stock = await getStock(item.productId)
    if (stock < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Not enough stock for ${product.title}`
      })
    }
    
    lineItems.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.images?.[0]
    })
    
    subtotal += product.price * item.quantity
  }
  
  // Calculate tax (default to CA for now, will be recalculated after shipping address)
  const taxResult = calculateTaxManual(subtotal, body.state || 'CA')
  
  // Create Stripe checkout session
  const session = await createCheckoutSession({
    lineItems,
    customerEmail: body.email,
    sessionId: body.sessionId,
    successUrl: `${config.public.siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${config.public.siteUrl}/cart`,
    taxAmount: taxResult.amount,
    shippingAmount: 0 // Free shipping or calculate based on rules
  })
  
  return {
    url: session.url,
    sessionId: session.id
  }
})
