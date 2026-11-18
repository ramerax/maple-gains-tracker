import { useState } from 'react';
import { formatExp, formatNumber } from '@/utils/formatters';
import { formatPercentDigits, percentNumberToDigits } from '@/utils/percentInput';
import type { Session } from '@/types';

export type PrefillKey = 'lv' | 'exp' | 'frags' | 'nodes' | 'mesos' | 'common' | 'rare';

const FIELDS: { key: PrefillKey; label: string; show: (s: Session) => string }[] = [
  { key: 'lv', label: 'Nivel', show: (s) => String(s.lvEnd) },
  { key: 'exp', label: '% EXP', show: (s) => formatPercentDigits(percentNumberToDigits(s.expEnd)) },
  { key: 'frags', label: 'Fragmentos', show: (s) => formatNumber(s.fragsEnd) },
  { key: 'nodes', label: 'Nodos', show: (s) => formatNumber(s.nodesEnd) },
  { key: 'mesos', label: 'Mesos', show: (s) => formatExp(s.mesosEnd) },
  { key: 'common', label: 'Fam. Comunes', show: (s) => formatNumber(s.commonFamiliarsEnd) },
  { key: 'rare', label: 'Fam. Raros', show: (s) => formatNumber(s.rareFamiliarsEnd) },
];

interface Props {
  last: Session;
  /** `different` = keys the user marked as changed (left empty to type by hand). */
  onApply: (different: ReadonlySet<PrefillKey>) => void;
}

export function LastSessionPrompt({ last, onApply }: Props) {
  const [step, setStep] = useState<'ask' | 'choose'>('ask');
  const [different, setDifferent] = useState<Set<PrefillKey>>(new Set());

  const toggle = (key: PrefillKey) =>
    setDifferent((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  return (
    <div className="px-5 pb-6 pt-5">
      {step === 'ask' ? (
        <>
          <p className="text-base font-bold text-text">¿Empezás igual que terminaste la última sesión?</p>
          <div className="mt-3 rounded-xl border border-border bg-panel">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex justify-between border-b border-white/5 px-4 py-2 text-sm last:border-b-0">
                <span className="text-text-muted">{f.label}</span>
                <span className="font-semibold text-text">{f.show(last)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => onApply(new Set())}
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-bg-deep shadow-glow"
            >
              Sí, son iguales
            </button>
            <button
              onClick={() => setStep('choose')}
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-border-strong text-base font-bold text-text-dim hover:bg-white/[0.06]"
            >
              No, algunos cambian
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-base font-bold text-text">Marcá los que son distintos</p>
          <p className="mt-1 text-xs text-text-muted">Los marcados quedan en 0 para anotarlos a mano; el resto se completa solo.</p>
          <div className="mt-3 rounded-xl border border-border bg-panel">
            {FIELDS.map((f) => {
              const checked = different.has(f.key);
              return (
                <label
                  key={f.key}
                  className="flex min-h-[48px] cursor-pointer items-center gap-3 border-b border-white/5 px-4 py-2 text-sm last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(f.key)}
                    className="h-5 w-5 shrink-0 accent-[hsl(var(--color-primary))]"
                  />
                  <span className="flex-1 text-text">{f.label}</span>
                  <span className={checked ? 'text-text-faint line-through' : 'font-semibold text-text-dim'}>{f.show(last)}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setStep('ask')}
              className="flex min-h-[52px] items-center justify-center rounded-xl border border-border-strong px-5 text-base font-bold text-text-dim hover:bg-white/[0.06]"
            >
              Atrás
            </button>
            <button
              onClick={() => onApply(different)}
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-bg-deep shadow-glow"
            >
              Continuar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
