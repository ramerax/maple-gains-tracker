import { SectionHeader } from './SectionHeader';
import { NumInput } from './NumInput';
import { GainBadge } from './GainBadge';

interface Field {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  decimal?: boolean;
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
  return (
    <>
      <SectionHeader color={color} title={`${icon}  ${title}`} />
      <div className="bg-panel px-4 pb-4">
        <div className="flex gap-3 pt-4">
          {fields.map((f) => (
            <NumInput key={f.label} {...f} />
          ))}
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
