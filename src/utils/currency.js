// Currency Utilities & Live FX Rates Fetcher

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

const DEFAULT_RATES = {
  INR: 1,
  USD: 0.0116,
  EUR: 0.0107,
  GBP: 0.0092,
  JPY: 1.78,
};

const CACHE_KEY = 'moneytracker_fx_rates';
const CACHE_TIME_KEY = 'moneytracker_fx_timestamp';
const ONE_HOUR = 60 * 60 * 1000;

export async function fetchLiveRates(baseCurrency = 'INR') {
  // Check cache first
  try {
    const cachedTime = localStorage.getItem(`${CACHE_TIME_KEY}_${baseCurrency}`);
    const cachedRates = localStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);

    if (cachedTime && cachedRates && Date.now() - parseInt(cachedTime, 10) < ONE_HOUR) {
      return JSON.parse(cachedRates);
    }
  } catch (e) {}

  // Fetch live from open exchange rates API
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!res.ok) throw new Error('FX fetch failed');
    const data = await res.json();
    if (data.result === 'success' && data.rates) {
      localStorage.setItem(`${CACHE_KEY}_${baseCurrency}`, JSON.stringify(data.rates));
      localStorage.setItem(`${CACHE_TIME_KEY}_${baseCurrency}`, String(Date.now()));
      return data.rates;
    }
  } catch (err) {
    console.warn('Live FX rate fetch failed, using fallback/cached rates:', err);
  }

  // Fallback to cached or defaults
  try {
    const cachedRates = localStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
    if (cachedRates) return JSON.parse(cachedRates);
  } catch (e) {}

  return DEFAULT_RATES;
}

export function convertAmount(amount, fromCurrency, toCurrency, rates = {}) {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;

  // If rates are relative to base (e.g., INR)
  const fromRate = rates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1;
  const toRate = rates[toCurrency] || DEFAULT_RATES[toCurrency] || 1;

  // Amount in base currency = amount / fromRate
  // Amount in target currency = (amount / fromRate) * toRate
  return (amount / fromRate) * toRate;
}

export function getSymbol(currencyCodeOrSymbol) {
  const match = CURRENCIES.find(c => c.code === currencyCodeOrSymbol || c.symbol === currencyCodeOrSymbol);
  return match ? match.symbol : currencyCodeOrSymbol;
}
