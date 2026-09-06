// Exact arithmetic over the decimal-string amounts the API sends/receives, using scaled BigInts
// instead of floats. Never do `Number(amount)` to sum or persist a value — see AGENTS.md.

/** Parses a decimal string like "1234.50" into a BigInt scaled by `scale` (e.g. 123450 for scale 2). */
export function parseScaled(value: string, scale: number): bigint {
  const negative = value.trim().startsWith('-');
  const unsigned = value.trim().replace(/^-/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  const paddedFraction = (fraction + '0'.repeat(scale)).slice(0, scale);
  const digits = `${whole || '0'}${paddedFraction}`;
  const magnitude = BigInt(digits === '' ? '0' : digits);

  return negative ? -magnitude : magnitude;
}

/** Formats a scaled BigInt back into a plain decimal string, e.g. 123450n at scale 2 -> "1234.50". */
export function formatScaledPlain(scaledValue: bigint, scale: number): string {
  const negative = scaledValue < 0n;
  const magnitude = negative ? -scaledValue : scaledValue;
  const digits = magnitude.toString().padStart(scale + 1, '0');
  const whole = digits.slice(0, digits.length - scale) || '0';
  const fraction = scale > 0 ? digits.slice(digits.length - scale) : '';

  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function addScaled(a: string, b: string, scale: number): string {
  return formatScaledPlain(parseScaled(a, scale) + parseScaled(b, scale), scale);
}

export function subScaled(a: string, b: string, scale: number): string {
  return formatScaledPlain(parseScaled(a, scale) - parseScaled(b, scale), scale);
}

export function sumScaled(values: string[], scale: number): string {
  const total = values.reduce((acc, value) => acc + parseScaled(value, scale), 0n);

  return formatScaledPlain(total, scale);
}

export function isNegative(value: string): boolean {
  return value.trim().startsWith('-');
}

/**
 * A plain-number ratio for purely visual use (bar widths, percentages, chart geometry) where a
 * float rounding error is invisible. Never use this to compute a value that gets sent back to the
 * backend or displayed as a monetary amount.
 */
export function ratio(numeratorScaled: string, denominatorScaled: string, scale: number): number {
  const denominator = parseScaled(denominatorScaled, scale);

  if (denominator === 0n) {
    return 0;
  }

  return Number(parseScaled(numeratorScaled, scale)) / Number(denominator);
}

export function toApiNumber(value: string): number {
  return Number(value);
}

/** Validates a decimal input string against a currency's scale, mirroring the backend's rule. */
export function validateAgainstScale(input: string, scale: number): boolean {
  if (!/^\d+(\.\d+)?$/.test(input.trim())) {
    return false;
  }

  const [, fraction = ''] = input.trim().split('.');

  return fraction.length <= scale;
}

export function isPositiveAmount(input: string): boolean {
  const trimmed = input.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return false;
  }

  return Number(trimmed) > 0;
}
