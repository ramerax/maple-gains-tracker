export function SectionHeader({ color, title }: { color: string; title: string }) {
  return (
    <div className="mt-5 border-l-[3px] bg-white/[0.03] px-4 py-2.5" style={{ borderColor: color }}>
      <p className="text-sm font-bold text-text">{title}</p>
    </div>
  );
}
