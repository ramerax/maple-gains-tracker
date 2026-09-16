import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatSectionGrid } from '@/components/session-form/StatSectionGrid';
import { useProfile } from '@/context/ProfileContext';
import { saveOpenSession, generateId, getOpenSession } from '@/utils/storage';
import { getTodayString, formatDateShort } from '@/utils/formatters';
import { STAT_COLORS } from '@/constants/statColors';
import { ROUTES } from '@/routes';
import type { OpenSession } from '@/types';

export default function StartSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editing = location.pathname === ROUTES.sessionStartEdit;
  const { activeProfile } = useProfile();

  const [existingSession, setExistingSession] = useState<OpenSession | null>(null);
  const [date, setDate] = useState(getTodayString());
  const [lvStart, setLvStart] = useState('');
  const [expStart, setExpStart] = useState('');
  const [fragsStart, setFragsStart] = useState('');
  const [nodesStart, setNodesStart] = useState('');
  const [mesosStart, setMesosStart] = useState('');
  const [commonStart, setCommonStart] = useState('');
  const [rareStart, setRareStart] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    getOpenSession(activeProfile?.id).then((open) => {
      if (cancelled || !open) return;
      setExistingSession(open);
      setDate(open.date);
      setLvStart(String(open.lvStart));
      setExpStart(String(open.expStart));
      setFragsStart(open.fragsStart > 0 ? String(open.fragsStart) : '');
      setNodesStart(open.nodesStart > 0 ? String(open.nodesStart) : '');
      setMesosStart(open.mesosStart > 0 ? String(open.mesosStart) : '');
      setCommonStart(open.commonFamiliarsStart > 0 ? String(open.commonFamiliarsStart) : '');
      setRareStart(open.rareFamiliarsStart > 0 ? String(open.rareFamiliarsStart) : '');
    });
    return () => { cancelled = true; };
  }, [editing, activeProfile?.id]);

  const pi = (v: string) => parseInt(v) || 0;
  const pf = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const handleSave = useCallback(async () => {
    if (!activeProfile) {
      setError('Selecciona un perfil antes de iniciar una sesión.');
      return;
    }
    if (!lvStart || !expStart) {
      setError('Ingresa al menos el nivel y % de EXP inicial.');
      return;
    }

    const open: OpenSession = {
      id: existingSession?.id ?? generateId(),
      startedAt: existingSession?.startedAt ?? Date.now(),
      date,
      profileId: activeProfile.id,
      lvStart: pi(lvStart),
      expStart: pf(expStart),
      fragsStart: pi(fragsStart),
      nodesStart: pi(nodesStart),
      mesosStart: Number(mesosStart) || 0,
      commonFamiliarsStart: pi(commonStart),
      rareFamiliarsStart: pi(rareStart),
      notes: existingSession?.notes,
    };

    setSaving(true);
    setError(null);
    const { error: saveError } = await saveOpenSession(open);
    setSaving(false);
    if (saveError) {
      setError('No se pudo guardar. Intenta de nuevo.');
      return;
    }
    navigate(-1);
  }, [date, lvStart, expStart, fragsStart, nodesStart, mesosStart, commonStart, rareStart, activeProfile, existingSession, navigate]);

  return (
    <Modal>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h1 className="text-lg font-bold text-text">{editing ? 'Editar Sesión' : 'Iniciar Sesión'}</h1>
        <button onClick={() => navigate(-1)} aria-label="Cerrar" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06] hover:text-text-dim">
          <X size={18} />
        </button>
      </div>

      <div className="md:max-h-[75vh] md:overflow-y-auto pb-6">
        <div className="flex items-center justify-between bg-panel px-5 py-3">
          <span className="text-sm text-text-dim">Fecha</span>
          <span className="text-sm font-bold text-primary">{formatDateShort(date)}</span>
        </div>

        <StatSectionGrid
          color={STAT_COLORS.exp} icon="⚔️" title="Nivel y EXP — Inicio"
          fields={[
            { label: 'Nivel', value: lvStart, onChange: setLvStart, placeholder: '265' },
            { label: '% EXP', value: expStart, onChange: setExpStart, placeholder: '0.00', decimal: true },
          ]}
        />
        <StatSectionGrid
          color={STAT_COLORS.frags} icon="💎" title="Fragmentos — Inicio"
          fields={[{ label: 'Fragmentos', value: fragsStart, onChange: setFragsStart }]}
        />
        <StatSectionGrid
          color={STAT_COLORS.nodes} icon="🔮" title="Nodos — Inicio"
          fields={[{ label: 'Nodos', value: nodesStart, onChange: setNodesStart }]}
        />
        <StatSectionGrid
          color={STAT_COLORS.mesos} icon="💰" title="Mesos — Inicio"
          fields={[{ label: 'Mesos', value: mesosStart, onChange: setMesosStart }]}
        />
        <StatSectionGrid
          color={STAT_COLORS.common} icon="👾" title="Fam. Comunes — Inicio"
          fields={[{ label: 'Familiares Comunes', value: commonStart, onChange: setCommonStart }]}
        />
        <StatSectionGrid
          color={STAT_COLORS.rare} icon="✨" title="Fam. Raros — Inicio"
          fields={[{ label: 'Familiares Raros', value: rareStart, onChange: setRareStart }]}
        />

        {error && <p className="mx-5 mt-3 text-sm text-danger">{error}</p>}

        <div className="px-5 pt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary text-base font-extrabold text-bg-deep shadow-glow disabled:opacity-60"
          >
            {saving ? 'Guardando…' : editing ? '💾  Guardar Cambios' : '⚡  Iniciar Sesión'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
