import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useHistoryData, useTodayCursor, periodRange, shiftCursor, type HistoryMode } from './history/useHistoryData';
import { useOpenModal } from '@/hooks/useOpenModal';
import { SessionRow, SessionTableHeader } from '@/components/SessionRow';
import { ROUTES } from '@/routes';
import { formatDateLong, formatWeekRange, formatMonthDisplay, formatExp, formatSignedGain } from '@/utils/formatters';

const MODES: { key: HistoryMode; label: string }[] = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

const TOTAL_TILES = [
  { key: 'totalExpGained' as const, label: 'EXP', color: 'text-exp', fmt: formatExp },
  { key: 'totalFragsGained' as const, label: 'Fragmentos', color: 'text-frags', fmt: (n: number) => formatSignedGain(n) },
  { key: 'totalNodesGained' as const, label: 'Nodos', color: 'text-nodes', fmt: (n: number) => formatSignedGain(n) },
  { key: 'totalMesosGained' as const, label: 'Mesos', color: 'text-mesos', fmt: formatExp },
  { key: 'totalCommonFamiliarsGained' as const, label: 'Fam. Comunes', color: 'text-common', fmt: (n: number) => formatSignedGain(n) },
  { key: 'totalRareFamiliarsGained' as const, label: 'Fam. Raros', color: 'text-rare', fmt: (n: number) => formatSignedGain(n) },
];

export default function HistoryPage() {
  const openModal = useOpenModal();
  const { activeProfileId } = useProfile();
  const [mode, setMode] = useState<HistoryMode>('day');
  const { cursor, setCursor, today } = useTodayCursor();
  const { sessions, stats, loading, error, reload } = useHistoryData(mode, cursor, activeProfileId);

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
          onClick={() => openModal(ROUTES.sessionNew)}
          className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-bg-deep shadow-glow"
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
            className={`min-h-[44px] flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              mode === key ? 'bg-primary-dim text-primary' : 'text-text-muted hover:text-text-dim'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period navigator */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-panel px-3 py-2.5">
        <button
          onClick={() => setCursor(shiftCursor(mode, cursor, -1))}
          aria-label="Período anterior"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold capitalize text-text">{periodLabel}</span>
        <button
          onClick={() => setCursor(shiftCursor(mode, cursor, 1))}
          aria-label="Período siguiente"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Stats summary */}
      {loading ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TOTAL_TILES.map(({ key }) => <div key={key} className="h-[72px] animate-pulse rounded-xl bg-white/[0.04]" />)}
        </div>
      ) : stats ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TOTAL_TILES.map(({ key, label, color, fmt }) => (
            <div key={key} className="rounded-xl border border-border bg-panel px-3 py-3.5 text-center">
              <p className="text-[10px] font-semibold uppercase text-text-muted">{label}</p>
              <p className={`mt-1 text-sm font-black ${color}`}>{fmt(stats[key])}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Session list */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-panel">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-bold text-text">
            {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}
          </h2>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2 p-5 pt-0">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <p className="text-3xl">⚠️</p>
            <p className="font-semibold text-danger">{error}</p>
            <button
              onClick={reload}
              className="min-h-[44px] rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-dim hover:bg-white/[0.06]"
            >
              Reintentar
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-3 font-semibold text-text-dim">Sin sesiones en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto [mask-image:linear-gradient(to_right,#000_88%,transparent)] sm:[mask-image:none]">
            <SessionTableHeader showDate={mode !== 'day'} />
            {sessions
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
              .map((s) => <SessionRow key={s.id} session={s} showDate={mode !== 'day'} />)}
          </div>
        )}
      </div>
    </div>
  );
}
