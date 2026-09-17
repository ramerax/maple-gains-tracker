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
// Compact variant (Home's "recent sessions" widget, mobile only): all 8
// columns still, but tight enough (narrower widths, smaller type, 2-letter
// headers) to fit a phone width with no side-scroll. Swaps back to the
// roomier full table at sm: and up.
const COLS_COMPACT = 'grid-cols-[32px_24px_36px_46px_26px_26px_44px_36px_28px]';

export function SessionTableHeader({ showDate, compact }: { showDate?: boolean; compact?: boolean }) {
  const full = (
    <div className={`grid ${showDate ? COLS_WITH_DATE : COLS} gap-x-2 border-b border-border px-5 py-2 text-[10px] font-bold uppercase text-text-faint`}>
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
  if (!compact) return full;
  return (
    <>
      <div className={`grid ${COLS_COMPACT} gap-x-[3px] border-b border-border px-2 py-2 text-[8px] font-bold uppercase text-text-faint sm:hidden`}>
        <span className="min-w-0 truncate">Fecha</span>
        <span className="min-w-0 truncate">Nv</span>
        <span className="min-w-0 truncate text-right">Exp</span>
        <span className="min-w-0 truncate text-right">%</span>
        <span className="min-w-0 truncate text-right">Fr</span>
        <span className="min-w-0 truncate text-right">No</span>
        <span className="min-w-0 truncate text-right">Me</span>
        <span className="min-w-0 truncate text-right">Co</span>
        <span className="min-w-0 truncate text-right">Ra</span>
      </div>
      <div className="hidden sm:block">{full}</div>
    </>
  );
}

export function SessionRow({ session, showDate, compact }: { session: Session; showDate?: boolean; compact?: boolean }) {
  const navigate = useNavigate();
  const levelsGained = session.lvEnd - session.lvStart;
  const pct = calculateTotalExpPercent(session.lvStart, session.expStart, session.lvEnd, session.expEnd);

  const full = (
    <button
      onClick={() => navigate(ROUTES.sessionDetail(session.id))}
      className={`grid ${showDate ? COLS_WITH_DATE : COLS} w-full items-center gap-x-2 border-b border-border px-5 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-white/[0.03]`}
    >
      {showDate && <span className="min-w-0 truncate text-xs text-text-faint">{formatDateShortEs(session.date)}</span>}
      <span className="min-w-0 truncate text-xs font-bold text-text">
        {session.lvStart}{levelsGained > 0 ? `→${session.lvEnd}` : ''}
      </span>
      <span className="min-w-0 truncate text-right font-black text-exp">{formatExp(session.expGainedActual)}</span>
      <span className="min-w-0 truncate text-right text-xs font-semibold text-exp/70">{pct >= 0 ? '+' : ''}{formatPercent(pct)}%</span>
      <span className="min-w-0 truncate text-right font-semibold text-frags">{formatSignedGain(session.fragsGained)}</span>
      <span className="min-w-0 truncate text-right font-semibold text-nodes">{formatSignedGain(session.nodesGained)}</span>
      <span className="min-w-0 truncate text-right font-semibold text-mesos">{formatSignedGain(session.mesosGained, formatExp)}</span>
      <span className="min-w-0 truncate text-right font-semibold text-common">{formatSignedGain(session.commonFamiliarsGained)}</span>
      <span className="min-w-0 truncate text-right font-semibold text-rare">{formatSignedGain(session.rareFamiliarsGained)}</span>
    </button>
  );

  if (!compact) return full;

  return (
    <>
      <button
        onClick={() => navigate(ROUTES.sessionDetail(session.id))}
        className={`grid ${COLS_COMPACT} w-full items-center gap-x-[3px] border-b border-border px-2 py-2.5 text-left text-[10px] transition-colors last:border-b-0 hover:bg-white/[0.03] sm:hidden`}
      >
        <span className="min-w-0 truncate text-text-faint">{formatDateShortEs(session.date)}</span>
        <span className="min-w-0 truncate font-bold text-text">{session.lvEnd}</span>
        <span className="min-w-0 truncate text-right font-black text-exp">{formatExp(session.expGainedActual)}</span>
        <span className="min-w-0 truncate text-right font-semibold text-exp/70">{pct >= 0 ? '+' : ''}{formatPercent(pct)}%</span>
        <span className="min-w-0 truncate text-right font-semibold text-frags">{formatSignedGain(session.fragsGained)}</span>
        <span className="min-w-0 truncate text-right font-semibold text-nodes">{formatSignedGain(session.nodesGained)}</span>
        <span className="min-w-0 truncate text-right font-semibold text-mesos">{formatSignedGain(session.mesosGained, formatExp)}</span>
        <span className="min-w-0 truncate text-right font-semibold text-common">{formatSignedGain(session.commonFamiliarsGained)}</span>
        <span className="min-w-0 truncate text-right font-semibold text-rare">{formatSignedGain(session.rareFamiliarsGained)}</span>
      </button>
      <div className="hidden sm:block">{full}</div>
    </>
  );
}
