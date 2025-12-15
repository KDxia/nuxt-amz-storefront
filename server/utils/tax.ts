/**
 * Tax Calculation Utilities
 * Supports TaxJar API or manual state tax rates
 */

// Manual tax rates for common US states (as percentage)
// Update these based on your Nexus states
const STATE_TAX_RATES: Record<string, number> = {
  'CA': 0.0725,  // California
  'TX': 0.0625,  // Texas
  'NY': 0.08,    // New York
  'FL': 0.06,    // Florida
  'WA': 0.065,   // Washington
  // Add more states as needed
}

export interface TaxCalculationResult {
  rate: number
  amount: number
  state: string
  breakdown?: {
    state: number
    county: number
    city: number
    special: number
  }
}

/**
 * Calculate tax using manual rates
 */
export function calculateTaxManual(
  subtotal: number,
  state: string
): TaxCalculationResult {
  const stateUpper = state.toUpperCase()
  const rate = STATE_TAX_RATES[stateUpper] || 0
  
  return {
    rate,
    amount: subtotal * rate,
    state: stateUpper
  }
}

/**
 * Calculate tax using TaxJar API
 * Note: TaxJar free tier has limited API calls
 */
export async function calculateTaxTaxJar(
  subtotal: number,
  toAddress: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
): Promise<TaxCalculationResult> {
  const config = useRuntimeConfig()
  
  // If no TaxJar API key, fall back to manual calculation
  if (!config.taxjarApiKey) {
    return calculateTaxManual(subtotal, toAddress.state)
  }

  try {
    const response = await fetch('https://api.taxjar.com/v2/taxes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.taxjarApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_country: 'US',
        from_zip: '90210', // Your business zip code
        from_state: 'CA',  // Your business state
        to_country: toAddress.country,
        to_zip: toAddress.zip,
        to_state: toAddress.state,
        to_city: toAddress.city,
        to_street: toAddress.street,
        amount: subtotal,
        shipping: 0
      })
    })

    if (!response.ok) {
      console.error('TaxJar API error:', await response.text())
      return calculateTaxManual(subtotal, toAddress.state)
    }

    const data = await response.json()
    
    return {
      rate: data.tax.rate,
      amount: data.tax.amount_to_collect,
      state: toAddress.state,
      breakdown: data.tax.breakdown ? {
        state: data.tax.breakdown.state_tax_rate || 0,
        county: data.tax.breakdown.county_tax_rate || 0,
        city: data.tax.breakdown.city_tax_rate || 0,
        special: data.tax.breakdown.special_tax_rate || 0
      } : undefined
    }
  } catch (error) {
    console.error('TaxJar calculation failed:', error)
    return calculateTaxManual(subtotal, toAddress.state)
  }
}

/**
 * Get all configured tax states
 */
export function getConfiguredTaxStates(): string[] {
  return Object.keys(STATE_TAX_RATES)
}

/**
 * Check if a state has tax nexus
 */
export function hasNexus(state: string): boolean {
  return state.toUpperCase() in STATE_TAX_RATES
}
