import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { formatExp, formatPercent, formatDateShortEs, formatSignedGain } from '@/utils/formatters';
import { calculateTotalExpPercent } from '@/utils/expCalculator';
import type { Session } from '@/types';

// Fixed pixel column widths shared by the header and every row, so values
// line up vertically and scanning down a column (e.g. comparing EXP across
// sessions) actually works. Narrower than the viewport on phones — the
// panel scrolls horizontally there, same trade-off any real data table makes.
const COLS = 'grid-cols-[64px_84px_60px_58px_58px_74px_78px_78px]';
const COLS_WITH_DATE = 'grid-cols-[52px_64px_84px_60px_58px_58px_74px_78px_78px]';

export function SessionTableHeader({ showDate }: { showDate?: boolean }) {
  return (
    <div
      className={`grid ${showDate ? COLS_WITH_DATE : COLS} gap-x-2 border-b border-border px-5 py-2 text-[10px] font-bold uppercase text-text-faint`}
    >
      {showDate && <span>Fecha</span>}
      <span>Nivel</span>
      <span className="text-right">EXP</span>
      <span className="text-right">%</span>
      <span className="text-right">Frags</span>
      <span className="text-right">Nodos</span>
      <span className="text-right">Mesos</span>
      <span className="text-right">Comunes</span>
      <span className="text-right">Raros</span>
    </div>
  );
}

export function SessionRow({ session, showDate }: { session: Session; showDate?: boolean }) {
  const navigate = useNavigate();
  const levelsGained = session.lvEnd - session.lvStart;
  const pct = calculateTotalExpPercent(session.lvStart, session.expStart, session.lvEnd, session.expEnd);
  return (
    <button
      onClick={() => navigate(ROUTES.sessionDetail(session.id))}
      className={`grid ${showDate ? COLS_WITH_DATE : COLS} w-full items-center gap-x-2 border-b border-border px-5 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-white/[0.03]`}
    >
      {showDate && <span className="truncate text-xs text-text-faint">{formatDateShortEs(session.date)}</span>}
      <span className="truncate text-xs font-bold text-text">
        {session.lvStart}{levelsGained > 0 ? `→${session.lvEnd}` : ''}
      </span>
      <span className="truncate text-right font-black text-exp">{formatExp(session.expGainedActual)}</span>
      <span className="truncate text-right text-xs font-semibold text-exp/70">{pct >= 0 ? '+' : ''}{formatPercent(pct)}%</span>
      <span className="truncate text-right font-semibold text-frags">{formatSignedGain(session.fragsGained)}</span>
      <span className="truncate text-right font-semibold text-nodes">{formatSignedGain(session.nodesGained)}</span>
      <span className="truncate text-right font-semibold text-mesos">{formatSignedGain(session.mesosGained, formatExp)}</span>
      <span className="truncate text-right font-semibold text-common">{formatSignedGain(session.commonFamiliarsGained)}</span>
      <span className="truncate text-right font-semibold text-rare">{formatSignedGain(session.rareFamiliarsGained)}</span>
    </button>
  );
}
