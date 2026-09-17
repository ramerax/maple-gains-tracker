import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatSectionGrid } from '@/components/session-form/StatSectionGrid';
import { useProfile } from '@/context/ProfileContext';
import { calculateExpGained } from '@/utils/expCalculator';
import { addSession, getOpenSession, deleteOpenSession, generateId } from '@/utils/storage';
import { formatExp, formatNumber, formatPercent, formatSignedGain } from '@/utils/formatters';
import { STAT_COLORS } from '@/constants/statColors';
import type { OpenSession, Session } from '@/types';

export default function FinishSessionPage() {
  const navigate = useNavigate();
  const { activeProfileId } = useProfile();
  const [open, setOpen] = useState<OpenSession | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [lvEnd, setLvEnd] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [fragsEnd, setFragsEnd] = useState('');
  const [nodesEnd, setNodesEnd] = useState('');
  const [mesosEnd, setMesosEnd] = useState('');
  const [commonEnd, setCommonEnd] = useState('');
  const [rareEnd, setRareEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOpenSession(activeProfileId ?? undefined).then((s) => {
      if (cancelled) return;
      if (!s) { setNotFound(true); return; }
      setOpen(s);
    });
    return () => { cancelled = true; };
  }, [activeProfileId]);

  const pi = (v: string) => parseInt(v) || 0;
  const pf = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const lvEndN = pi(lvEnd) || open?.lvStart || 260;
  const expEndN = pf(expEnd);
  const expGained = open && expEnd ? calculateExpGained(open.lvStart, open.expStart, lvEndN, expEndN) : 0;
  const fragsGained = fragsEnd ? pi(fragsEnd) - (open?.fragsStart ?? 0) : 0;
  const nodesGained = nodesEnd ? pi(nodesEnd) - (open?.nodesStart ?? 0) : 0;
  const mesosGained = mesosEnd ? (Number(mesosEnd) || 0) - (open?.mesosStart ?? 0) : 0;
  const commonGained = commonEnd ? pi(commonEnd) - (open?.commonFamiliarsStart ?? 0) : 0;
  const rareGained = rareEnd ? pi(rareEnd) - (open?.rareFamiliarsStart ?? 0) : 0;

  const handleSave = useCallback(async () => {
    if (!open) return;
    if (!expEnd) {
      setError('Ingresa el % de EXP al finalizar la sesión.');
      return;
    }
    const lvS = open.lvStart;
    if (lvS > lvEndN) {
      setError('El nivel final no puede ser menor al inicial.');
      return;
    }
    if (lvS === lvEndN && open.expStart > expEndN) {
      setError('El % final no puede ser menor al inicial en el mismo nivel.');
      return;
    }

    const session: Session = {
      id: generateId(),
      date: open.date,
      createdAt: open.startedAt,
      profileId: open.profileId,
      lvStart: open.lvStart,
      expStart: open.expStart,
      lvEnd: lvEndN,
      expEnd: expEndN,
      expGainedActual: expGained,
      fragsStart: open.fragsStart,
      fragsEnd: fragsEnd ? pi(fragsEnd) : open.fragsStart,
      fragsGained,
      nodesStart: open.nodesStart,
      nodesEnd: nodesEnd ? pi(nodesEnd) : open.nodesStart,
      nodesGained,
      mesosStart: open.mesosStart,
      mesosEnd: mesosEnd ? (Number(mesosEnd) || 0) : open.mesosStart,
      mesosGained,
      commonFamiliarsStart: open.commonFamiliarsStart,
      commonFamiliarsEnd: commonEnd ? pi(commonEnd) : open.commonFamiliarsStart,
      commonFamiliarsGained: commonGained,
      rareFamiliarsStart: open.rareFamiliarsStart,
      rareFamiliarsEnd: rareEnd ? pi(rareEnd) : open.rareFamiliarsStart,
      rareFamiliarsGained: rareGained,
      notes: open.notes || undefined,
    };

    setSaving(true);
    setError(null);
    const { error: saveError } = await addSession(session);
    if (saveError) {
      setSaving(false);
      setError('No se pudo guardar la sesión. Intenta de nuevo.');
      return;
    }
    // The session is saved at this point — a cleanup failure below must not
    // block navigation, but it also must not be silent: an un-cleared open
    // session would let the user "finish" the same session again and create
    // a duplicate. Warn explicitly instead of discarding the error.
    const { error: cleanupError } = await deleteOpenSession(open.profileId);
    setSaving(false);
    if (cleanupError) {
      alert('La sesión se guardó, pero no se pudo limpiar el estado de "sesión activa". Si sigue apareciendo como activa, recargá la página.');
    }
    navigate(-1);
  }, [open, lvEndN, expEnd, expEndN, fragsEnd, nodesEnd, mesosEnd, commonEnd, rareEnd, expGained, fragsGained, nodesGained, mesosGained, commonGained, rareGained, navigate]);

  if (notFound) {
    return (
      <Modal>
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-text">No hay ninguna sesión en progreso.</p>
          <button onClick={() => navigate(-1)} className="min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-bold text-bg-deep">OK</button>
        </div>
      </Modal>
    );
  }

  if (!open) {
    return (
      <Modal>
        <div className="p-8 text-center text-text-muted">Cargando sesión…</div>
      </Modal>
    );
  }

  return (
    <Modal maxWidthClassName="max-w-2xl md:max-w-4xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h1 className="text-lg font-bold text-text">Finalizar Sesión</h1>
        <button onClick={() => navigate(-1)} aria-label="Cerrar" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06] hover:text-text-dim">
          <X size={18} />
        </button>
      </div>

      <div className="md:grid md:max-h-[75vh] md:grid-cols-[220px_1fr] md:overflow-y-auto">
        <div className="sticky top-0 z-10 self-start border-b-[3px] border-primary bg-bg px-5 py-4 shadow-lg md:border-b-0 md:border-r-[3px]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">📌 Datos de Inicio</p>
          {[
            ['Nivel', `${open.lvStart} (${formatPercent(open.expStart)}%)`],
            ['Fragmentos', formatNumber(open.fragsStart)],
            ['Nodos', formatNumber(open.nodesStart)],
            ['Mesos', formatExp(open.mesosStart)],
            ['Fam. Comunes', formatNumber(open.commonFamiliarsStart)],
            ['Fam. Raros', formatNumber(open.rareFamiliarsStart)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-white/5 py-1 text-sm text-text-dim last:border-b-0">
              <span>{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>

        <div className="pb-6">
          <StatSectionGrid
            color={STAT_COLORS.exp} icon="⚔️" title="Nivel y EXP — Fin"
            fields={[
              { label: 'Nivel', value: lvEnd, onChange: setLvEnd, startValue: String(open.lvStart) },
              { label: '% EXP', value: expEnd, onChange: setExpEnd, decimal: true, startValue: `${formatPercent(open.expStart)}%` },
            ]}
            gains={[
              { label: 'EXP Ganada', value: expEnd ? formatExp(expGained) : '—' },
              ...(lvEndN > open.lvStart ? [{ label: 'Niveles', value: `+${lvEndN - open.lvStart}` }] : []),
            ]}
          />
          <StatSectionGrid
            color={STAT_COLORS.frags} icon="💎" title="Fragmentos — Fin"
            fields={[{ label: 'Fragmentos', value: fragsEnd, onChange: setFragsEnd, startValue: formatNumber(open.fragsStart) }]}
            gains={[{ label: 'Ganados', value: formatSignedGain(fragsGained) }]}
          />
          <StatSectionGrid
            color={STAT_COLORS.nodes} icon="🔮" title="Nodos — Fin"
            fields={[{ label: 'Nodos', value: nodesEnd, onChange: setNodesEnd, startValue: formatNumber(open.nodesStart) }]}
            gains={[{ label: 'Ganados', value: formatSignedGain(nodesGained) }]}
          />
          <StatSectionGrid
            color={STAT_COLORS.mesos} icon="💰" title="Mesos — Fin"
            fields={[{ label: 'Mesos', value: mesosEnd, onChange: setMesosEnd, startValue: formatExp(open.mesosStart) }]}
            gains={[{ label: 'Ganados', value: formatSignedGain(mesosGained, formatExp) }]}
          />
          <StatSectionGrid
            color={STAT_COLORS.common} icon="👾" title="Fam. Comunes — Fin"
            fields={[{ label: 'Familiares Comunes', value: commonEnd, onChange: setCommonEnd, startValue: formatNumber(open.commonFamiliarsStart) }]}
            gains={[{ label: 'Ganados', value: formatSignedGain(commonGained) }]}
          />
          <StatSectionGrid
            color={STAT_COLORS.rare} icon="✨" title="Fam. Raros — Fin"
            fields={[{ label: 'Familiares Raros', value: rareEnd, onChange: setRareEnd, startValue: formatNumber(open.rareFamiliarsStart) }]}
            gains={[{ label: 'Ganados', value: formatSignedGain(rareGained) }]}
          />

          {error && <p className="mx-5 mt-3 text-sm text-danger">{error}</p>}

          <div className="px-5 pt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary text-base font-extrabold text-bg-deep shadow-glow disabled:opacity-60"
            >
              {saving ? 'Guardando…' : '✅  Guardar Sesión'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
