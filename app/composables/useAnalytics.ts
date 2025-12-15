/**
 * Analytics composable
 * Handles GA4 and Facebook Pixel tracking
 */
export function useAnalytics() {
  const config = useRuntimeConfig()
  
  // Track page view
  const trackPageView = (path?: string) => {
    if (!import.meta.client) return
    
    // GA4
    if (config.public.ga4MeasurementId && window.gtag) {
      window.gtag('config', config.public.ga4MeasurementId, {
        page_path: path || window.location.pathname
      })
    }
    
    // Facebook Pixel
    if (config.public.fbPixelId && window.fbq) {
      window.fbq('track', 'PageView')
    }
  }
  
  // Track product view
  const trackProductView = (product: {
    id: string
    name: string
    price: number
    category?: string
  }) => {
    if (!import.meta.client) return
    
    // GA4
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category
        }]
      })
    }
    
    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'USD'
      })
    }
  }
  
  // Track add to cart
  const trackAddToCart = (product: {
    id: string
    name: string
    price: number
    quantity: number
    category?: string
  }) => {
    if (!import.meta.client) return
    
    // GA4
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: product.price * product.quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
          item_category: product.category
        }]
      })
    }
    
    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price * product.quantity,
        currency: 'USD'
      })
    }
  }
  
  // Track begin checkout
  const trackBeginCheckout = (items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>, total: number) => {
    if (!import.meta.client) return
    
    // GA4
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: total,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      })
    }
    
    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: items.map(item => item.id),
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        value: total,
        currency: 'USD'
      })
    }
  }
  
  // Track purchase
  const trackPurchase = (orderId: string, total: number, items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>) => {
    if (!import.meta.client) return
    
    // GA4
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderId,
        currency: 'USD',
        value: total,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      })
    }
    
    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: items.map(item => item.id),
        content_type: 'product',
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        value: total,
        currency: 'USD'
      })
    }
  }
  
  return {
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase
  }
}

// Extend Window interface for analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    fbq: (...args: any[]) => void
  }
}
