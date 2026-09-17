import { SectionHeader } from './SectionHeader';
import { NumInput } from './NumInput';
import { GainBadge } from './GainBadge';

interface Field {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  decimal?: boolean;
  /** When set, renders a read-only "Inicio" box beside the (now empty) input,
   *  so it's unambiguous which box is the starting reference and which one
   *  you type the final value into. */
  startValue?: string;
}

interface Gain {
  label: string;
  value: string;
}

interface StatSectionGridProps {
  color: string;
  icon: string;
  title: string;
  fields: Field[];
  gains?: Gain[];
}

/** One category block (icon + title + inputs + optional gain badges) — data-driven
 *  so the 6 repeated EXP/Frags/Nodes/Mesos/Common/Rare blocks per form screen
 *  collapse into a config array instead of copy-pasted JSX. */
export function StatSectionGrid({ color, icon, title, fields, gains }: StatSectionGridProps) {
  const singleField = fields.length === 1;
  const hasStartPairs = fields.some((f) => f.startValue !== undefined);
  return (
    <>
      <SectionHeader color={color} title={`${icon}  ${title}`} />
      <div className="bg-panel px-4 pb-4">
        <div className={`grid gap-3 pt-4 ${hasStartPairs ? 'grid-cols-1' : fields.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} ${singleField && !hasStartPairs ? 'md:max-w-[280px]' : ''}`}>
          {fields.map((f) =>
            f.startValue !== undefined ? (
              <div key={f.label} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs text-text-dim">Inicio</label>
                  <div className="w-full rounded-lg border border-border bg-white/[0.02] px-3.5 py-2.5 text-base text-text-muted">
                    {f.startValue}
                  </div>
                </div>
                <div className="flex-1">
                  <NumInput
                    label="Fin"
                    value={f.value}
                    onChange={f.onChange}
                    placeholder="0"
                    decimal={f.decimal}
                  />
                </div>
              </div>
            ) : (
              <NumInput key={f.label} {...f} />
            )
          )}
        </div>
        {gains && gains.length > 0 && (
          <div className="mt-3 flex gap-2">
            {gains.map((g) => (
              <GainBadge key={g.label} label={g.label} value={g.value} color={color} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
