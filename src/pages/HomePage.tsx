import { useNavigate, useOutletContext } from 'react-router-dom';
import { Zap, CheckCircle2, Pencil, X, ChevronRight, Flame, Layers } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useHomeData } from './home/useHomeData';
import { XPRing } from '@/components/XPRing';
import { ROUTES } from '@/routes';
import { formatDateLong, formatDateShort, formatExp, formatNumber, formatPercent } from '@/utils/formatters';
import { calculateTotalExpPercent } from '@/utils/expCalculator';
import type { AppShellContext } from '@/layouts/AppShell';
import type { Session } from '@/types';

const STAT_TILES = [
  { key: 'exp' as const, label: 'EXP', color: 'text-exp', bg: 'bg-exp-bg' },
  { key: 'frags' as const, label: 'Fragmentos', color: 'text-frags', bg: 'bg-frags-bg' },
  { key: 'nodes' as const, label: 'Nodos', color: 'text-nodes', bg: 'bg-nodes-bg' },
  { key: 'mesos' as const, label: 'Mesos', color: 'text-mesos', bg: 'bg-mesos-bg' },
  { key: 'common' as const, label: 'Fam. Comunes', color: 'text-common', bg: 'bg-common-bg' },
  { key: 'rare' as const, label: 'Fam. Raros', color: 'text-rare', bg: 'bg-rare-bg' },
];

function statValue(key: string, stats: ReturnType<typeof useHomeData>['todayStats']): string {
  if (!stats) return '—';
  switch (key) {
    case 'exp': return formatExp(stats.totalExpGained);
    case 'frags': return `+${formatNumber(stats.totalFragsGained)}`;
    case 'nodes': return `+${formatNumber(stats.totalNodesGained)}`;
    case 'mesos': return formatExp(stats.totalMesosGained);
    case 'common': return `+${stats.totalCommonFamiliarsGained}`;
    case 'rare': return `+${stats.totalRareFamiliarsGained}`;
    default: return '—';
  }
}

