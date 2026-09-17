import { useEffect, useState } from 'react';
import { Layers, CalendarRange } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useStatsData } from './stats/useStatsData';
import { BarChart } from '@/components/stats/BarChart';
import { aggregateStats, getSessionsByDateRange } from '@/utils/storage';
import { formatExp, formatDateMedium, getTodayString, addDays, formatSignedGain } from '@/utils/formatters';
import type { Session } from '@/types';

const STAT_TILES = [
  { key: 'exp' as const, label: 'EXP', color: 'text-exp', fmt: formatExp },
  { key: 'frags' as const, label: 'Fragmentos', color: 'text-frags', fmt: (n: number) => formatSignedGain(n) },
  { key: 'nodes' as const, label: 'Nodos', color: 'text-nodes', fmt: (n: number) => formatSignedGain(n) },
  { key: 'mesos' as const, label: 'Mesos', color: 'text-mesos', fmt: formatExp },
  { key: 'common' as const, label: 'Fam. Comunes', color: 'text-common', fmt: (n: number) => formatSignedGain(n) },
  { key: 'rare' as const, label: 'Fam. Raros', color: 'text-rare', fmt: (n: number) => formatSignedGain(n) },
];

const BEST_DAY_CATEGORIES = [
  { label: 'Más EXP', getValue: (s: Session) => s.expGainedActual, fmt: formatExp, color: 'hsl(var(--color-exp))' },
  { label: 'Más Frags', getValue: (s: Session) => s.fragsGained, fmt: (n: number) => formatSignedGain(n), color: 'hsl(var(--color-frags))' },
  { label: 'Más Nodos', getValue: (s: Session) => s.nodesGained, fmt: (n: number) => formatSignedGain(n), color: 'hsl(var(--color-nodes))' },
  { label: 'Más Mesos', getValue: (s: Session) => s.mesosGained, fmt: formatExp, color: 'hsl(var(--color-mesos))' },
  { label: 'Más Fam. Comunes', getValue: (s: Session) => s.commonFamiliarsGained, fmt: (n: number) => formatSignedGain(n), color: 'hsl(var(--color-common))' },
  { label: 'Más Fam. Raros', getValue: (s: Session) => s.rareFamiliarsGained, fmt: (n: number) => formatSignedGain(n), color: 'hsl(var(--color-rare))' },
];

