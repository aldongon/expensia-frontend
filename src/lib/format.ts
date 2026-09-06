// es-AR display formatting. Amounts are formatted straight from the decimal string; see decimal.ts
// for arithmetic. Formatting itself is safe with Intl/Number since it never re-derives a total.

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const MONTH_LABELS_FULL = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const WEEKDAY_LABELS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function formatAmount(value: string, currencyCode: string, scale: number): string {
  const number = Number(value);
  const formatted = number.toLocaleString('es-AR', {
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  });

  return `${formatted} ${currencyCode}`;
}

/** Parses a YYYY-MM-DD date-only string as a local date, without timezone shifting. */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function formatDayMonth(dateIso: string): string {
  const date = parseIsoDate(dateIso);

  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
}

export function formatMonthYear(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number);

  return `${MONTH_LABELS[month - 1]} ${year}`;
}

/** Full month name, e.g. "septiembre 2026" — used for the Resumen header. */
export function formatMonthYearFull(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number);

  return `${MONTH_LABELS_FULL[month - 1]} ${year}`;
}

export function monthAbbrev(dateIso: string): string {
  return MONTH_LABELS[parseIsoDate(dateIso).getMonth()];
}

export function weekdayName(dateIso: string): string {
  return WEEKDAY_LABELS[parseIsoDate(dateIso).getDay()];
}

export function monthLabelUppercase(monthIso: string): string {
  return formatMonthYear(monthIso).toUpperCase();
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
