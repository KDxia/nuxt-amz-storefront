<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ $t('product.all_products') }}</h1>
    
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-8">
      <select 
        v-model="sortBy" 
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{{ $t('product.sort_by') }}</option>
        <option value="price-asc">{{ $t('product.price_low_high') }}</option>
        <option value="price-desc">{{ $t('product.price_high_low') }}</option>
        <option value="rating">{{ $t('product.top_rated') }}</option>
      </select>
    </div>
    
    <!-- Products Grid -->
    <div v-if="pending" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-8 text-red-500">
      Failed to load products
    </div>
    
    <div v-else-if="products?.length === 0" class="text-center py-8 text-gray-500">
      No products found
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const sortBy = ref('')

const { data: products, pending, error, refresh } = await useFetch('/api/products', {
  query: computed(() => ({
    sort: sortBy.value || undefined
  }))
})

// Refresh when sort changes
watch(sortBy, () => {
  refresh()
})

useHead({
  title: 'Products - AMZ Store',
  meta: [
    { name: 'description', content: 'Browse our full catalog of premium products.' }
  ]
})
</script>