function PeriodCard({ title, sessions }: { title: string; sessions: Session[] }) {
  const stats = aggregateStats(sessions);
  return (
    <div className="rounded-2xl border border-border bg-panel p-4 md:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text">{title}</p>
        <span className="text-xs text-text-muted">{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}</span>
      </div>
      {stats ? (
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
          {STAT_TILES.map(({ key, label, color, fmt }) => {
            const map: Record<string, number> = {
              exp: stats.totalExpGained, frags: stats.totalFragsGained, nodes: stats.totalNodesGained,
              mesos: stats.totalMesosGained, common: stats.totalCommonFamiliarsGained, rare: stats.totalRareFamiliarsGained,
            };
            return (
              <div key={key} className="rounded-lg bg-white/[0.03] px-2 py-2.5 text-center">
                <p className="text-[10px] leading-tight text-text-muted">{label}</p>
                <p className={`mt-0.5 text-sm font-bold ${color}`}>{fmt(map[key])}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-text-faint">Sin sesiones</p>
      )}
    </div>
  );
}

function BestDay({ label, sessions, getValue, fmt, color }: {
  label: string; sessions: Session[]; getValue: (s: Session) => number; fmt: (n: number) => string; color: string;
}) {
  if (sessions.length === 0) return null;
  const byDate: Record<string, number> = {};
  for (const s of sessions) byDate[s.date] = (byDate[s.date] ?? 0) + getValue(s);
  const best = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
  if (!best) return null;
  return (
    <div className="rounded-xl border-l-[3px] bg-white/[0.03] px-3 py-2.5" style={{ borderColor: color }}>
      <p className="text-base font-black" style={{ color }}>{fmt(best[1])}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className="text-[10px] text-text-faint">{formatDateMedium(best[0])}</p>
    </div>
  );
}

function CustomRangeCard({ profileId }: { profileId: string | null }) {
  const today = getTodayString();
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!from || !to || from > to) return;
    let cancelled = false;
    setLoading(true);
    getSessionsByDateRange(from, to, profileId ?? undefined).then((r) => {
      if (!cancelled) { setSessions(r.sessions); setError(r.error); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [from, to, profileId, retryKey]);

  const stats = aggregateStats(sessions);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-panel p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CalendarRange size={15} className="text-primary" />
        <p className="text-sm font-bold text-text">Rango personalizado</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-muted">Desde</label>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-border bg-white/[0.06] px-2.5 py-2 text-base text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Hasta</label>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-border bg-white/[0.06] px-2.5 py-2 text-base text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-center text-xs text-text-faint">Cargando…</p>
      ) : error ? (
        <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="min-h-[36px] rounded-lg border border-border px-3 text-xs font-semibold text-text-dim hover:bg-white/[0.06]"
          >
            Reintentar
          </button>
        </div>
      ) : stats ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STAT_TILES.map(({ key, label, color, fmt }) => {
            const map: Record<string, number> = {
              exp: stats.totalExpGained, frags: stats.totalFragsGained, nodes: stats.totalNodesGained,
              mesos: stats.totalMesosGained, common: stats.totalCommonFamiliarsGained, rare: stats.totalRareFamiliarsGained,
            };
            return (
              <div key={key} className="rounded-lg bg-white/[0.03] px-2 py-2.5 text-center">
                <p className="text-[10px] leading-tight text-text-muted">{label}</p>
                <p className={`mt-0.5 text-sm font-bold ${color}`}>{fmt(map[key])}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-text-faint">Sin sesiones en este rango</p>
      )}
      {stats && (
        <p className="mt-3 text-center text-xs text-text-muted">
          {stats.sessionCount} sesión{stats.sessionCount !== 1 ? 'es' : ''} en el rango
        </p>
      )}
    </div>
  );
}

export default function StatsPage() {
  const { activeProfileId } = useProfile();
  const { allSessions, todaySessions, weekSessions, monthSessions, totals, loading, error, reload } = useStatsData(activeProfileId);

  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-text">Estadísticas</h1>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
            <Layers size={12} /> {allSessions.length} sesión{allSessions.length !== 1 ? 'es' : ''} registrada{allSessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <PeriodCard title="☀️ Hoy" sessions={todaySessions} />
        <PeriodCard title="📅 Esta Semana" sessions={weekSessions} />
        <PeriodCard title="🗓️ Este Mes" sessions={monthSessions} />
      </div>

      <CustomRangeCard profileId={activeProfileId} />

      {loading ? (
        <div className="mt-4 h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : error ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-panel px-5 py-12 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="font-semibold text-text-dim">{error}</p>
          <button
            onClick={reload}
            className="min-h-[44px] rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-dim hover:bg-white/[0.06]"
          >
            Reintentar
          </button>
        </div>
      ) : allSessions.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-panel px-5 py-12 text-center">
          <p className="text-3xl">📊</p>
          <p className="mt-3 font-semibold text-text-dim">Todavía no hay estadísticas</p>
          <p className="mt-1 text-sm text-text-muted">Registrá tu primera sesión para ver gráficos y totales acá</p>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <BarChart sessions={allSessions} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-text-faint">MEJORES DÍAS</p>
              <div className="flex-1 rounded-2xl border border-border bg-panel p-4">
                <div className="grid grid-cols-2 gap-2">
                  {BEST_DAY_CATEGORIES.map(({ label, getValue, fmt, color }) => (
                    <BestDay key={label} label={label} sessions={allSessions} getValue={getValue} fmt={fmt} color={color} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-text-faint">TOTALES HISTÓRICOS</p>
              <div className="flex-1 rounded-2xl border border-border bg-panel p-4">
                {STAT_TILES.map(({ key, label, color, fmt }) => (
                  <div key={key} className="flex items-center justify-between border-b border-white/5 py-1.5 text-sm last:border-b-0">
                    <span className="text-text-muted">{label}</span>
                    <span className={`font-bold ${color}`}>{fmt(totals[key])}</span>
                  </div>
                ))}
                <div className="mt-2 border-t border-border pt-2 text-center text-xs text-text-muted">
                  {allSessions.length} sesiones en total
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
