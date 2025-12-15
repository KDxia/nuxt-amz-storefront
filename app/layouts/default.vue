<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <NuxtLink :to="localePath('/')" class="flex items-center">
            <span class="text-xl font-bold text-gray-900">{{ $t('common.store_name') }}</span>
          </NuxtLink>
          
          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <NuxtLink :to="localePath('/')" class="text-gray-600 hover:text-gray-900">{{ $t('common.home') }}</NuxtLink>
            <NuxtLink :to="localePath('/products')" class="text-gray-600 hover:text-gray-900">{{ $t('common.products') }}</NuxtLink>
          </nav>
          
          <!-- Right Actions -->
          <div class="flex items-center space-x-4">
            <!-- Language Switcher -->
            <div class="relative" ref="langDropdown">
              <button 
                @click="showLangMenu = !showLangMenu"
                class="flex items-center text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
              >
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm">{{ currentLocaleName }}</span>
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                v-if="showLangMenu"
                class="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-50"
              >
                <button
                  v-for="loc in availableLocales"
                  :key="loc.code"
                  @click="switchLocale(loc.code)"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  :class="{ 'bg-blue-50 text-blue-600': locale === loc.code }"
                >
                  {{ loc.name }}
                </button>
              </div>
            </div>
            
            <!-- Cart -->
            <NuxtLink :to="localePath('/cart')" class="relative p-2">
              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span 
                v-if="cartItemCount > 0" 
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
              >
                {{ cartItemCount }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="flex-grow">
      <slot />
    </main>
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <p>&copy; {{ new Date().getFullYear() }} {{ $t('common.store_name') }}. {{ $t('footer.rights') }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const { itemCount: cartItemCount, fetchCart } = useCart()

const showLangMenu = ref(false)
const langDropdown = ref<HTMLElement | null>(null)

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).filter(l => l.code !== locale.value)
})

const currentLocaleName = computed(() => {
  const current = (locales.value as Array<{ code: string; name: string }>).find(l => l.code === locale.value)
  return current?.name || locale.value.toUpperCase()
})

const switchLocale = async (code: string) => {
  await setLocale(code)
  showLangMenu.value = false
}

// Close dropdown when clicking outside
onMounted(() => {
  fetchCart()
  
  const handleClickOutside = (e: MouseEvent) => {
    if (langDropdown.value && !langDropdown.value.contains(e.target as Node)) {
      showLangMenu.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => document.removeEventListener('click', handleClickOutside))
})
</script>
