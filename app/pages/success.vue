<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
    <div class="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
      <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Thank You for Your Order!</h1>
    
    <p class="text-lg text-gray-600 mb-8">
      Your order has been confirmed and is being processed. 
      You'll receive an email confirmation shortly.
    </p>
    
    <div v-if="sessionId" class="bg-gray-50 rounded-lg p-6 mb-8">
      <p class="text-sm text-gray-500 mb-2">Order Reference</p>
      <p class="font-mono text-gray-900">{{ sessionId.slice(0, 20) }}...</p>
    </div>
    
    <div class="space-x-4">
      <NuxtLink 
        to="/products" 
        class="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Continue Shopping
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sessionId = route.query.session_id as string

const { trackPurchase } = useAnalytics()

// Track purchase on mount
onMounted(() => {
  if (sessionId) {
    // In a real app, you'd fetch order details and track with actual values
    trackPurchase(sessionId, 0, [])
  }
})

useHead({
  title: 'Order Confirmed - AMZ Store'
})
</script>
