/**
 * Admin Image Upload (Vercel Blob)
 * POST /api/admin/upload
 * multipart/form-data: field name `file` or `files`
 */
import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'

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

  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'multipart/form-data is required' })
  }

  const parts = form.filter(p => (p.name === 'file' || p.name === 'files') && p.data)
  if (parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file found in form-data (file/files)' })
  }

  const uploads = [] as Array<{ url: string; pathname: string; contentType?: string; size: number }>

  for (const part of parts) {
    const contentType = part.type || 'application/octet-stream'
    if (!contentType.startsWith('image/')) {
      throw createError({ statusCode: 400, statusMessage: `Only image uploads are allowed: ${contentType}` })
    }

    // Vercel Functions have request size limits; keep this conservative.
    if (part.data.length > 10 * 1024 * 1024) {
      throw createError({ statusCode: 413, statusMessage: `图片 ${part.filename || 'unknown'} 太大 (超过 10MB)，请压缩后再上传。` })
    }

    const originalName = part.filename || 'image'
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const pathname = `products/${Date.now()}-${randomUUID()}-${safeName}`

    const blob = await put(pathname, part.data, {
      access: 'public',
      contentType,
      token
    })

    uploads.push({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: part.data.length
    })
  }

  return { success: true, files: uploads }
})
