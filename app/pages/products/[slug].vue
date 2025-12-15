<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="pending" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('product.not_found') }}</h1>
      <NuxtLink :to="localePath('/products')" class="text-blue-600 hover:underline">
        {{ $t('product.back_to_products') }}
      </NuxtLink>
    </div>
    
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Product Images -->
      <div>
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img 
            :src="selectedImage || 'https://via.placeholder.com/400'"
            :alt="product.title"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button 
            v-for="(image, index) in product.images" 
            :key="index"
            @click="selectedImage = image"
            class="aspect-square bg-gray-100 rounded overflow-hidden border-2"
            :class="selectedImage === image ? 'border-blue-500' : 'border-transparent'"
          >
            <img :src="image" :alt="`${product.title} ${index + 1}`" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>
      
      <!-- Product Info -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ $t(`products_data.${product.slug}`, product.title) }}</h1>
        
        <!-- Rating -->
        <div class="flex items-center mb-4">
          <div class="flex text-yellow-400">
            <svg v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span class="ml-2 text-gray-600">({{ product.reviewCount }} {{ $t('product.reviews') }})</span>
        </div>
        
        <!-- Price -->
        <div class="mb-6">
          <span class="text-3xl font-bold text-gray-900">${{ product.price }}</span>
          <span v-if="product.originalPrice" class="ml-2 text-lg text-gray-500 line-through">
            ${{ product.originalPrice }}
          </span>
          <span v-if="product.originalPrice" class="ml-2 text-green-600 font-semibold">
            {{ $t('product.save') }} {{ Math.round((1 - product.price / product.originalPrice) * 100) }}%
          </span>
        </div>
        
        <!-- Stock Status -->
        <div class="mb-6">
          <span v-if="product.inStock" class="text-green-600 font-semibold">
            ✓ {{ $t('product.in_stock') }} ({{ product.stock }} {{ $t('product.available') }})
          </span>
          <span v-else class="text-red-600 font-semibold">
            {{ $t('product.out_of_stock') }}
          </span>
        </div>
        
        <!-- Add to Cart -->
        <div class="flex items-center gap-4 mb-8">
          <div class="flex items-center border border-gray-300 rounded-lg">
            <button 
              @click="quantity = Math.max(1, quantity - 1)"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100"
            >
              -
            </button>
            <span class="px-4 py-2">{{ quantity }}</span>
            <button 
              @click="quantity = Math.min(product.stock, quantity + 1)"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100"
            >
              +
            </button>
          </div>
          
          <button 
            @click="handleAddToCart"
            :disabled="!product.inStock || cartLoading"
            class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {{ cartLoading ? $t('product.adding') : $t('product.add_to_cart') }}
          </button>
        </div>
        
        <!-- Product Description -->
        <div class="prose max-w-none">
          <ContentRenderer :value="product" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const route = useRoute()
const slug = route.params.slug as string

const { data: product, pending, error } = await useFetch(`/api/products/${slug}`)

const selectedImage = ref(product.value?.images?.[0] || '')
const quantity = ref(1)

const { addToCart, loading: cartLoading } = useCart()
const { trackProductView, trackAddToCart } = useAnalytics()

// Track product view
watch(product, (p) => {
  if (p) {
    selectedImage.value = p.images?.[0] || ''
    trackProductView({
      id: p.id,
      name: p.title,
      price: p.price,
      category: p.category
    })
  }
}, { immediate: true })

const handleAddToCart = async () => {
  if (!product.value) return
  
  const success = await addToCart(product.value.id, quantity.value)
  
  if (success) {
    trackAddToCart({
      id: product.value.id,
      name: product.value.title,
      price: product.value.price,
      quantity: quantity.value,
      category: product.value.category
    })
  }
}

useHead({
  title: computed(() => product.value ? `${product.value.title} - AMZ Store` : 'Product - AMZ Store'),
  meta: [
    { name: 'description', content: computed(() => product.value?.description || '') }
  ]
})
</script>
