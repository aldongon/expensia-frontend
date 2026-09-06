// Types mirroring init-instructions/api/project-description-and-endpoints.md exactly.
// Amounts are always exact decimal strings in responses; never widen them to `number`.

export type TokenResponse = {
  token: string;
  expiresAt: string;
};

export type ExpenseResponse = {
  id: number;
  amount: string;
  currencyCode: string;
  expenseDate: string;
  description: string;
  tags: string[];
  paymentMethod: string | null;
  settlementAmount: string | null;
  settlementCurrencyCode: string | null;
  recurringExpenseId: number | null;
  createdAt: string;
};

export type ExpenseRequest = {
  amount: number;
  currencyCode: string;
  expenseDate?: string;
  description?: string;
  tagNames?: string[];
  paymentMethodName?: string;
  settlementAmount?: number;
  settlementCurrencyCode?: string;
};

export type RecurringRuleResponse = {
  id: number;
  amount: string;
  currencyCode: string;
  paymentMethod: string | null;
  startMonth: string;
  endMonth: string | null;
};

export type RecurringExpenseResponse = {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  currentRule: RecurringRuleResponse | null;
  ruleHistory: RecurringRuleResponse[];
  createdAt: string;
};

export type CreateRecurringExpenseRequest = {
  name: string;
  amount: number;
  currencyCode: string;
  startMonth: string;
  description?: string;
  paymentMethodName?: string;
  tagNames?: string[];
};

export type UpdateRecurringExpenseRequest = {
  name: string;
  description?: string;
  tagNames?: string[];
};

export type PriceChangeRequest = {
  amount: number;
  currencyCode?: string;
  paymentMethodName?: string;
};

export type BudgetResponse = {
  id: number;
  month: string;
  amount: string;
  currencyCode: string;
  createdAt: string;
};

export type CreateBudgetRequest = {
  amount: number;
  currencyCode: string;
  month: string;
};

export type BudgetSummaryResponse = {
  month: string;
  currencyCode: string;
  totalBudget: string;
  remainingBudget: string;
  dailyBudget: string;
};

export type BudgetHistoryEntry = {
  month: string;
  currencyCode: string;
  budgetAmount: string;
  spentAmount: string;
  remainingAmount: string;
  overBudget: boolean;
};

export type CurrencyResponse = {
  id: number;
  code: string;
  name: string;
  scale: number;
};

export type CurrencyRequest = {
  code: string;
  name: string;
  scale: number;
};

export type TagResponse = {
  id: number;
  name: string;
};

export type NameRequest = {
  name: string;
};

export type PaymentMethodResponse = {
  id: number;
  name: string;
};
