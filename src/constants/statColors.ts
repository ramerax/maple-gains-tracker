/** Raw CSS color values for the 6 stat categories — for inline styles where a
 *  Tailwind utility class can't carry a dynamic/parametrized color. */
export const STAT_COLORS = {
  exp: 'hsl(var(--color-exp))',
  frags: 'hsl(var(--color-frags))',
  nodes: 'hsl(var(--color-nodes))',
  mesos: 'hsl(var(--color-mesos))',
  common: 'hsl(var(--color-common))',
  rare: 'hsl(var(--color-rare))',
} as const;

export type StatKey = keyof typeof STAT_COLORS;
