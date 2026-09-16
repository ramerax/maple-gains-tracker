import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { getSessionById, deleteSession } from '@/utils/storage';
import { formatDateLong, formatExp, formatNumber, formatPercent, formatSignedGain } from '@/utils/formatters';
import { calculateTotalExpPercent } from '@/utils/expCalculator';
import { STAT_COLORS } from '@/constants/statColors';
import { useOpenModal } from '@/hooks/useOpenModal';
import { ROUTES } from '@/routes';
import type { Session } from '@/types';

const CATEGORIES: { key: string; icon: string; title: string; color: string; start: keyof Session; end: keyof Session; gained: keyof Session; fmt: (n: number) => string }[] = [
  { key: 'exp', icon: '⚔️', title: 'Nivel y EXP', color: STAT_COLORS.exp, start: 'lvStart', end: 'lvEnd', gained: 'expGainedActual', fmt: formatExp },
  { key: 'frags', icon: '💎', title: 'Fragmentos', color: STAT_COLORS.frags, start: 'fragsStart', end: 'fragsEnd', gained: 'fragsGained', fmt: formatNumber },
  { key: 'nodes', icon: '🔮', title: 'Nodos', color: STAT_COLORS.nodes, start: 'nodesStart', end: 'nodesEnd', gained: 'nodesGained', fmt: formatNumber },
  { key: 'mesos', icon: '💰', title: 'Mesos', color: STAT_COLORS.mesos, start: 'mesosStart', end: 'mesosEnd', gained: 'mesosGained', fmt: formatExp },
  { key: 'common', icon: '👾', title: 'Fam. Comunes', color: STAT_COLORS.common, start: 'commonFamiliarsStart', end: 'commonFamiliarsEnd', gained: 'commonFamiliarsGained', fmt: formatNumber },
  { key: 'rare', icon: '✨', title: 'Fam. Raros', color: STAT_COLORS.rare, start: 'rareFamiliarsStart', end: 'rareFamiliarsEnd', gained: 'rareFamiliarsGained', fmt: formatNumber },
];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openModal = useOpenModal();
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getSessionById(id).then((s) => {
      if (cancelled) return;
      if (!s) { setNotFound(true); return; }
      setSession(s);
    });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!session) return;
    if (!window.confirm('¿Eliminar esta sesión? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    const { error } = await deleteSession(session.id);
    setDeleting(false);
    if (error) {
      alert('No se pudo eliminar la sesión. Intenta de nuevo.');
      return;
    }
    navigate(ROUTES.history);
  };

  if (notFound) {
    return (
      <div className="p-6 text-center text-text-muted">
        Sesión no encontrada.
        <button onClick={() => navigate(ROUTES.history)} className="mt-3 block min-h-[44px] w-full rounded-lg bg-primary-dim text-primary">
          Volver al historial
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[700px] p-4 md:p-6">
        <div className="h-6 w-24 animate-pulse rounded bg-white/[0.04]" />
        <div className="mt-4 h-6 w-48 animate-pulse rounded bg-white/[0.04]" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-panel">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b border-border px-5 py-4 last:border-b-0">
              <div className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalExpPct = calculateTotalExpPercent(session.lvStart, session.expStart, session.lvEnd, session.expEnd);

  return (
    <div className="mx-auto max-w-[700px] p-4 md:p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="-ml-2 flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm text-text-muted hover:bg-white/[0.06] hover:text-text-dim">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => openModal(ROUTES.sessionEdit(session.id))}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-primary-border bg-primary-dim px-4 py-2 text-sm font-bold text-primary"
          >
            <Pencil size={13} /> Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-bold text-danger disabled:opacity-50"
          >
            <Trash2 size={13} /> Eliminar
          </button>
        </div>
      </div>

      <h1 className="mt-4 text-lg font-black capitalize text-text">{formatDateLong(session.date)}</h1>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-panel">
        {CATEGORIES.map(({ key, icon, title, color, start, end, gained, fmt }) => {
          const isExp = key === 'exp';
          return (
            <div key={key} className="border-b border-border px-5 py-4 last:border-b-0">
              <p className="text-sm font-bold text-text">{icon} {title}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-text-muted">Inicio</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-dim">
                    {isExp ? `Lv ${session[start]} (${formatPercent(session.expStart)}%)` : fmt(session[start] as number)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">Fin</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-dim">
                    {isExp ? `Lv ${session[end]} (${formatPercent(session.expEnd)}%)` : fmt(session[end] as number)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">Ganado</p>
                  <p className={`mt-0.5 font-black ${isExp ? 'text-xl' : 'text-sm'}`} style={{ color }}>
                    {formatSignedGain(session[gained] as number, fmt)}
                  </p>
                  {isExp && (
                    <p className="text-xs font-semibold" style={{ color }}>
                      ({totalExpPct >= 0 ? '+' : ''}{formatPercent(totalExpPct)}%)
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {session.notes && (
          <div className="px-5 py-4">
            <p className="text-sm font-bold text-text">📝 Notas</p>
            <p className="mt-1.5 text-sm text-text-muted">{session.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