function SessionRow({ session }: { session: Session }) {
  const navigate = useNavigate();
  const levelsGained = session.lvEnd - session.lvStart;
  const pct = calculateTotalExpPercent(session.lvStart, session.expStart, session.lvEnd, session.expEnd);
  return (
    <button
      onClick={() => navigate(ROUTES.sessionDetail(session.id))}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/[0.03]"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">
          Lv {session.lvStart}{levelsGained > 0 ? ` → ${session.lvEnd}` : ''}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {formatPercent(session.expStart)}% → {formatPercent(session.expEnd)}%
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-exp">+{formatExp(session.expGainedActual)}</p>
        <p className="text-xs text-text-muted">{pct >= 0 ? '+' : ''}{formatPercent(pct)}%</p>
      </div>
      <div className="hidden shrink-0 gap-3 text-xs text-text-muted sm:flex">
        <span>F <span className="text-frags">+{formatNumber(session.fragsGained)}</span></span>
        <span>N <span className="text-nodes">+{formatNumber(session.nodesGained)}</span></span>
        <span>M <span className="text-mesos">{formatExp(session.mesosGained)}</span></span>
      </div>
      <ChevronRight size={14} className="shrink-0 text-text-faint" />
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { activeProfile, activeProfileId } = useProfile();
  const { openSession } = useOutletContext<AppShellContext>();
  const {
    today, todayStats, allTimeStats, weekStats, recentSessions, latestSession, cancelOpenSession,
  } = useHomeData(activeProfileId);

  const profileLevel = latestSession?.lvEnd ?? 1;
  const profileXpPct = latestSession?.expEnd ?? 0;

  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <div>
          <h1 className="text-xl font-black text-primary">🍁 MapleGains</h1>
          <p className="mt-0.5 text-sm capitalize text-text-muted">{formatDateLong(today)}</p>
        </div>
        <button onClick={() => navigate(ROUTES.profiles)} className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary/40 bg-primary-dim">
          <span className="text-lg font-black text-primary">{activeProfile?.name.charAt(0).toUpperCase() ?? '?'}</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Desktop left panel */}
        <div className="hidden flex-col items-center rounded-2xl border border-border-strong bg-panel p-6 md:flex">
          <XPRing level={profileLevel} xpPercent={profileXpPct} />
          <p className="mt-3 text-lg font-black text-text">{activeProfile?.name ?? 'Personaje'}</p>
          {activeProfile?.gameClass && (
            <span className="mt-1 rounded-full border border-primary-border bg-primary-dim px-3 py-0.5 text-[11px] font-bold text-primary">
              {activeProfile.gameClass}
            </span>
          )}
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full bg-primary" style={{ width: `${Math.min(profileXpPct, 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-text-muted">{formatPercent(profileXpPct)}% → Lv {profileLevel + 1}</p>

          <div className="my-4 h-px w-full bg-border" />

          <p className="w-full text-left text-[10px] font-bold tracking-widest text-text-faint">ESTA SEMANA</p>
          <div className="mt-2 flex w-full flex-col gap-1.5">
            {STAT_TILES.slice(0, 4).map(({ key, label, color, bg }) => (
              <div key={key} className={`flex items-center justify-between rounded-lg ${bg} px-2.5 py-1.5`}>
                <span className="text-xs text-text-muted">{label}</span>
                <span className={`text-xs font-bold ${color}`}>{statValue(key, weekStats)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            {weekStats?.sessionCount ?? 0} sesión{(weekStats?.sessionCount ?? 0) !== 1 ? 'es' : ''} esta semana
          </p>
        </div>

        {/* Main column */}
        <div className="flex flex-col gap-4">
          {/* Today summary */}
          <div className="rounded-2xl border border-border bg-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text">Resumen de Hoy</h2>
              {todayStats && (
                <span className="rounded-full border border-primary-border bg-primary-dim px-2.5 py-0.5 text-xs font-bold text-primary">
                  {todayStats.sessionCount} sesión{todayStats.sessionCount !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            {todayStats ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {STAT_TILES.map(({ key, label, color, bg }) => (
                  <div key={key} className={`rounded-xl ${bg} px-2 py-3 text-center`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
                    <p className={`mt-1 text-sm font-black ${color}`}>{statValue(key, todayStats)}</p>
                    {allTimeStats && (
                      <p className="mt-1 text-[10px] text-text-faint">Tot: {statValue(key, allTimeStats)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center py-8 text-center">
                <p className="text-4xl">🌙</p>
                <p className="mt-3 font-semibold text-text">Sin sesiones hoy</p>
                <p className="mt-1 text-sm text-text-muted">Iniciá una nueva sesión para trackear tu progreso</p>
              </div>
            )}
          </div>

          {/* CTA — mobile only (desktop uses the floating pill / recent sessions header) */}
          {!openSession && (
            <button
              onClick={() => navigate(ROUTES.sessionStart)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-primary-border bg-panel py-4 font-bold text-primary md:hidden"
            >
              <Zap size={18} /> Nueva Sesión
            </button>
          )}

          {/* Recent sessions */}
          <div className="overflow-hidden rounded-2xl border border-border bg-panel">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-bold text-text">Sesiones Recientes</h2>
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Layers size={12} /> {recentSessions.length} más recientes
              </span>
            </div>
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <p className="text-3xl">🎮</p>
                <p className="mt-3 font-semibold text-text-dim">Sin sesiones aún</p>
                <p className="mt-1 text-sm text-text-muted">Iniciá tu primera sesión desde el menú lateral</p>
              </div>
            ) : (
              recentSessions.map((s) => <SessionRow key={s.id} session={s} />)
            )}
          </div>
        </div>
      </div>

      {/* Open session floating pill */}
      {openSession && (
        <div className="fixed inset-x-3 bottom-[76px] z-30 flex flex-col gap-2 rounded-2xl border border-primary-border bg-bg-deep/95 p-3 shadow-glow backdrop-blur-md md:inset-x-6 md:bottom-6 md:left-[284px] md:flex-row md:items-center md:justify-between md:px-5 md:py-3">
          <div className="flex items-center gap-2.5">
            <Flame size={16} className="text-exp" />
            <div>
              <p className="text-sm font-extrabold text-primary">Sesión en Progreso</p>
              <p className="text-xs text-text-muted">
                {formatDateShort(openSession.date)} · Lv {openSession.lvStart} · {formatPercent(openSession.expStart)}% EXP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('¿Cancelar la sesión en progreso? Se perderán los datos de inicio.')) {
                  cancelOpenSession();
                }
              }}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted hover:bg-white/[0.06]"
            >
              <X size={14} className="inline" /> Cancelar
            </button>
            <button
              onClick={() => navigate(ROUTES.sessionStartEdit)}
              className="flex items-center gap-1.5 rounded-lg border border-primary-border bg-primary-dim px-3 py-2 text-xs font-bold text-primary"
            >
              <Pencil size={13} /> Editar Inicio
            </button>
            <button
              onClick={() => navigate(ROUTES.sessionFinish)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-bg-deep"
            >
              <CheckCircle2 size={14} /> Finalizar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
