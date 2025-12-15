/**
 * Analytics Plugin
 * Loads GA4 and Facebook Pixel scripts
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  if (import.meta.client) {
    // Load GA4
    if (config.public.ga4MeasurementId) {
      const gaScript = document.createElement('script')
      gaScript.async = true
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${config.public.ga4MeasurementId}`
      document.head.appendChild(gaScript)

      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }
      window.gtag = gtag
      gtag('js', new Date())
      gtag('config', config.public.ga4MeasurementId)
    }

    // Load Facebook Pixel
    if (config.public.fbPixelId) {
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        }
        if (!f._fbq) f._fbq = n
        n.push = n
        n.loaded = !0
        n.version = '2.0'
        n.queue = []
        t = b.createElement(e)
        t.async = !0
        t.src = v
        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
      
      window.fbq('init', config.public.fbPixelId)
      window.fbq('track', 'PageView')
    }
  }
})

// Extend Window interface
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
    fbq: (...args: any[]) => void
  }
}
