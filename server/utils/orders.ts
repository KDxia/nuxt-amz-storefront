/**
 * Order Management Utilities
 * Uses Vercel Postgres for persistent order storage
 */
import { sql } from '@vercel/postgres'

export interface OrderItem {
  productId: string
  productTitle: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id?: string
  sessionId: string
  customerEmail: string
  stripeSessionId: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  items: OrderItem[]
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Initialize database tables (run once during setup)
 */
export async function initOrderTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR(255),
      customer_email VARCHAR(255) NOT NULL,
      stripe_session_id VARCHAR(255) UNIQUE,
      status VARCHAR(50) DEFAULT 'pending',
      subtotal DECIMAL(10,2) NOT NULL,
      tax DECIMAL(10,2) DEFAULT 0,
      shipping DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      shipping_address JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id VARCHAR(255) NOT NULL,
      product_title VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id)
  `
}

/**
 * Create a new order
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { rows } = await sql`
    INSERT INTO orders (
      session_id,
      customer_email,
      stripe_session_id,
      status,
      subtotal,
      tax,
      shipping,
      total,
      shipping_address
    ) VALUES (
      ${order.sessionId},
      ${order.customerEmail},
      ${order.stripeSessionId},
      ${order.status},
      ${order.subtotal},
      ${order.tax},
      ${order.shipping},
      ${order.total},
      ${JSON.stringify(order.shippingAddress)}
    )
    RETURNING id
  `

  const orderId = rows[0].id

  // Insert order items
  for (const item of order.items) {
    await sql`
      INSERT INTO order_items (
        order_id,
        product_id,
        product_title,
        quantity,
        unit_price
      ) VALUES (
        ${orderId},
        ${item.productId},
        ${item.productTitle},
        ${item.quantity},
        ${item.unitPrice}
      )
    `
  }

  return orderId
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { rows: orderRows } = await sql`
    SELECT * FROM orders WHERE id = ${orderId}
  `

  if (orderRows.length === 0) return null

  const order = orderRows[0]

  const { rows: itemRows } = await sql`
    SELECT * FROM order_items WHERE order_id = ${orderId}
  `

  return {
    id: order.id,
    sessionId: order.session_id,
    customerEmail: order.customer_email,
    stripeSessionId: order.stripe_session_id,
    status: order.status,
    subtotal: parseFloat(order.subtotal),
    tax: parseFloat(order.tax),
    shipping: parseFloat(order.shipping),
    total: parseFloat(order.total),
    shippingAddress: order.shipping_address,
    items: itemRows.map(item => ({
      productId: item.product_id,
      productTitle: item.product_title,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price)
    })),
    createdAt: order.created_at,
    updatedAt: order.updated_at
  }
}

/**
 * Get order by Stripe session ID
 */
export async function getOrderByStripeSession(stripeSessionId: string): Promise<Order | null> {
  const { rows } = await sql`
    SELECT id FROM orders WHERE stripe_session_id = ${stripeSessionId}
  `

  if (rows.length === 0) return null

  return getOrderById(rows[0].id)
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  await sql`
    UPDATE orders
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${orderId}
  `
}

/**
 * Get orders by customer email
 */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const { rows } = await sql`
    SELECT id FROM orders
    WHERE customer_email = ${email}
    ORDER BY created_at DESC
  `

  const orders: Order[] = []
  for (const row of rows) {
    const order = await getOrderById(row.id)
    if (order) orders.push(order)
  }

  return orders
}
