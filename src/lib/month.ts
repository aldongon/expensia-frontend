// Helpers for the visible month. The design has no month picker: every screen shows the current
// month, since GET /api/budgets/current is always relative to it.

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function todayIso(): string {
  const now = new Date();

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentMonth(): string {
  return todayIso().slice(0, 7);
}

export function nextMonth(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number);
  const date = new Date(year, month, 1);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthDays(monthIso: string): number {
  const [year, month] = monthIso.split('-').map(Number);

  return new Date(year, month, 0).getDate();
}

export function dayOfMonth(dateIso: string): number {
  return Number(dateIso.slice(8, 10));
}

/** Days remaining in the month, today included — matches the backend's dailyBudget definition. */
export function daysRemaining(monthIso: string): number {
  const total = monthDays(monthIso);
  const today = currentMonth() === monthIso ? dayOfMonth(todayIso()) : 1;

  return total - today + 1;
}

export function isCurrentOrNextMonth(monthIso: string): boolean {
  return monthIso === currentMonth() || monthIso === nextMonth(currentMonth());
}
