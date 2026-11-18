// EXP % is typed as plain digits and always has 3 decimals: 94432 → 94.432%,
// 6832 → 6.832%, 100000 → 100.000%. State holds the digits string; these
// helpers convert to/from the real percent number and the masked display.

const SCALE = 1000;
const MAX_DIGITS_VALUE = 100 * SCALE;

/** Keep only digits, drop leading zeros. Returns null if it would exceed 100%. */
function sanitizePercentDigits(raw: string): string | null {
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

/**
 * Next digits state after the browser reports `raw` as the input's new text.
 * Caret position and IME quirks don't matter: only the characters that were
 * typed/pasted are taken (diffed against the masked text) and appended to the
 * existing digits. Returns null when the result would exceed 100%.
 */
export function nextPercentDigits(prevDigits: string, raw: string, selectedAll = false): string | null {
  // Whole text was selected: what's in `raw` is exactly what was typed/pasted.
  if (selectedAll) return sanitizePercentDigits(raw);
  const prev = formatPercentDigits(prevDigits);
  let prefix = 0;
  while (prefix < prev.length && prefix < raw.length && prev[prefix] === raw[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < prev.length - prefix &&
    suffix < raw.length - prefix &&
    prev[prev.length - 1 - suffix] === raw[raw.length - 1 - suffix]
  ) suffix++;

  const inserted = raw.slice(prefix, raw.length - suffix).replace(/\D/g, '');
  const replacedAll = prev.length > 0 && prefix === 0 && suffix === 0;
  if (!inserted && raw.length < prev.length) {
    // Deletion that bypassed keydown (e.g. mobile keyboards): drop the last digit.
    return replacedAll || raw === '' ? '' : sanitizePercentDigits(prevDigits.slice(0, -1));
  }
  return sanitizePercentDigits((replacedAll ? '' : prevDigits) + inserted);
}
