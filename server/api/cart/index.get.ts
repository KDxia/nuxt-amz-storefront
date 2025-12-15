/**
 * Get cart
 * GET /api/cart
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = query.sessionId as string
  
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }
  
  const cart = await getCart(sessionId)
  return cart
})
