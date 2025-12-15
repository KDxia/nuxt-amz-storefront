// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },

  // Modules
  modules: ['@nuxt/content', '@nuxtjs/tailwindcss', '@nuxtjs/i18n'],
  
    // i18n configuration
    i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', name: '中文', file: 'zh.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' }
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      fallbackLocale: 'en'
    }
  },

  // Content module configuration
  content: {
    // Configure content sources
    sources: {
      content: {
        driver: 'fs',
        base: './content'
      }
    }
  },

  // Runtime config (environment variables)
  runtimeConfig: {
    // Private keys (server-side only)
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    kvRestApiUrl: process.env.KV_REST_API_URL,
    kvRestApiToken: process.env.KV_REST_API_TOKEN,
    postgresUrl: process.env.POSTGRES_URL,
    taxjarApiKey: process.env.TAXJAR_API_KEY,
        adminKey: process.env.ADMIN_KEY || 'admin123',

    // Public keys (client-side accessible)
    public: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      ga4MeasurementId: process.env.GA4_MEASUREMENT_ID,
      fbPixelId: process.env.FB_PIXEL_ID
    }
  },

  // Nitro server configuration
  nitro: {
    preset: 'vercel'
  },

  // App configuration
  app: {
    head: {
      title: 'AMZ Storefront',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Premium products from Amazon' }
      ]
    }
  }
})
