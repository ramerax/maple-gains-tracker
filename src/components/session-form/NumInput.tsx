import { formatPercentDigits, sanitizePercentDigits } from '@/utils/percentInput';

interface NumInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  decimal?: boolean;
  /** EXP % field: value is a digits string, shown as 94432 → "94.432%". */
  percent?: boolean;
}

export function NumInput({ label, value, onChange, placeholder, decimal, percent }: NumInputProps) {
  const display = percent ? formatPercentDigits(value) : value;

  const handleChange = (raw: string) => {
    if (!percent) return onChange(raw);
    const next = sanitizePercentDigits(raw);
    if (next !== null) onChange(next);
  };

  // The masked text ends in "%", so a native Backspace would only eat the "%"
  // and leave the digits unchanged — remove the last digit ourselves.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!percent || (e.key !== 'Backspace' && e.key !== 'Delete')) return;
    e.preventDefault();
    const el = e.currentTarget;
    const allSelected = display.length > 0 && el.selectionStart === 0 && el.selectionEnd === display.length;
    onChange(allSelected ? '' : value.slice(0, -1));
  };

  return (
    <div className="flex-1">
      <label className="mb-1.5 block text-xs text-text-dim">{label}</label>
      <input
        type="text"
        inputMode={percent || !decimal ? 'numeric' : 'decimal'}
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? (percent ? '0.000%' : '0')}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
    </div>
  );
}
