<template>
  <NuxtLink 
    :to="localePath(`/products/${product.slug}`)" 
    class="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
  >
    <!-- Product Image -->
    <div class="aspect-square bg-gray-100 overflow-hidden">
      <img 
        :src="product.images?.[0] || 'https://via.placeholder.com/400'"
        :alt="product.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    
    <!-- Product Info -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {{ $t(`products_data.${product.slug}`, product.title) }}
      </h3>
      
      <!-- Rating -->
      <div class="flex items-center mb-2">
        <div class="flex text-yellow-400">
          <svg v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <span class="ml-1 text-sm text-gray-500">({{ product.reviewCount }})</span>
      </div>
      
      <!-- Price -->
      <div class="flex items-center gap-2">
        <span class="text-lg font-bold text-gray-900">${{ product.price }}</span>
        <span v-if="product.originalPrice" class="text-sm text-gray-500 line-through">
          ${{ product.originalPrice }}
        </span>
      </div>
      
      <!-- Stock Status -->
      <div class="mt-2">
        <span v-if="product.inStock" class="text-sm text-green-600">{{ $t('product.in_stock') }}</span>
        <span v-else class="text-sm text-red-600">{{ $t('product.out_of_stock') }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Product {
  id: string
  slug: string
  title: string
  price: number
  originalPrice?: number
  images?: string[]
  rating: number
  reviewCount: number
  inStock: boolean
  stock: number
}

defineProps<{
  product: Product
}>()

const localePath = useLocalePath()
</script>
