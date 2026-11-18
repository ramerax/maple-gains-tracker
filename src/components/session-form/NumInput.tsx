import { useRef } from 'react';
import { formatPercentDigits, nextPercentDigits } from '@/utils/percentInput';

interface NumInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** EXP % field: value is a digits string, shown as 94432 → "94.432%". */
  percent?: boolean;
}

export function NumInput({ label, value, onChange, placeholder, percent }: NumInputProps) {
  const display = percent ? formatPercentDigits(value) : value;
  // Selection right before an edit (the diff alone can't tell "typed 9 over a
  // selected 94.432%" from "deleted a digit").
  const selectedAll = useRef(false);

  const handleChange = (raw: string) => {
    if (!percent) return onChange(raw);
    const next = nextPercentDigits(value, raw, selectedAll.current);
    selectedAll.current = false;
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
        inputMode="numeric"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBeforeInput={(e) => {
          const el = e.currentTarget;
          selectedAll.current = display.length > 0 && el.selectionStart === 0 && el.selectionEnd === display.length;
        }}
        placeholder={placeholder ?? (percent ? '0.000%' : '0')}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
    </div>
  );
}
