/**
 * Delete item from cart
 * DELETE /api/cart
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.sessionId || !body.productId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID and Product ID are required'
    })
  }
  
  const updatedCart = await removeFromCart(body.sessionId, body.productId)
  
  return {
    success: true,
    cart: updatedCart
  }
})
