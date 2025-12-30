/**
 * Generate client upload token for Vercel Blob
 * POST /api/admin/upload-token
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminKey = getHeader(event, 'x-admin-key')

  const expectedKey = config.adminKey || process.env.ADMIN_KEY || 'admin123'
  if (adminKey !== expectedKey) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const token = config.blobReadWriteToken || process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'BLOB_READ_WRITE_TOKEN is not configured'
    })
  }

  // Return token for client-side upload
  return { token }
})
