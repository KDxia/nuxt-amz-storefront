/**
 * Stripe Webhook Handler
 * POST /api/webhook/stripe
 */
import { constructWebhookEvent, getCheckoutSession } from '../../utils/stripe'
import { clearCart } from '../../utils/cart'
import { decrementStock } from '../../utils/inventory'
import { createOrder } from '../../utils/orders'
import { sendOrderConfirmationEmail } from '../../utils/email'
import type Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, 'stripe-signature')
  
  if (!signature) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Stripe signature'
    })
  }
  
  // Get raw body for signature verification
  const rawBody = await readRawBody(event)
  
  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing request body'
    })
  }
  
  let stripeEvent: Stripe.Event
  
  try {
    stripeEvent = await constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid signature'
    })
  }
  
  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session)
      break
    }
    
    case 'checkout.session.expired': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      console.log(`Checkout session expired: ${session.id}`)
      // Optionally trigger abandoned cart email here
      break
    }
    
    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`)
  }
  
  return { received: true }
})

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const cartSessionId = session.metadata?.cartSessionId
  
  if (!cartSessionId) {
    console.error('No cart session ID in checkout session metadata')
    return
  }
  
  // Get full session with line items
  const fullSession = await getCheckoutSession(session.id)
  
  // Extract shipping address
  const shippingDetails = fullSession.shipping_details
  const shippingAddress = shippingDetails?.address ? {
    name: shippingDetails.name || '',
    line1: shippingDetails.address.line1 || '',
    line2: shippingDetails.address.line2 || undefined,
    city: shippingDetails.address.city || '',
    state: shippingDetails.address.state || '',
    postalCode: shippingDetails.address.postal_code || '',
    country: shippingDetails.address.country || 'US'
  } : undefined
  
  // Calculate totals from Stripe session
  const total = (fullSession.amount_total || 0) / 100
  const subtotal = (fullSession.amount_subtotal || 0) / 100
  const tax = total - subtotal // Simplified tax calculation
  
  // Build order items from line items
  const orderItems = fullSession.line_items?.data
    .filter(item => item.description !== 'Sales Tax' && item.description !== 'Shipping')
    .map(item => ({
      productId: '', // Would need to extract from metadata
      productTitle: item.description || 'Product',
      quantity: item.quantity || 1,
      unitPrice: (item.amount_total || 0) / 100 / (item.quantity || 1)
    })) || []
  
  // Create order in database
  const orderId = await createOrder({
    sessionId: cartSessionId,
    customerEmail: fullSession.customer_email || '',
    stripeSessionId: session.id,
    status: 'paid',
    subtotal,
    tax,
    shipping: 0,
    total,
    shippingAddress,
    items: orderItems
  })
  
  // Decrement stock for each item
  // Note: In production, you'd want to track which products were ordered
  // and decrement their specific stock
  
  // Clear the cart
  await clearCart(cartSessionId)
  
  // Send confirmation email
  const order = await import('../../utils/orders').then(m => m.getOrderById(orderId))
  if (order) {
    try {
      await sendOrderConfirmationEmail(order)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }
  }
  
  console.log(`Order ${orderId} created successfully for session ${session.id}`)
}
