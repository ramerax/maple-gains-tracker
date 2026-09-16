import { formatExp, formatDateShortEs } from '@/utils/formatters';
import type { Session } from '@/types';

export function BarChart({ sessions, days = 14 }: { sessions: Session[]; days?: number }) {
  if (sessions.length === 0) return null;

  const byDate: Record<string, number> = {};
  for (const s of sessions) byDate[s.date] = (byDate[s.date] ?? 0) + s.expGainedActual;

  const sorted = Object.entries(byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, days)
    .reverse();

  if (sorted.length === 0) return null;

  const maxVal = Math.max(...sorted.map(([, v]) => v));

  return (
    <div className="rounded-2xl border border-border bg-panel p-5">
      <p className="text-sm font-bold text-text">📈 EXP por día — últimos {sorted.length} días</p>
      <div className="relative mt-4">
        <div className="flex items-end gap-1.5 overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,#000_92%,transparent)] sm:[mask-image:none]">
          {sorted.map(([date, val]) => {
            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            const isMax = val === maxVal && val > 0;
            return (
              <div key={date} className="flex min-w-[36px] flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-text-faint">{val > 0 ? formatExp(val) : ''}</span>
                <div className="flex h-24 w-full items-end rounded-md bg-white/[0.04]">
                  <div
                    className={`w-full rounded-md transition-all ${isMax ? 'bg-exp shadow-glow' : 'bg-exp/50'}`}
                    style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-faint">{formatDateShortEs(date)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
