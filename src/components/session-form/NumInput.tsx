interface NumInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  decimal?: boolean;
}

export function NumInput({ label, value, onChange, placeholder, decimal }: NumInputProps) {
  return (
    <div className="flex-1">
      <label className="mb-1.5 block text-xs text-text-dim">{label}</label>
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '0'}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
    </div>
  );
}
