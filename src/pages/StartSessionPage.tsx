import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatSectionGrid } from '@/components/session-form/StatSectionGrid';
import { LastSessionPrompt, type PrefillKey } from '@/components/session-form/LastSessionPrompt';
import { useProfile } from '@/context/ProfileContext';
import { saveOpenSession, generateId, getOpenSession, getLastSession } from '@/utils/storage';
import { getTodayString, addDays } from '@/utils/formatters';
import { STAT_COLORS } from '@/constants/statColors';
import { MAX_CHARACTER_LEVEL } from '@/constants/expTable';
import { percentDigitsToNumber, percentNumberToDigits } from '@/utils/percentInput';
import { ROUTES } from '@/routes';
import type { OpenSession, Session } from '@/types';

export default function StartSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editing = location.pathname === ROUTES.sessionStartEdit;
  const { activeProfile, activeProfileId, loading: profileLoading } = useProfile();

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
  // New sessions offer to start from the previous session's final values.
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [prefillStatus, setPrefillStatus] = useState<'loading' | 'asking' | 'done'>(editing ? 'done' : 'loading');

  useEffect(() => {
    if (editing) return;
    if (!activeProfileId) {
      if (!profileLoading) setPrefillStatus('done');
      return;
    }
    let cancelled = false;
    getLastSession(activeProfileId)
      .then(({ session }) => {
        if (cancelled) return;
        setLastSession(session);
        // Only leave 'loading': a later profiles refresh must not re-open the prompt.
        setPrefillStatus((s) => (s === 'loading' ? (session ? 'asking' : 'done') : s));
      })
      .catch(() => { if (!cancelled) setPrefillStatus('done'); });
    return () => { cancelled = true; };
  }, [editing, activeProfileId, profileLoading]);

  const applyLastSession = (different: ReadonlySet<PrefillKey>) => {
    if (lastSession) {
      const keep = (key: PrefillKey, value: string) => (different.has(key) ? '' : value);
      const num = (n: number) => (n > 0 ? String(n) : '');
      setLvStart(keep('lv', String(lastSession.lvEnd)));
      // An out-of-range legacy value (>100%) is not safe to prefill.
      setExpStart(keep('exp', lastSession.expEnd <= 100 ? percentNumberToDigits(lastSession.expEnd) : ''));
      setFragsStart(keep('frags', num(lastSession.fragsEnd)));
      setNodesStart(keep('nodes', num(lastSession.nodesEnd)));
      setMesosStart(keep('mesos', num(lastSession.mesosEnd)));
      setCommonStart(keep('common', num(lastSession.commonFamiliarsEnd)));
      setRareStart(keep('rare', num(lastSession.rareFamiliarsEnd)));
    }
    setPrefillStatus('done');
  };

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    getOpenSession(activeProfile?.id).then((open) => {
      if (cancelled || !open) return;
      setExistingSession(open);
      setDate(open.date);
      setLvStart(String(open.lvStart));
      setExpStart(percentNumberToDigits(open.expStart));
      setFragsStart(open.fragsStart > 0 ? String(open.fragsStart) : '');
      setNodesStart(open.nodesStart > 0 ? String(open.nodesStart) : '');
      setMesosStart(open.mesosStart > 0 ? String(open.mesosStart) : '');
      setCommonStart(open.commonFamiliarsStart > 0 ? String(open.commonFamiliarsStart) : '');
      setRareStart(open.rareFamiliarsStart > 0 ? String(open.rareFamiliarsStart) : '');
    });
    return () => { cancelled = true; };
  }, [editing, activeProfile?.id]);

  const pi = (v: string) => parseInt(v) || 0;

  const handleSave = useCallback(async () => {
    if (!activeProfile) {
      setError('Selecciona un perfil antes de iniciar una sesión.');
      return;
    }
    if (!lvStart || !expStart) {
      setError('Ingresa al menos el nivel y % de EXP inicial.');
      return;
    }
    if (pi(lvStart) > MAX_CHARACTER_LEVEL) {
      setError(`El nivel máximo actual es ${MAX_CHARACTER_LEVEL}.`);
      return;
    }

    const open: OpenSession = {
      id: existingSession?.id ?? generateId(),
      startedAt: existingSession?.startedAt ?? Date.now(),
      date,
      profileId: activeProfile.id,
      lvStart: pi(lvStart),
      expStart: percentDigitsToNumber(expStart),
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
        <button onClick={() => navigate(-1)} aria-label="Cerrar" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06] hover:text-text-dim">
          <X size={18} />
        </button>
      </div>

      {prefillStatus === 'loading' ? (
        <div className="p-8 text-center text-text-muted">Cargando…</div>
      ) : prefillStatus === 'asking' && lastSession ? (
        <LastSessionPrompt last={lastSession} onApply={applyLastSession} />
      ) : (
      <div className="md:max-h-[75vh] md:overflow-y-auto pb-6">
        <div className="flex items-center justify-between gap-3 bg-panel px-5 py-3">
          <label htmlFor="start-date" className="text-sm text-text-dim">Fecha</label>
          <input
            id="start-date"
            type="date"
            value={date}
            max={addDays(getTodayString(), 1)}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="min-h-[44px] rounded-lg border border-border bg-white/[0.06] px-3 text-base font-bold text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <StatSectionGrid
          color={STAT_COLORS.exp} icon="⚔️" title="Nivel y EXP — Inicio"
          fields={[
            { label: 'Nivel', value: lvStart, onChange: setLvStart, placeholder: '265' },
            { label: '% EXP', value: expStart, onChange: setExpStart, percent: true },
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
      )}
    </Modal>
  );
}
