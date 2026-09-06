// Centralized TanStack Query keys so invalidations stay consistent across screens.

export const queryKeys = {
  expenses: (month: string) => ['expenses', month] as const,
  budgetCurrent: () => ['budget', 'current'] as const,
  budgetHistory: (months: number) => ['budget', 'history', months] as const,
  recurringExpenses: () => ['recurring-expenses'] as const,
  currencies: () => ['currencies'] as const,
  tags: () => ['tags'] as const,
  paymentMethods: () => ['payment-methods'] as const,
};
