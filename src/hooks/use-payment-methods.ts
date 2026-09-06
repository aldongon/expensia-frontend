import { useQuery } from '@tanstack/react-query';

import { fetchPaymentMethods } from '@/lib/api/payment-methods';
import { queryKeys } from '@/lib/query-keys';

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.paymentMethods(),
    queryFn: fetchPaymentMethods,
  });
}
