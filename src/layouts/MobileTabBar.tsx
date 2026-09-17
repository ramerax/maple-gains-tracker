import { NavLink, useNavigate } from 'react-router-dom';
import { Home, History, BarChart3, Zap } from 'lucide-react';
import { ROUTES } from '@/routes';
import { PulsingDot } from '@/components/ui/PulsingDot';
import { useOpenModal } from '@/hooks/useOpenModal';
import type { OpenSession } from '@/types';

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Inicio', icon: Home },
  { to: ROUTES.history, label: 'Historial', icon: History },
  { to: ROUTES.stats, label: 'Stats', icon: BarChart3 },
];

export function MobileTabBar({ openSession }: { openSession: OpenSession | null }) {
  const navigate = useNavigate();
  const openModal = useOpenModal();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-border bg-bg-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === ROUTES.home}
          className={({ isActive }) =>
            `relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold ${
              isActive ? 'text-primary' : 'text-text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {to === ROUTES.home && openSession && (
                  <span className="absolute -right-1 -top-1"><PulsingDot /></span>
                )}
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
      <button
        onClick={() => (openSession ? navigate(ROUTES.home) : openModal(ROUTES.sessionStart))}
        className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold text-primary"
      >
        <Zap size={20} />
        {openSession ? 'En curso' : 'Nueva'}
      </button>
    </nav>
  );
}
