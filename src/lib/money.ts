/**
 * Money helpers for the API's decimal-string amounts.
 *
 * Amounts arrive as exact decimal strings at their currency's `scale` and must never round-trip
 * through a JS `number` (that would lose precision for large/high-scale values). We work in integer
 * minor units backed by `bigint` and only format for display.
 */

const DECIMAL_RE = /^\d*\.?\d*$/;

/**
 * Parse a decimal input string into signed integer minor units at `scale`, or `null` when the
 * value is empty, malformed, or has more fraction digits than the currency allows.
 */
export function parseDecimalToUnits(value: string, scale: number): bigint | null {
  const trimmed = value.trim();

  if (!trimmed || !DECIMAL_RE.test(trimmed)) {
    return null;
  }

  const [intPart = '', fracPart = ''] = trimmed.split('.');

  if (fracPart.length > scale) {
    return null;
  }

  const digits = `${intPart || '0'}${fracPart.padEnd(scale, '0')}`;

  try {
    return BigInt(digits);
  } catch {
    return null;
  }
}

/** Sum a list of API amount strings sharing one `scale` into integer minor units. */
export function sumUnits(amounts: string[], scale: number): bigint {
  return amounts.reduce<bigint>((total, amount) => {
    const units = parseDecimalToUnits(amount, scale);

    return units === null ? total : total + units;
  }, BigInt(0));
}

/** Format integer minor units as an es-AR decimal string (no currency code). */
export function formatUnits(units: bigint, scale: number): string {
  const negative = units < BigInt(0);
  const magnitude = negative ? -units : units;
  const digits = magnitude.toString().padStart(scale + 1, '0');
  const intPart = digits.slice(0, digits.length - scale) || '0';
  const fracPart = scale > 0 ? digits.slice(digits.length - scale) : '';

  const intFormatted = new Intl.NumberFormat('es-AR').format(BigInt(intPart));
  const body = scale > 0 ? `${intFormatted},${fracPart}` : intFormatted;

  return negative ? `-${body}` : body;
}

/** Format a single API amount string for display at the given scale. */
export function formatApiAmount(value: string, scale: number): string {
  const units = parseDecimalToUnits(value, scale);

  if (units === null) {
    return value;
  }

  return formatUnits(units, scale);
}
