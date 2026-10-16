import type { ExpenseResponse, RecurringExpenseResponse } from '@/types/api';

export function recurringNamesById(recurring: RecurringExpenseResponse[]): Map<number, string> {
  return new Map(recurring.map((item) => [item.id, item.name]));
}

// Auto-generated occurrences carry no description of their own; fall back to the recurring name.
export function expenseLabel(
  expense: ExpenseResponse,
  recurringNames: Map<number, string>
): string {
  if (expense.description) {
    return expense.description;
  }

  const recurringName =
    expense.recurringExpenseId !== null
      ? recurringNames.get(expense.recurringExpenseId)
      : undefined;

  return recurringName ?? '(sin descripción)';
}
