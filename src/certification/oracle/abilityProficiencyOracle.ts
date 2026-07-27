import {
  CERTIFIED_POINT_BUY_COSTS,
  CERTIFIED_SKILLS,
  type CertifiedAbilityKey,
} from "../reference/abilityProficiency.reference";

export type AbilityRecord = Record<CertifiedAbilityKey, number>;

export function certifiedAbilityModifier(score: number) {
  if (!Number.isFinite(score)) throw new TypeError("Ability score must be finite.");
  return Math.floor((score - 10) / 2);
}

export function certifiedProficiencyBonus(level: number) {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError("Level must be an integer from 1 to 20.");
  }
  return 2 + Math.floor((level - 1) / 4);
}

export function certifiedPointBuySpent(scores: AbilityRecord) {
  return Object.values(scores).reduce((sum, score) => {
    const cost = CERTIFIED_POINT_BUY_COSTS[score];
    if (cost === undefined) {
      throw new RangeError(`Point buy score must be between 8 and 15. Received: ${score}`);
    }
    return sum + cost;
  }, 0);
}

export function certifiedPointBuyRemaining(scores: AbilityRecord, budget = 27) {
  return budget - certifiedPointBuySpent(scores);
}

export function certifiedSavingThrow(params: {
  score: number;
  level: number;
  proficient: boolean;
  bonus?: number;
}) {
  return certifiedAbilityModifier(params.score)
    + (params.proficient ? certifiedProficiencyBonus(params.level) : 0)
    + (params.bonus ?? 0);
}

export function certifiedSkillBonus(params: {
  skill: string;
  abilities: AbilityRecord;
  level: number;
  proficiency: 0 | 1 | 2;
  bonus?: number;
}) {
  const ability = CERTIFIED_SKILLS[params.skill];
  if (!ability) throw new Error(`Unknown skill: ${params.skill}`);

  return certifiedAbilityModifier(params.abilities[ability])
    + certifiedProficiencyBonus(params.level) * params.proficiency
    + (params.bonus ?? 0);
}

export function certifiedInitiative(dexterity: number, bonus = 0) {
  return certifiedAbilityModifier(dexterity) + bonus;
}

export function certifiedPassivePerception(params: {
  wisdom: number;
  level: number;
  proficiency: 0 | 1 | 2;
  bonus?: number;
}) {
  return 10 + certifiedAbilityModifier(params.wisdom)
    + certifiedProficiencyBonus(params.level) * params.proficiency
    + (params.bonus ?? 0);
}

export function certifiedSpellSaveDc(params: {
  castingScore: number;
  level: number;
  bonus?: number;
}) {
  return 8 + certifiedAbilityModifier(params.castingScore)
    + certifiedProficiencyBonus(params.level)
    + (params.bonus ?? 0);
}

export function certifiedUnarmoredAc(params: {
  dexterity: number;
  armorBonus?: number;
  shieldBonus?: number;
}) {
  return 10 + certifiedAbilityModifier(params.dexterity)
    + (params.armorBonus ?? 0)
    + (params.shieldBonus ?? 0);
}
