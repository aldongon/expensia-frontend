import type { CurrencyResponse } from '@/types/api';

export function scaleOf(currencies: CurrencyResponse[], code: string): number {
  return currencies.find((currency) => currency.code === code)?.scale ?? 2;
}
