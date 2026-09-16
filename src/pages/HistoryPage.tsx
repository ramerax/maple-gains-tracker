import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useHistoryData, useTodayCursor, periodRange, shiftCursor, type HistoryMode } from './history/useHistoryData';
import { SessionRow } from '@/components/SessionRow';
import { ROUTES } from '@/routes';
import { formatDateLong, formatWeekRange, formatMonthDisplay, formatExp, formatNumber } from '@/utils/formatters';

const MODES: { key: HistoryMode; label: string }[] = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

const TOTAL_TILES = [
  { key: 'totalExpGained' as const, label: 'EXP', color: 'text-exp', fmt: formatExp },
  { key: 'totalFragsGained' as const, label: 'Frags', color: 'text-frags', fmt: (n: number) => `+${formatNumber(n)}` },
  { key: 'totalNodesGained' as const, label: 'Nodos', color: 'text-nodes', fmt: (n: number) => `+${formatNumber(n)}` },
  { key: 'totalMesosGained' as const, label: 'Mesos', color: 'text-mesos', fmt: formatExp },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const { activeProfileId } = useProfile();
  const [mode, setMode] = useState<HistoryMode>('day');
  const { cursor, setCursor, today } = useTodayCursor();
  const { sessions, stats } = useHistoryData(mode, cursor, activeProfileId);

  const periodLabel = mode === 'day'
    ? formatDateLong(cursor)
    : mode === 'week'
      ? formatWeekRange(periodRange('week', cursor).start, periodRange('week', cursor).end)
      : formatMonthDisplay(cursor);

  return (
    <div className="mx-auto max-w-[900px] p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-text">Historial</h1>
        <button
          onClick={() => navigate(ROUTES.sessionNew)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-bg-deep shadow-glow"
        >
          <Plus size={14} /> Sesión manual
        </button>
      </div>

      {/* Mode segmented control */}
      <div className="mt-4 flex gap-1 rounded-xl border border-border bg-panel p-1">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setMode(key); setCursor(today); }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === key ? 'bg-primary-dim text-primary' : 'text-text-muted hover:text-text-dim'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period navigator */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-panel px-3 py-2.5">
        <button onClick={() => setCursor(shiftCursor(mode, cursor, -1))} className="rounded-lg p-1.5 text-text-muted hover:bg-white/[0.06]">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold capitalize text-text">{periodLabel}</span>
        <button onClick={() => setCursor(shiftCursor(mode, cursor, 1))} className="rounded-lg p-1.5 text-text-muted hover:bg-white/[0.06]">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TOTAL_TILES.map(({ key, label, color, fmt }) => (
            <div key={key} className="rounded-xl border border-border bg-panel px-2 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
              <p className={`mt-1 text-sm font-black ${color}`}>{fmt(stats[key])}</p>
            </div>
          ))}
        </div>
      )}

      {/* Session list */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-panel">
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-sm font-bold text-text">
            {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}
          </h2>
        </div>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-3 font-semibold text-text-dim">Sin sesiones en este período</p>
          </div>
        ) : (
          sessions
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
            .map((s) => <SessionRow key={s.id} session={s} showDate={mode !== 'day'} />)
        )}
      </div>
    </div>
  );
}
