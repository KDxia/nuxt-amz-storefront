/**
 * Stripe Payment Utilities
 */
import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const config = useRuntimeConfig()
    stripeClient = new Stripe(config.stripeSecretKey, {
      apiVersion: '2024-11-20.acacia'
    })
  }
  return stripeClient
}

export interface CheckoutLineItem {
  productId: string
  title: string
  price: number
  quantity: number
  image?: string
}

export interface CreateCheckoutOptions {
  lineItems: CheckoutLineItem[]
  customerEmail?: string
  sessionId: string
  successUrl: string
  cancelUrl: string
  taxAmount?: number
  shippingAmount?: number
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(options: CreateCheckoutOptions): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient()
  const config = useRuntimeConfig()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = options.lineItems.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.title,
        images: item.image ? [item.image] : undefined
      },
      unit_amount: Math.round(item.price * 100) // Convert to cents
    },
    quantity: item.quantity
  }))

  // Add tax as a line item if provided
  if (options.taxAmount && options.taxAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Sales Tax'
        },
        unit_amount: Math.round(options.taxAmount * 100)
      },
      quantity: 1
    })
  }

  // Add shipping as a line item if provided
  if (options.shippingAmount && options.shippingAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping'
        },
        unit_amount: Math.round(options.shippingAmount * 100)
      },
      quantity: 1
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: options.customerEmail,
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      cartSessionId: options.sessionId
    },
    shipping_address_collection: {
      allowed_countries: ['US']
    },
    billing_address_collection: 'required'
  })

  return session
}

/**
 * Retrieve a Checkout Session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient()
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer']
  })
}

/**
 * Construct Stripe webhook event
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const stripe = getStripeClient()
  const config = useRuntimeConfig()
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripeWebhookSecret
  )
}
