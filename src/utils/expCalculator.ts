import { EXP_TABLE } from '../constants/expTable';

/**
 * Calculate actual EXP gained given start/end level and %.
 * Example: lvStart=265, expStart=45.00, lvEnd=265, expEnd=78.50
 * → gained = (78.50 - 45.00) / 100 * EXP_TABLE[265]
 *
 * With level-ups:
 * lvStart=265 at 80%, lvEnd=266 at 30%
 * → (100-80)/100 * EXP[265] + 30/100 * EXP[266]
 */
export function calculateExpGained(
  lvStart: number,
  expStart: number,
  lvEnd: number,
  expEnd: number
): number {
  if (lvStart === lvEnd) {
    const levelExp = EXP_TABLE[lvStart];
    if (!levelExp) return 0;
    return Math.round(((expEnd - expStart) / 100) * levelExp);
  }

  let total = 0;

  // Remaining % in start level
  const startLevelExp = EXP_TABLE[lvStart];
  if (startLevelExp) {
    total += ((100 - expStart) / 100) * startLevelExp;
  }

  // Full intermediate levels
  for (let lv = lvStart + 1; lv < lvEnd; lv++) {
    const lvExp = EXP_TABLE[lv];
    if (lvExp) total += lvExp;
  }

  // % gained in end level
  const endLevelExp = EXP_TABLE[lvEnd];
  if (endLevelExp) {
    total += (expEnd / 100) * endLevelExp;
  }

  return Math.round(total);
}

/**
 * Returns EXP needed to complete a given level.
 * Returns null if level not in table.
 */
export function getLevelExp(level: number): number | null {
  return EXP_TABLE[level] ?? null;
}

/**
 * Calculate total % gained across potentially multiple levels.
 * Useful for display.
 */
export function calculateTotalExpPercent(
  lvStart: number,
  expStart: number,
  lvEnd: number,
  expEnd: number
): number {
  if (lvStart === lvEnd) {
    return expEnd - expStart;
  }
  const levelsGained = lvEnd - lvStart;
  return (100 - expStart) + (levelsGained - 1) * 100 + expEnd;
}
