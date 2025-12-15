/**
 * Add item to cart
 * POST /api/cart
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.sessionId || !body.productId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID and Product ID are required'
    })
  }
  
  const quantity = body.quantity || 1
  
  // Verify product exists
  const stock = await getStock(body.productId)
  
  // Check stock
  const cart = await getCart(body.sessionId)
  const existingItem = cart.items.find(item => item.productId === body.productId)
  const newQuantity = (existingItem?.quantity || 0) + quantity
  
  if (stock < newQuantity) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Not enough stock available'
    })
  }
  
  const updatedCart = await addToCart(body.sessionId, body.productId, quantity)
  
  return {
    success: true,
    cart: updatedCart
  }
})
