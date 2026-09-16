import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { StatSectionGrid } from '@/components/session-form/StatSectionGrid';
import { useProfile } from '@/context/ProfileContext';
import { calculateExpGained, calculateTotalExpPercent } from '@/utils/expCalculator';
import { addSession, updateSession, getSessionById, generateId } from '@/utils/storage';
import { getTodayString, formatExp, formatNumber, formatPercent, formatDateShort } from '@/utils/formatters';
import { STAT_COLORS } from '@/constants/statColors';
import type { Session } from '@/types';

export default function AddSessionPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = Boolean(editId);
  const { activeProfile } = useProfile();

  const today = getTodayString();
  const [date, setDate] = useState(today);
  const [lvStart, setLvStart] = useState('');
  const [expStart, setExpStart] = useState('');
  const [lvEnd, setLvEnd] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [fragsStart, setFragsStart] = useState('');
  const [fragsEnd, setFragsEnd] = useState('');
  const [nodesStart, setNodesStart] = useState('');
  const [nodesEnd, setNodesEnd] = useState('');
  const [mesosStart, setMesosStart] = useState('');
  const [mesosEnd, setMesosEnd] = useState('');
  const [commonStart, setCommonStart] = useState('');
  const [commonEnd, setCommonEnd] = useState('');
  const [rareStart, setRareStart] = useState('');
  const [rareEnd, setRareEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    getSessionById(editId).then((s) => {
      if (cancelled || !s) return;
      setDate(s.date);
      setLvStart(String(s.lvStart));
      setExpStart(String(s.expStart));
      setLvEnd(String(s.lvEnd));
      setExpEnd(String(s.expEnd));
      setFragsStart(String(s.fragsStart));
      setFragsEnd(String(s.fragsEnd));
      setNodesStart(String(s.nodesStart));
      setNodesEnd(String(s.nodesEnd));
      setMesosStart(String(s.mesosStart));
      setMesosEnd(String(s.mesosEnd));
      setCommonStart(String(s.commonFamiliarsStart));
      setCommonEnd(String(s.commonFamiliarsEnd));
      setRareStart(String(s.rareFamiliarsStart));
      setRareEnd(String(s.rareFamiliarsEnd));
      setNotes(s.notes ?? '');
    });
    return () => { cancelled = true; };
  }, [editId]);

  const p = (v: string, fallback = 0) => parseFloat(v.replace(',', '.')) || fallback;
  const pi = (v: string, fallback = 0) => parseInt(v) || fallback;

  const expGained = calculateExpGained(pi(lvStart, 260), p(expStart), pi(lvEnd, pi(lvStart, 260)), p(expEnd));
  const totalExpPct = calculateTotalExpPercent(pi(lvStart, 260), p(expStart), pi(lvEnd, pi(lvStart, 260)), p(expEnd));
  const fragsGained = pi(fragsEnd) - pi(fragsStart);
  const nodesGained = pi(nodesEnd) - pi(nodesStart);
  const mesosGained = (Number(mesosEnd) || 0) - (Number(mesosStart) || 0);
  const commonGained = pi(commonEnd) - pi(commonStart);
  const rareGained = pi(rareEnd) - pi(rareStart);

  const handleSave = useCallback(async () => {
    if (!activeProfile) { setError('Selecciona un perfil antes de guardar una sesión.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('La fecha debe tener formato YYYY-MM-DD.'); return; }
    const [dy, dm, dd] = date.split('-').map(Number);
    const parsedDate = new Date(dy, dm - 1, dd);
    if (isNaN(parsedDate.getTime()) || parsedDate.getMonth() !== dm - 1) { setError('La fecha ingresada no existe.'); return; }
    if (!lvStart || !expStart || !lvEnd || !expEnd) { setError('Ingresa nivel y % de EXP de inicio y fin.'); return; }
    const lvS = pi(lvStart, 260);
    const lvE = pi(lvEnd, pi(lvStart, 260));
    if (lvS > lvE) { setError('El nivel final no puede ser menor al inicial.'); return; }
    if (lvS === lvE && p(expStart) > p(expEnd)) { setError('El % final no puede ser menor al inicial en el mismo nivel.'); return; }

    const session: Session = {
      id: editId ?? generateId(),
      date,
      createdAt: Date.now(),
      profileId: activeProfile.id,
      lvStart: lvS, expStart: p(expStart), lvEnd: lvE, expEnd: p(expEnd), expGainedActual: expGained,
      fragsStart: pi(fragsStart), fragsEnd: pi(fragsEnd), fragsGained,
      nodesStart: pi(nodesStart), nodesEnd: pi(nodesEnd), nodesGained,
      mesosStart: Number(mesosStart) || 0, mesosEnd: Number(mesosEnd) || 0, mesosGained,
      commonFamiliarsStart: pi(commonStart), commonFamiliarsEnd: pi(commonEnd), commonFamiliarsGained: commonGained,
      rareFamiliarsStart: pi(rareStart), rareFamiliarsEnd: pi(rareEnd), rareFamiliarsGained: rareGained,
      notes: notes.trim() || undefined,
    };

    setSaving(true);
    setError(null);
    const { error: saveError } = isEdit ? await updateSession(session) : await addSession(session);
    setSaving(false);
    if (saveError) { setError('No se pudo guardar la sesión. Intenta de nuevo.'); return; }
    navigate(-1);
  }, [date, lvStart, expStart, lvEnd, expEnd, fragsStart, fragsEnd, nodesStart, nodesEnd, mesosStart, mesosEnd,
      commonStart, commonEnd, rareStart, rareEnd, notes, expGained, fragsGained, nodesGained, mesosGained,
      commonGained, rareGained, isEdit, editId, activeProfile, navigate]);

  return (
    <Modal>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h1 className="text-lg font-bold text-text">{isEdit ? 'Editar Sesión' : 'Nueva Sesión'}</h1>
        <button onClick={() => navigate(-1)} className="text-sm text-text-muted hover:text-text-dim">✕</button>
      </div>

      <div className="max-h-[75vh] overflow-y-auto pb-6">
        <div className="mt-5 border-l-[3px] border-primary bg-white/[0.03] px-4 py-2.5">
          <p className="text-sm font-bold text-text">📅  Fecha</p>
        </div>
        <div className="bg-panel px-4 pb-4 pt-4">
          <button
            onClick={() => setDate(today)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${date === today ? 'border-primary-border bg-primary-dim text-primary' : 'border-border bg-white/[0.04] text-text-dim'}`}
          >
            Hoy
          </button>
          <div className="mt-3">
            <label className="mb-1.5 block text-xs text-text-dim">Fecha (YYYY-MM-DD)</label>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              maxLength={10}
              className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text focus:border-primary-border focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-faint">{formatDateShort(date)}</p>
          </div>
        </div>

        <StatSectionGrid
          color={STAT_COLORS.exp} icon="⚔️" title="Nivel y Experiencia"
          fields={[
            { label: 'Nivel Inicio', value: lvStart, onChange: setLvStart, placeholder: '265' },
            { label: 'Nivel Fin', value: lvEnd, onChange: setLvEnd, placeholder: '265' },
          ]}
        />
        <div className="-mt-1 bg-panel px-4 pb-2">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-text-dim">% EXP Inicio</label>
              <input value={expStart} onChange={(e) => setExpStart(e.target.value)} placeholder="0.00" inputMode="decimal"
                className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text focus:border-primary-border focus:outline-none" />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-text-dim">% EXP Fin</label>
              <input value={expEnd} onChange={(e) => setExpEnd(e.target.value)} placeholder="0.00" inputMode="decimal"
                className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text focus:border-primary-border focus:outline-none" />
            </div>
          </div>
          {(lvStart || lvEnd) && (expStart || expEnd) ? (
            <div className="mt-3 flex gap-2">
              <div className="flex-1 rounded-lg border border-exp/25 bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[10px] text-text-muted">EXP Ganada</p>
                <p className="mt-0.5 text-base font-black text-exp">{formatExp(expGained)}</p>
              </div>
              <div className="flex-1 rounded-lg border border-primary-border bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[10px] text-text-muted">% Total</p>
                <p className="mt-0.5 text-base font-black text-primary">{formatPercent(totalExpPct)}%</p>
              </div>
            </div>
          ) : null}
        </div>

        <StatSectionGrid
          color={STAT_COLORS.frags} icon="💎" title="Fragmentos"
          fields={[
            { label: 'Inicio', value: fragsStart, onChange: setFragsStart },
            { label: 'Fin', value: fragsEnd, onChange: setFragsEnd },
          ]}
          gains={fragsStart || fragsEnd ? [{ label: 'Ganados', value: `+${formatNumber(fragsGained)}` }] : undefined}
        />
        <StatSectionGrid
          color={STAT_COLORS.nodes} icon="🔮" title="Nodos"
          fields={[
            { label: 'Inicio', value: nodesStart, onChange: setNodesStart },
            { label: 'Fin', value: nodesEnd, onChange: setNodesEnd },
          ]}
          gains={nodesStart || nodesEnd ? [{ label: 'Ganados', value: `+${formatNumber(nodesGained)}` }] : undefined}
        />
        <StatSectionGrid
          color={STAT_COLORS.mesos} icon="💰" title="Mesos"
          fields={[
            { label: 'Mesos Inicio', value: mesosStart, onChange: setMesosStart },
            { label: 'Mesos Fin', value: mesosEnd, onChange: setMesosEnd },
          ]}
          gains={mesosStart || mesosEnd ? [{ label: 'Ganados', value: `+${formatExp(mesosGained)}` }] : undefined}
        />
        <StatSectionGrid
          color={STAT_COLORS.common} icon="👾" title="Familiares Comunes"
          fields={[
            { label: 'Inicio', value: commonStart, onChange: setCommonStart },
            { label: 'Fin', value: commonEnd, onChange: setCommonEnd },
          ]}
          gains={commonStart || commonEnd ? [{ label: 'Ganados', value: `+${formatNumber(commonGained)}` }] : undefined}
        />
        <StatSectionGrid
          color={STAT_COLORS.rare} icon="✨" title="Familiares Raros"
          fields={[
            { label: 'Inicio', value: rareStart, onChange: setRareStart },
            { label: 'Fin', value: rareEnd, onChange: setRareEnd },
          ]}
          gains={rareStart || rareEnd ? [{ label: 'Ganados', value: `+${formatNumber(rareGained)}` }] : undefined}
        />

        <div className="mt-5 border-l-[3px] border-text-muted bg-white/[0.03] px-4 py-2.5">
          <p className="text-sm font-bold text-text">📝  Notas (opcional)</p>
        </div>
        <div className="bg-panel px-4 pb-4 pt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agrega notas..."
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-primary-border focus:outline-none"
          />
        </div>

        {error && <p className="mx-5 mt-3 text-sm text-danger">{error}</p>}

        <div className="px-5 pt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary text-base font-extrabold text-bg-deep shadow-glow disabled:opacity-60"
          >
            {saving ? 'Guardando…' : isEdit ? '✏️  Guardar Cambios' : '✅  Guardar Sesión'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
