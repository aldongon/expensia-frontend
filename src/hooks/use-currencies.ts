import { useQuery } from '@tanstack/react-query';

import { fetchCurrencies } from '@/lib/api/currencies';
import { queryKeys } from '@/lib/query-keys';

export function useCurrencies() {
  return useQuery({
    queryKey: queryKeys.currencies(),
    queryFn: fetchCurrencies,
  });
}
