import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '@/routes';
import { formatExp, formatNumber, formatPercent, formatDateShortEs } from '@/utils/formatters';
import { calculateTotalExpPercent } from '@/utils/expCalculator';
import type { Session } from '@/types';

export function SessionRow({ session, showDate }: { session: Session; showDate?: boolean }) {
  const navigate = useNavigate();
  const levelsGained = session.lvEnd - session.lvStart;
  const pct = calculateTotalExpPercent(session.lvStart, session.expStart, session.lvEnd, session.expEnd);
  return (
    <button
      onClick={() => navigate(ROUTES.sessionDetail(session.id))}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/[0.03]"
    >
      {showDate && (
        <span className="hidden w-14 shrink-0 text-xs font-semibold text-text-faint sm:block">
          {formatDateShortEs(session.date)}
        </span>
      )}
      <div className="min-w-0 flex-1">
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
