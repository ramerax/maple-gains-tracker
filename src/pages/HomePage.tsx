import { useNavigate, useOutletContext } from 'react-router-dom';
import { Zap, CheckCircle2, Pencil, X, Flame, Layers } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { useHomeData } from './home/useHomeData';
import { useOpenModal } from '@/hooks/useOpenModal';
import { XPRing } from '@/components/XPRing';
import { SessionRow, SessionTableHeader } from '@/components/SessionRow';
import { ROUTES } from '@/routes';
import { formatDateLong, formatDateShort, formatExp, formatPercent, formatSignedGain } from '@/utils/formatters';
import type { AppShellContext } from '@/layouts/AppShell';
import type { PeriodStats } from '@/types';

const STAT_TILES = [
  { key: 'exp' as const, label: 'EXP', color: 'text-exp', bg: 'bg-exp-bg', big: true },
  { key: 'frags' as const, label: 'Fragmentos', color: 'text-frags', bg: 'bg-frags-bg' },
  { key: 'nodes' as const, label: 'Nodos', color: 'text-nodes', bg: 'bg-nodes-bg' },
  { key: 'mesos' as const, label: 'Mesos', color: 'text-mesos', bg: 'bg-mesos-bg' },
  { key: 'common' as const, label: 'Fam. Comunes', color: 'text-common', bg: 'bg-common-bg' },
  { key: 'rare' as const, label: 'Fam. Raros', color: 'text-rare', bg: 'bg-rare-bg' },
];

function statValue(key: string, stats: PeriodStats | null): string {
  if (!stats) return '—';
  switch (key) {
    case 'exp': return formatExp(stats.totalExpGained);
    case 'frags': return formatSignedGain(stats.totalFragsGained);
    case 'nodes': return formatSignedGain(stats.totalNodesGained);
    case 'mesos': return formatExp(stats.totalMesosGained);
    case 'common': return formatSignedGain(stats.totalCommonFamiliarsGained);
    case 'rare': return formatSignedGain(stats.totalRareFamiliarsGained);
    default: return '—';
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const openModal = useOpenModal();
  const { activeProfile, activeProfileId } = useProfile();
  const { openSession } = useOutletContext<AppShellContext>();
  const {
    today, weekStats, recentSessions, latestSession, loading, cancelOpenSession,
  } = useHomeData(activeProfileId);

  const profileLevel = latestSession?.lvEnd ?? 1;
  const profileXpPct = latestSession?.expEnd ?? 0;

  const handleCancelOpenSession = async () => {
    if (!window.confirm('¿Cancelar la sesión en progreso? Se perderán los datos de inicio.')) return;
    const { error } = await cancelOpenSession();
    if (error) alert('No se pudo cancelar la sesión. Intenta de nuevo.');
  };

  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <div>
          <h1 className="text-xl font-black text-primary">🍁 MapleGains</h1>
          <p className="mt-0.5 text-sm capitalize text-text-muted">{formatDateLong(today)}</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.profiles)}
          aria-label="Cambiar perfil"
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary/40 bg-primary-dim"
        >
          <span className="text-lg font-black text-primary">{activeProfile?.name.charAt(0).toUpperCase() ?? '?'}</span>
        </button>
      </div>

      {/* Mobile compact character card — the level ring was desktop-only before, so
          mobile showed no level/XP at all anywhere on Home. */}
      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-border-strong bg-panel p-4 lg:hidden">
        <XPRing level={profileLevel} xpPercent={profileXpPct} size={76} strokeWidth={6} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black text-text">{activeProfile?.name ?? 'Personaje'}</p>
          {activeProfile?.gameClass && (
            <span className="mt-1 inline-block rounded-full border border-primary-border bg-primary-dim px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {activeProfile.gameClass}
            </span>
          )}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full bg-primary" style={{ width: `${Math.min(profileXpPct, 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-text-muted">{formatPercent(profileXpPct)}% → Lv {profileLevel + 1}</p>
        </div>
      </div>

      {/* Open session banner — static, right under the character card, so it
          never floats over content while scrolling (it used to be a sticky
          pill pinned to the bottom, which blocked the screen on mobile). */}
      {openSession && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-primary-border bg-bg-deep p-3 shadow-glow sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
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
              onClick={handleCancelOpenSession}
              className="min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold text-text-muted hover:bg-white/[0.06]"
            >
              <X size={14} className="inline" /> Cancelar
            </button>
            <button
              onClick={() => openModal(ROUTES.sessionStartEdit)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-primary-border bg-primary-dim px-3 py-2 text-xs font-bold text-primary"
            >
              <Pencil size={13} /> Editar Inicio
            </button>
            <button
              onClick={() => openModal(ROUTES.sessionFinish)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-extrabold text-bg-deep"
            >
              <CheckCircle2 size={14} /> Finalizar Sesión
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Desktop left panel */}
        <div className="hidden flex-col items-center self-start rounded-2xl border border-border-strong bg-panel p-6 lg:flex">
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
        </div>

        {/* Main column */}
        <div className="flex flex-col gap-4">
          {/* Week summary — main card. Most days are a single session, so "today"
              is nearly always empty; weekly is almost always meaningful. */}
          <div className="rounded-2xl border border-border bg-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text">Resumen de la Semana</h2>
              {weekStats && (
                <span className="rounded-full border border-primary-border bg-primary-dim px-2.5 py-0.5 text-xs font-bold text-primary">
                  {weekStats.sessionCount} sesión{weekStats.sessionCount !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            {loading ? (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {STAT_TILES.map(({ key, big }) => (
                  <div key={key} className={`h-[72px] animate-pulse rounded-xl bg-white/[0.04] ${big ? 'col-span-2 sm:col-span-1' : ''}`} />
                ))}
              </div>
            ) : weekStats ? (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {STAT_TILES.map(({ key, label, color, bg, big }) => (
                  <div key={key} className={`rounded-xl ${bg} px-3 py-3.5 text-center ${big ? 'col-span-2 sm:col-span-1' : ''}`}>
                    <p className="text-[10px] font-semibold uppercase text-text-muted">{label}</p>
                    <p className={`mt-1 font-black ${color} ${big ? 'text-xl' : 'text-sm'}`}>{statValue(key, weekStats)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center py-8 text-center">
                <p className="text-4xl">🌙</p>
                <p className="mt-3 font-semibold text-text">Sin sesiones esta semana</p>
                <p className="mt-1 text-sm text-text-muted">Iniciá una nueva sesión para trackear tu progreso</p>
              </div>
            )}
          </div>

          {/* CTA — mobile only (desktop uses the floating pill / recent sessions header) */}
          {!openSession && (
            <button
              onClick={() => openModal(ROUTES.sessionStart)}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-primary-border bg-panel py-4 font-bold text-primary lg:hidden"
            >
              <Zap size={18} /> Nueva Sesión
            </button>
          )}

          {/* Recent sessions */}
          <div className="overflow-hidden rounded-2xl border border-border bg-panel">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-bold text-text">Sesiones Recientes</h2>
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Layers size={14} /> Últimas {recentSessions.length}
              </span>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2 p-5">
                {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />)}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <p className="text-3xl">🎮</p>
                <p className="mt-3 font-semibold text-text-dim">Sin sesiones aún</p>
                <p className="mt-1 text-sm text-text-muted">Iniciá tu primera sesión desde el menú lateral</p>
              </div>
            ) : (
              <div className="overflow-x-auto [mask-image:linear-gradient(to_right,#000_88%,transparent)] sm:[mask-image:none]">
                <SessionTableHeader compact />
                {recentSessions.map((s) => <SessionRow key={s.id} session={s} compact />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
