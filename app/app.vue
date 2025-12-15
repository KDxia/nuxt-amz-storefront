<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Initialize analytics on client side
const config = useRuntimeConfig()

// Analytics scripts will be loaded via plugins
// GA4 and Facebook Pixel configuration is done through runtime config
</script>
