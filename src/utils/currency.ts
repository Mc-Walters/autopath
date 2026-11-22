import { CurrencyConfig } from '../types';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', rate: 1.0, name: 'USD - US Dollar' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, name: 'EUR - Euro' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, name: 'GBP - British Pound' },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.36, name: 'CAD - Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'AU$', rate: 1.52, name: 'AUD - Australian Dollar' },
  JPY: { code: 'JPY', symbol: '¥', rate: 155.0, name: 'JPY - Japanese Yen' },
};

export const LANGUAGES = [
  { code: 'en', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
];

export function formatPrice(amountInUSD: number, currencyCode: string = 'USD'): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = amountInUSD * currency.rate;

  if (currency.code === 'JPY') {
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  }

  if (converted < 1) {
    return `${currency.symbol}${converted.toFixed(2)}`;
  }

  return `${currency.symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPriceRange(
  minUSD: number,
  maxUSD: number,
  currencyCode: string = 'USD',
  unit: string = 'Piece'
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const minConverted = minUSD * currency.rate;
  const maxConverted = maxUSD * currency.rate;

  const minFormatted =
    currency.code === 'JPY'
      ? `${currency.symbol}${Math.round(minConverted)}`
      : `${currency.symbol}${minConverted.toFixed(2)}`;
  const maxFormatted =
    currency.code === 'JPY'
      ? `${currency.symbol}${Math.round(maxConverted)}`
      : `${currency.symbol}${maxConverted.toFixed(2)}`;

  return `${minFormatted} - ${maxFormatted} / ${unit}`;
}
