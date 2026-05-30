
export type Currency = 'USD' | 'NGN' | 'EUR' | 'GBP' | 'BTC' | 'ETH';

export interface ExchangeRate {
  code: Currency;
  rate: number; // Rate relative to USD (1 USD = rate)
  symbol: string;
}

export const EXCHANGE_RATES: Record<Currency, ExchangeRate> = {
  USD: { code: 'USD', rate: 1, symbol: '$' },
  NGN: { code: 'NGN', rate: 1600, symbol: '₦' },
  EUR: { code: 'EUR', rate: 0.92, symbol: '€' },
  GBP: { code: 'GBP', rate: 0.79, symbol: '£' },
  BTC: { code: 'BTC', rate: 0.000015, symbol: '₿' },
  ETH: { code: 'ETH', rate: 0.00026, symbol: 'Ξ' },
};

/**
 * Converts an amount from one currency to another
 */
export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  
  // Convert to USD first
  const usdAmount = amount / EXCHANGE_RATES[from].rate;
  // Convert from USD to target
  return usdAmount * EXCHANGE_RATES[to].rate;
}

/**
 * Formats a currency amount with the appropriate symbol
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = EXCHANGE_RATES[currency].symbol;
  
  if (currency === 'BTC' || currency === 'ETH') {
    return `${symbol}${amount.toFixed(6)}`;
  }
  
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Detects the suggested currency based on country code
 */
export function getCurrencyForCountry(countryCode?: string): Currency {
  if (!countryCode) return 'USD';
  
  const mapping: Record<string, Currency> = {
    'NG': 'NGN',
    'GB': 'GBP',
    'US': 'USD',
    'EU': 'EUR',
    // Add more mappings as needed
  };
  
  return mapping[countryCode.toUpperCase()] || 'USD';
}
