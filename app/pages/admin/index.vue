<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">商品管理后台</h1>
      
      <!-- Login -->
      <div v-if="!isLoggedIn" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">管理员登录</h2>
        <div class="flex gap-4">
          <input 
            v-model="adminKey" 
            type="password" 
            placeholder="输入管理密钥"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            @keyup.enter="login"
          />
          <button @click="login" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            登录
          </button>
        </div>
        <p v-if="loginError" class="text-red-500 mt-2">{{ loginError }}</p>
      </div>
      
      <!-- Admin Panel -->
      <div v-else>
        <div class="flex justify-between items-center mb-6">
          <button @click="showAddForm = true" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            + 添加商品
          </button>
          <button @click="logout" class="text-gray-500 hover:text-gray-700">退出登录</button>
        </div>
        
        <!-- Add/Edit Form Modal -->
        <div v-if="showAddForm || editingProduct" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-semibold mb-4">{{ editingProduct ? '编辑商品' : '添加商品' }}</h2>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">商品ID *</label>
                <input v-model="form.id" type="text" :disabled="!!editingProduct" class="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100" placeholder="prod_003" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input v-model="form.slug" type="text" class="w-full px-3 py-2 border rounded-lg" placeholder="product-name" />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">商品名称 *</label>
                <input v-model="form.title" type="text" class="w-full px-3 py-2 border rounded-lg" placeholder="商品名称" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">价格 *</label>
                <input v-model.number="form.price" type="number" step="0.01" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">原价</label>
                <input v-model.number="form.originalPrice" type="number" step="0.01" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">库存</label>
                <input v-model.number="form.stock" type="number" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input v-model="form.category" type="text" class="w-full px-3 py-2 border rounded-lg" placeholder="electronics" />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">商品图片 (支持粘贴URL / 上传文件)</label>
                <textarea v-model="form.imagesText" rows="3" class="w-full px-3 py-2 border rounded-lg" placeholder="https://example.com/image1.jpg"></textarea>

                <div class="mt-2 flex items-center gap-3">
                  <input
                    ref="imageInput"
                    type="file"
                    accept="image/*"
                    multiple
                    class="block w-full text-sm text-gray-700"
                    @change="uploadSelectedImages"
                  />
                  <button
                    type="button"
                    class="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
                    :disabled="uploading"
                    @click="imageInput?.click()"
                  >
                    {{ uploading ? '上传中...' : '选择图片' }}
                  </button>
                </div>
                <p v-if="uploadError" class="mt-1 text-sm text-red-600 whitespace-pre-line">{{ uploadError }}</p>
                <p class="mt-1 text-xs text-gray-500">上传会保存到 Vercel Blob,并自动把图片URL追加到上面的列表（每行一个）。<br>单张图片最大 10MB。</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">评分</label>
                <input v-model.number="form.rating" type="number" step="0.1" min="0" max="5" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">评价数</label>
                <input v-model.number="form.reviewCount" type="number" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div class="col-span-2">
                <label class="flex items-center">
                  <input v-model="form.featured" type="checkbox" class="mr-2" />
                  <span class="text-sm font-medium text-gray-700">精选商品 (显示在首页)</span>
                </label>
              </div>
            </div>
            
            <div class="flex justify-end gap-4 mt-6">
              <button @click="cancelForm" class="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
              <button @click="saveProduct" :disabled="saving" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Products Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div v-if="loading" class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          
          <table v-else class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">图片</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">商品名称</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">价格</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">库存</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">精选</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="product in products" :key="product.id">
                <td class="px-4 py-3">
                  <img :src="product.images?.[0]" class="w-12 h-12 object-cover rounded" />
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ product.title }}</div>
                  <div class="text-sm text-gray-500">{{ product.id }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-900">${{ product.price }}</div>
                  <div v-if="product.originalPrice" class="text-sm text-gray-500 line-through">${{ product.originalPrice }}</div>
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-model.number="product.newStock"
                    type="number"
                    min="0"
                    class="w-20 px-2 py-1 border rounded"
                    @change="updateStock(product)"
                  />
                </td>
                <td class="px-4 py-3">
                  <span v-if="product.featured" class="text-green-600">✓</span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-3">
                  <button @click="editProduct(product)" class="text-blue-600 hover:underline mr-3">编辑</button>
                  <button @click="deleteProduct(product)" class="text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-if="message" class="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">{{ message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

interface Product {
  id: string
  slug: string
  title: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  rating: number
  reviewCount: number
  featured: boolean
  stock?: number
  newStock?: number
}

const adminKey = ref('')
const isLoggedIn = ref(false)
const loginError = ref('')
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const uploadError = ref('')
const imageInput = ref<HTMLInputElement | null>(null)

const message = ref('')
const products = ref<Product[]>([])
const showAddForm = ref(false)
const editingProduct = ref<Product | null>(null)


const form = reactive({
  id: '',
  slug: '',
  title: '',
  price: 0,
  originalPrice: 0,
  stock: 100,
  category: 'electronics',
  imagesText: '',
  rating: 4.5,
  reviewCount: 0,
  featured: false
})

const login = async () => {
  loginError.value = ''
  loading.value = true
  try {
    const data = await $fetch('/api/admin/products', {
      headers: { 'x-admin-key': adminKey.value }
    })
    products.value = (data as Product[]).map(p => ({ ...p, newStock: p.stock }))
    isLoggedIn.value = true
    sessionStorage.setItem('adminKey', adminKey.value)
  } catch {
    loginError.value = '密钥错误'
  } finally {
    loading.value = false
  }
}

const logout = () => {
  isLoggedIn.value = false
  adminKey.value = ''
  products.value = []
  sessionStorage.removeItem('adminKey')
}

const resetForm = () => {
  form.id = ''
  form.slug = ''
  form.title = ''
  form.price = 0
  form.originalPrice = 0
  form.stock = 100
  form.category = 'electronics'
  form.imagesText = ''
  form.rating = 4.5
  form.reviewCount = 0
  form.featured = false
}

const cancelForm = () => {
  showAddForm.value = false
  editingProduct.value = null
  resetForm()
}

const editProduct = (product: Product) => {
  editingProduct.value = product
  form.id = product.id
  form.slug = product.slug
  form.title = product.title
  form.price = product.price
  form.originalPrice = product.originalPrice || 0
  form.stock = product.stock || 100
  form.category = product.category
  form.imagesText = product.images?.join('\n') || ''
  form.rating = product.rating
  form.reviewCount = product.reviewCount
  form.featured = product.featured
}

const uploadSelectedImages = async (e: Event) => {
  uploadError.value = ''
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  if (!adminKey.value) {
    uploadError.value = '请先登录后台'
    return
  }

  // 检查每张图片大小(10MB = 10 * 1024 * 1024 bytes)
  const maxSize = 10 * 1024 * 1024
  const oversized: string[] = []
  
  for (const file of Array.from(input.files)) {
    if (file.size > maxSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2)
      oversized.push(`${file.name} (${sizeMB}MB)`)
    }
  }

  if (oversized.length > 0) {
    uploadError.value = `以下图片超过 10MB 限制，请压缩后再上传:\n${oversized.join('\n')}`
    input.value = ''
    return
  }

  uploading.value = true
  try {
    const fd = new FormData()
    for (const file of Array.from(input.files)) {
      fd.append('files', file)
    }

    const res = await $fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey.value },
      body: fd
    })

    const urls: string[] = ((res as any)?.files || []).map((f: any) => f?.url).filter(Boolean)
    if (urls.length > 0) {
      const current = form.imagesText.trim()
      form.imagesText = current ? `${current}\n${urls.join('\n')}` : urls.join('\n')
    }
  } catch (err: any) {
    uploadError.value = err?.data?.statusMessage || err?.message || '上传失败'
  } finally {
    uploading.value = false
    input.value = ''
  }
}


