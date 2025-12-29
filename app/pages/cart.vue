<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ $t('cart.title') }}</h1>
    
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    
    <div v-else-if="cart.items.length === 0" class="text-center py-16">
      <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-600 mb-4">{{ $t('cart.empty') }}</h2>
      <NuxtLink :to="localePath('/products')" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
        {{ $t('cart.continue_shopping') }}
      </NuxtLink>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Cart Items -->
      <div class="lg:col-span-2 space-y-4">
        <div 
          v-for="item in cartItemsWithProducts" 
          :key="item.productId"
          class="bg-white rounded-lg shadow p-4 flex gap-4"
        >
          <div class="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <img 
              :src="item.product?.images?.[0] || 'https://via.placeholder.com/400'"
              :alt="item.product?.title"
              class="w-full h-full object-cover"
            />
          </div>
          
          <div class="flex-grow">
            <NuxtLink 
              :to="localePath({ path: `/products/${encodeSlugForPath(item.product?.slug || '')}`, query: { id: item.productId } })"
              class="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
            >
              {{ item.product?.title || 'Loading...' }}
            </NuxtLink>
            
            <div class="text-lg font-bold text-gray-900 mt-1">
              ${{ item.product?.price?.toFixed(2) }}
            </div>
            
            <div class="flex items-center gap-4 mt-2">
              <div class="flex items-center border border-gray-300 rounded">
                <button 
                  @click="updateQuantity(item.productId, item.quantity - 1)"
                  class="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span class="px-3 py-1">{{ item.quantity }}</span>
                <button 
                  @click="updateQuantity(item.productId, item.quantity + 1)"
                  class="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              
              <button 
                @click="removeFromCart(item.productId)"
                class="text-red-600 hover:text-red-800 text-sm"
              >
                {{ $t('cart.remove') }}
              </button>
            </div>
          </div>
          
          <div class="text-right">
            <span class="font-bold text-gray-900">
              ${{ ((item.product?.price || 0) * item.quantity).toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow p-6 sticky top-24">
          <h2 class="text-xl font-bold text-gray-900 mb-4">{{ $t('cart.title') }}</h2>
          
          <div class="space-y-2 mb-4">
            <div class="flex justify-between">
              <span class="text-gray-600">{{ $t('cart.subtotal') }}</span>
              <span class="font-semibold">${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">{{ $t('cart.tax') }}</span>
              <span class="font-semibold">${{ estimatedTax.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">{{ $t('cart.shipping') }}</span>
              <span class="font-semibold text-green-600">{{ $t('cart.free') }}</span>
            </div>
          </div>
          
          <div class="border-t pt-4 mb-6">
            <div class="flex justify-between">
              <span class="text-lg font-bold">{{ $t('cart.total') }}</span>
              <span class="text-lg font-bold">${{ total.toFixed(2) }}</span>
            </div>
          </div>
          
          <!-- Email Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('cart.email_label') }}</label>
            <input 
              v-model="email"
              type="email" 
              :placeholder="$t('cart.email_placeholder')"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button 
            @click="handleCheckout"
            :disabled="checkoutLoading || !email"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {{ checkoutLoading ? $t('cart.processing') : $t('cart.checkout') }}
          </button>
          
          <p class="text-xs text-gray-500 text-center mt-4">
            {{ $t('cart.secure_checkout') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { cart, loading, updateQuantity, removeFromCart, checkout } = useCart()

const encodeSlugForPath = (slug: string) => slug.split('/').map(encodeURIComponent).join('/')
const { trackBeginCheckout } = useAnalytics()

const email = ref('')
const checkoutLoading = ref(false)

// Fetch product details for cart items
const { data: products } = await useFetch('/api/products')

const cartItemsWithProducts = computed(() => {
  return cart.value.items.map(item => ({
    ...item,
    product: products.value?.find((p: any) => p.id === item.productId)
  }))
})

const subtotal = computed(() => {
  return cartItemsWithProducts.value.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity
  }, 0)
})

const estimatedTax = computed(() => {
  return subtotal.value * 0.0725 // Default CA tax rate
})

const total = computed(() => {
  return subtotal.value + estimatedTax.value
})

const handleCheckout = async () => {
  if (!email.value) return
  
  checkoutLoading.value = true
  
  // Track checkout event
  trackBeginCheckout(
    cartItemsWithProducts.value.map(item => ({
      id: item.productId,
      name: item.product?.title || '',
      price: item.product?.price || 0,
      quantity: item.quantity
    })),
    total.value
  )
  
  await checkout(email.value)
  checkoutLoading.value = false
}

useHead({
  title: 'Shopping Cart - AMZ Store'
})
</script>
