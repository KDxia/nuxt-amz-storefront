/**
 * Email Utilities using Resend
 */
import { Resend } from 'resend'
import type { Order } from './orders'

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const config = useRuntimeConfig()
    resendClient = new Resend(config.resendApiKey)
  }
  return resendClient
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  const resend = getResendClient()
  const config = useRuntimeConfig()

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productTitle}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">Thank you for your order!</h1>
      
      <p>Hi there,</p>
      <p>We've received your order and it's being processed. Here are your order details:</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
            <td style="padding: 10px; text-align: right;">$${order.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
            <td style="padding: 10px; text-align: right;">$${order.shipping.toFixed(2)}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
            <td style="padding: 10px; text-align: right;"><strong>$${order.total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      ${order.shippingAddress ? `
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Shipping Address</h3>
          <p style="margin: 5px 0;">${order.shippingAddress.name}</p>
          <p style="margin: 5px 0;">${order.shippingAddress.line1}</p>
          ${order.shippingAddress.line2 ? `<p style="margin: 5px 0;">${order.shippingAddress.line2}</p>` : ''}
          <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
        </div>
      ` : ''}

      <p>If you have any questions, please reply to this email.</p>
      
      <p>Thanks,<br>AMZ Storefront Team</p>
    </body>
    </html>
  `

  await resend.emails.send({
    from: 'orders@yourdomain.com', // Replace with your verified domain
    to: order.customerEmail,
    subject: `Order Confirmation #${order.id?.slice(0, 8)}`,
    html
  })
}

/**
 * Send abandoned cart reminder email
 */
export async function sendAbandonedCartEmail(
  email: string,
  cartItems: Array<{ title: string; price: number; quantity: number }>
): Promise<void> {
  const resend = getResendClient()
  const config = useRuntimeConfig()

  const itemsHtml = cartItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('')

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You left something behind!</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">Don't forget your items!</h1>
      
      <p>Hi there,</p>
      <p>You left some great items in your cart. Complete your purchase before they're gone!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #f5f5f5;">
            <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
            <td style="padding: 10px; text-align: right;"><strong>$${total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.public.siteUrl}/cart" 
           style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Complete Your Purchase
        </a>
      </div>

      <p style="color: #666; font-size: 12px;">
        If you don't want to receive these emails, simply ignore this message.
      </p>
    </body>
    </html>
  `

  await resend.emails.send({
    from: 'store@yourdomain.com', // Replace with your verified domain
    to: email,
    subject: "You left something in your cart!",
    html
  })
}
