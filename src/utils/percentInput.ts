// EXP % is typed as plain digits and always has 3 decimals: 94432 → 94.432%,
// 6832 → 6.832%, 100000 → 100.000%. State holds the digits string; these
// helpers convert to/from the real percent number and the masked display.

const SCALE = 1000;
const MAX_DIGITS_VALUE = 100 * SCALE;

/** Keep only digits, drop leading zeros. Returns null if it would exceed 100%. */
export function sanitizePercentDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const stripped = digits.replace(/^0+/, '') || '0';
  if (parseInt(stripped, 10) > MAX_DIGITS_VALUE) return null;
  return stripped;
}

export function percentDigitsToNumber(digits: string): number {
  return digits ? parseInt(digits, 10) / SCALE : 0;
}

export function percentNumberToDigits(n: number): string {
  return String(Math.round(n * SCALE));
}

export function formatPercentDigits(digits: string): string {
  if (digits === '') return '';
  return `${(parseInt(digits, 10) / SCALE).toFixed(3)}%`;
}
