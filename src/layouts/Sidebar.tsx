import { NavLink, useNavigate } from 'react-router-dom';
import { Home, History, BarChart3, Zap, ChevronRight, Layers, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { getSessionCount } from '@/utils/storage';
import { ROUTES } from '@/routes';
import { PulsingDot } from '@/components/ui/PulsingDot';
import type { OpenSession } from '@/types';

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Inicio', icon: Home },
  { to: ROUTES.history, label: 'Historial', icon: History },
  { to: ROUTES.stats, label: 'Estadísticas', icon: BarChart3 },
];

export function Sidebar({ openSession }: { openSession: OpenSession | null }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeProfile, activeProfileId, loadError, refreshProfiles } = useProfile();
  const [totalSessions, setTotalSessions] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSessionCount(activeProfileId ?? undefined).then((n) => {
      if (!cancelled) setTotalSessions(n);
    });
    return () => { cancelled = true; };
  }, [activeProfileId, openSession]);

  return (
    <aside className="flex h-full w-[212px] flex-shrink-0 flex-col border-r border-border bg-bg-deep py-5">
      {/* Logo */}
      <div className="mb-5 flex items-center gap-2.5 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-border bg-primary-dim">
          <span className="text-xl">🍁</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black tracking-tight text-text">MapleGains</p>
          {activeProfile && (
            <p className="truncate text-[10px] font-semibold text-primary/80">
              {activeProfile.gameClass ?? activeProfile.server ?? 'Tracker'}
            </p>
          )}
        </div>
      </div>

      <p className="mb-1.5 px-[18px] text-[9px] font-bold tracking-[0.2em] text-text-faint">MENÚ</p>

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.home}
            className={({ isActive }) =>
              `group relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition-colors ${
                isActive ? 'bg-primary-dim text-primary' : 'text-text-muted hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />}
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${isActive ? 'bg-primary-dim' : ''}`}>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                <span className={`flex-1 ${isActive ? 'font-bold' : ''}`}>{label}</span>
                {to === ROUTES.home && openSession && <PulsingDot />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      {/* CTA */}
      {!openSession ? (
        <button
          onClick={() => navigate(ROUTES.sessionStart)}
          className="mx-2.5 mb-2 flex items-center justify-center gap-1.5 rounded-[10px] bg-primary py-2.5 text-[13px] font-extrabold text-bg-deep shadow-glow transition-transform hover:scale-[1.02]"
        >
          <Zap size={14} />
          Nueva Sesión
        </button>
      ) : (
        <button
          onClick={() => navigate(ROUTES.home)}
          className="mx-2.5 mb-2 flex items-center gap-2 rounded-[10px] border border-primary-border bg-primary-dim px-3 py-2.5"
        >
          <PulsingDot />
          <span className="flex-1 text-left text-xs font-bold text-primary">
            Sesión activa{totalSessions !== null ? ` #${totalSessions + 1}` : ''}
          </span>
          <ChevronRight size={12} className="text-primary" />
        </button>
      )}

      <div className="mx-3 my-2.5 h-px bg-border" />

      {/* Profile footer */}
      <button
        onClick={() => navigate(ROUTES.profiles)}
        className="mx-2 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
      >
        {activeProfile ? (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border-[1.5px]"
            style={{ backgroundColor: activeProfile.color + '28', borderColor: activeProfile.color + '90' }}
          >
            <span className="text-sm font-black" style={{ color: activeProfile.color }}>
              {activeProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-text-dim">{activeProfile ? activeProfile.name : 'Perfiles'}</p>
          {activeProfile?.server && <p className="truncate text-[10px] text-text-muted">{activeProfile.server}</p>}
        </div>
        <ChevronRight size={12} className="text-text-faint" />
      </button>

      {totalSessions !== null && (
        <div className="flex items-center gap-1.5 px-5 pb-1.5 pt-0.5">
          <Layers size={12} className="text-text-faint" />
          <span className="text-[10px] font-medium text-text-faint">
            {totalSessions} sesión{totalSessions !== 1 ? 'es' : ''} guardada{totalSessions !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {loadError && (
        <>
          <div className="mx-3 my-2.5 h-px bg-border" />
          <div className="px-3 py-2">
            <p className="text-[11px] font-bold text-danger">⚠ Error cargando datos</p>
            <p className="mt-1 line-clamp-3 text-[9px] text-text-muted">{loadError}</p>
            <button
              onClick={() => refreshProfiles()}
              className="mt-1.5 rounded-md bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger"
            >
              Reintentar
            </button>
          </div>
        </>
      )}

      {user && (
        <>
          <div className="mx-3 my-2.5 h-px bg-border" />
          <div className="px-3 py-1.5">
            <p className="truncate text-[10px] font-medium text-text-faint">{user.email}</p>
            <button
              onClick={() => signOut()}
              className="mt-0.5 flex items-center gap-1.5 rounded-md px-1 py-1 text-[11px] text-text-muted hover:bg-white/[0.06]"
            >
              <LogOut size={13} />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
