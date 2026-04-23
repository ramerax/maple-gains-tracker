/**
 * Format an EXP/gain percentage without rounding.
 * Shows exact value, removes unnecessary trailing zeros.
 * e.g. 45.325 → "45.325", 45.30 → "45.3", 45.0 → "45"
 */
export function formatPercent(n: number): string {
  if (!isFinite(n)) return '0';
  // Limit to 4 decimal places max to avoid floating-point artifacts,
  // then strip trailing zeros with parseFloat
  return parseFloat(n.toFixed(4)).toString();
}

/**
 * Format a large number with commas: 1234567 → "1,234,567"
 */
export function formatNumber(n: number): string {
  if (isNaN(n) || n === 0) return '0';
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Format EXP with shorthand: 1,234,567,890 → "1.23B"
 */
export function formatExp(n: number): string {
  if (isNaN(n) || n === 0) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  }
  return `${sign}${Math.round(abs).toLocaleString('en-US')}`;
}

/**
 * Format mesos with shorthand
 */
export function formatMesos(n: number): string {
  return formatExp(n);
}

/**
 * Format a YYYY-MM-DD date string to Spanish display: "Lunes, 24 de Marzo 2026"
 */
export function formatDateLong(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr ?? '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a YYYY-MM-DD date string short: "24/03/2026"
 */
export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/**
 * Format a YYYY-MM-DD date string medium: "24 Mar 2026"
 */
export function formatDateMedium(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns today's date as YYYY-MM-DD in local time.
 * Uses local time so it matches session dates (also saved in local time).
 */
export function getTodayString(): string {
  return toDateString(new Date());
}

/**
 * Returns yesterday's date as YYYY-MM-DD in local time.
 */
export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

/**
 * Converts a UTC Date object to YYYY-MM-DD string using UTC fields
 */
export function toUTCDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts a Date object to YYYY-MM-DD string (local time — for date arithmetic only)
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the Monday and Sunday of the week containing the given date.
 */
export function getWeekRange(dateStr: string): { start: string; end: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dow = date.getDay(); // 0=Sun, 1=Mon ...
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateString(monday), end: toDateString(sunday) };
}

/**
 * Get the first and last day of the month containing the given date.
 */
export function getMonthRange(dateStr: string): { start: string; end: string } {
  const [year, month] = dateStr.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return { start: toDateString(first), end: toDateString(last) };
}

/**
 * Format week range display: "24 Mar – 30 Mar 2026"
 */
export function formatWeekRange(start: string, end: string): string {
  return `${formatDateMedium(start)} – ${formatDateMedium(end)}`;
}

/**
 * Format month display: "Marzo 2026"
 */
export function formatMonthDisplay(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
}

/**
 * Add days to a YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/**
 * Compare two YYYY-MM-DD strings
 */
export function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}

const MONTHS_SHORT_ES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

/**
 * Formats a YYYY-MM-DD date string as "DD MMM" (e.g. "28 MAR")
 */
export function formatDateShortEs(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const mm = parseInt(parts[1], 10);
  const dd = parseInt(parts[2], 10);
  if (mm < 1 || mm > 12 || isNaN(dd)) return dateStr;
  return `${dd} ${MONTHS_SHORT_ES[mm - 1]}`;
}
