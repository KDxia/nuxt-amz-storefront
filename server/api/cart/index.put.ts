/**
 * Update cart item quantity
 * PUT /api/cart
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.sessionId || !body.productId || body.quantity === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID, Product ID, and quantity are required'
    })
  }
  
  // Check stock if increasing quantity
  if (body.quantity > 0) {
    const stock = await getStock(body.productId)
    if (stock < body.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Not enough stock available'
      })
    }
  }
  
  const updatedCart = await updateCartItem(body.sessionId, body.productId, body.quantity)
  
  return {
    success: true,
    cart: updatedCart
  }
})