const saveProduct = async () => {
  if (!form.id || !form.slug || !form.title || !form.price) {
    message.value = '请填写必填字段'
    return
  }
  
  saving.value = true
  try {
    const product: Product = {
      id: form.id,
      slug: form.slug,
      title: form.title,
      price: form.price,
      originalPrice: form.originalPrice || undefined,
      images: form.imagesText.split('\n').filter(s => s.trim()),
      category: form.category,
      rating: form.rating,
      reviewCount: form.reviewCount,
      featured: form.featured
    }
    
    await $fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey.value },
      body: { product, stock: form.stock }
    })
    
    message.value = editingProduct.value ? '商品已更新' : '商品已添加'
    cancelForm()
    await login() // Refresh list
  } catch {
    message.value = '保存失败'
  } finally {
    saving.value = false
  }
}

const updateStock = async (product: Product) => {
  try {
    await $fetch('/api/admin/inventory', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey.value },
      body: { productId: product.id, quantity: product.newStock }
    })
    product.stock = product.newStock
    message.value = `${product.title} 库存已更新为 ${product.newStock}`
  } catch {
    message.value = '更新库存失败'
  }
}

const deleteProduct = async (product: Product) => {
  if (!confirm(`确定删除 "${product.title}" 吗？`)) return
  
  try {
    await $fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey.value },
      body: { productId: product.id }
    })
    message.value = '商品已删除'
    await login() // Refresh list
  } catch {
    message.value = '删除失败'
  }
}

onMounted(() => {
  const savedKey = sessionStorage.getItem('adminKey')
  if (savedKey) {
    adminKey.value = savedKey
    login()
  }
})
</script>
