<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">库存管理</h1>
      
      <!-- Login -->
      <div v-if="!isLoggedIn" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">管理员登录</h2>
        <div class="flex gap-4">
          <input 
            v-model="adminKey" 
            type="password" 
            placeholder="输入管理密钥"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            @keyup.enter="login"
          />
          <button 
            @click="login"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            登录
          </button>
        </div>
        <p v-if="loginError" class="text-red-500 mt-2">{{ loginError }}</p>
      </div>
      
      <!-- Inventory Table -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold">商品库存</h2>
          <button @click="logout" class="text-gray-500 hover:text-gray-700">退出登录</button>
        </div>
        
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        
        <table v-else class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">商品ID</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">商品名称</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">价格</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">库存</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="product in products" :key="product.id">
              <td class="px-6 py-4 text-sm text-gray-500">{{ product.id }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ product.title }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${{ product.price }}</td>
              <td class="px-6 py-4">
                <input 
                  v-model.number="product.newStock"
                  type="number"
                  min="0"
                  class="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </td>
              <td class="px-6 py-4">
                <button 
                  @click="updateStock(product)"
                  :disabled="product.updating"
                  class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {{ product.updating ? '保存中...' : '保存' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="message" class="p-4 bg-green-50 text-green-700 border-t">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const adminKey = ref('')
const isLoggedIn = ref(false)
const loginError = ref('')
const loading = ref(false)
const message = ref('')
const products = ref<Array<{
  id: string
  slug: string
  title: string
  price: number
  stock: number
  newStock: number
  updating: boolean
}>>([])

const login = async () => {
  loginError.value = ''
  loading.value = true
  
  try {
    const data = await $fetch('/api/admin/inventory', {
      headers: { 'x-admin-key': adminKey.value }
    })
    
    products.value = (data as any[]).map(p => ({
      ...p,
      newStock: p.stock,
      updating: false
    }))
    isLoggedIn.value = true
    
    // Save key to session
    sessionStorage.setItem('adminKey', adminKey.value)
  } catch (error: any) {
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

const updateStock = async (product: any) => {
  product.updating = true
  message.value = ''
  
  try {
    await $fetch('/api/admin/inventory', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey.value },
      body: {
        productId: product.id,
        quantity: product.newStock
      }
    })
    
    product.stock = product.newStock
    message.value = `${product.title} 库存已更新为 ${product.newStock}`
  } catch (error) {
    message.value = '更新失败'
  } finally {
    product.updating = false
  }
}

// Check for saved session
onMounted(() => {
  const savedKey = sessionStorage.getItem('adminKey')
  if (savedKey) {
    adminKey.value = savedKey
    login()
  }
})
</script>
