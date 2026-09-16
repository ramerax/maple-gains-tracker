import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '@/routes';
import { formatExp, formatPercent, formatDateShortEs, formatSignedGain } from '@/utils/formatters';
import { calculateTotalExpPercent } from '@/utils/expCalculator';
import type { Session } from '@/types';

export function SessionRow({ session, showDate }: { session: Session; showDate?: boolean }) {
  const navigate = useNavigate();
  const levelsGained = session.lvEnd - session.lvStart;
  const pct = calculateTotalExpPercent(session.lvStart, session.expStart, session.lvEnd, session.expEnd);
  return (
    <button
      onClick={() => navigate(ROUTES.sessionDetail(session.id))}
      className="flex w-full flex-col gap-2.5 border-b border-border px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-white/[0.03]"
    >
      {/* Level + date + chevron */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {showDate && (
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-text-faint">
              {formatDateShortEs(session.date)}
            </span>
          )}
          <span className="text-sm font-bold text-text">
            Lv {session.lvStart}{levelsGained > 0 ? ` → ${session.lvEnd}` : ''}
          </span>
          <span className="text-xs text-text-muted">
            {formatPercent(session.expStart)}% → {formatPercent(session.expEnd)}%
          </span>
        </div>
        <ChevronRight size={15} className="shrink-0 text-text-faint" />
      </div>

      {/* EXP total + percent, side by side */}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-black text-exp">+{formatExp(session.expGainedActual)}</span>
        <span className="text-xs font-semibold text-text-muted">EXP</span>
        <span className="text-sm font-bold text-exp/80">({pct >= 0 ? '+' : ''}{formatPercent(pct)}%)</span>
      </div>

      {/* Other stats, full words, wraps on narrow screens */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
        <span>Fragmentos <span className="font-semibold text-frags">{formatSignedGain(session.fragsGained)}</span></span>
        <span>Nodos <span className="font-semibold text-nodes">{formatSignedGain(session.nodesGained)}</span></span>
        <span>Mesos <span className="font-semibold text-mesos">{formatSignedGain(session.mesosGained, formatExp)}</span></span>
        {session.commonFamiliarsGained !== 0 && (
          <span>Fam. Comunes <span className="font-semibold text-common">{formatSignedGain(session.commonFamiliarsGained)}</span></span>
        )}
        {session.rareFamiliarsGained !== 0 && (
          <span>Fam. Raros <span className="font-semibold text-rare">{formatSignedGain(session.rareFamiliarsGained)}</span></span>
        )}
      </div>
    </button>
  );
}
