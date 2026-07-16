export type RollMode = "normal" | "advantage" | "disadvantage";

export type AttackResolution = {
  naturalRoll: number;
  total: number;
  hit: boolean;
  critical: boolean;
  fumble: boolean;
};

export function chooseD20(rolls: number[], mode: RollMode) {
  const safe = rolls.length ? rolls : [1];
  if (mode === "advantage") return Math.max(...safe);
  if (mode === "disadvantage") return Math.min(...safe);
  return safe[0];
}

export function resolveAttack(rolls: number[], modifier: number, targetAc: number, mode: RollMode): AttackResolution {
  const naturalRoll = chooseD20(rolls, mode);
  const critical = naturalRoll === 20;
  const fumble = naturalRoll === 1;
  const total = naturalRoll + modifier;
  return { naturalRoll, total, critical, fumble, hit: critical || (!fumble && total >= targetAc) };
}

export function parseDamageFormula(summary: string) {
  const match = summary.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) return null;
  return { count: Number(match[1]), sides: Number(match[2]), modifier: Number(match[3] ?? 0) };
}

export function getCriticalDamageFormula(summary: string, critical: boolean) {
  const formula = parseDamageFormula(summary);
  return formula ? { ...formula, count: formula.count * (critical ? 2 : 1) } : null;
}
