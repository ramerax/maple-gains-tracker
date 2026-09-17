export function GainBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 rounded-lg border bg-white/[0.04] px-3 py-2 text-center" style={{ borderColor: color + '40' }}>
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className="mt-0.5 text-base font-black" style={{ color }}>{value}</p>
    </div>
  );
}
