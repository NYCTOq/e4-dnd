import type { DiceRollResult } from "../../core/dice/dice.types";
import type { DndMonsterData } from "../../core/rulesets/ruleset.types";

export type MonsterCombatState = {
  currentHp: number;
  rollHistory: DiceRollResult[];
};

const FAVORITE_MONSTERS_STORAGE_KEY = "e4_dnd_favorite_monsters_v1";

export function getMonsterAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

export function formatMonsterModifier(score: number) {
  const modifier = getMonsterAbilityModifier(score);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function getMonsterMainAttackModifier(monster: DndMonsterData) {
  const strModifier = getMonsterAbilityModifier(monster.abilities.str);
  const dexModifier = getMonsterAbilityModifier(monster.abilities.dex);
  return Math.max(strModifier, dexModifier) + monster.proficiencyBonus;
}

export function parseFirstDiceExpression(text: string) {
  const match = text.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);

  if (!match) {
    return null;
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifierValue = match[4] ? Number(match[4]) : 0;
  const modifier = match[3] === "-" ? -modifierValue : modifierValue;

  if (!Number.isFinite(count) || !Number.isFinite(sides)) {
    return null;
  }

  return {
    count,
    sides,
    modifier,
  };
}

export function loadFavoriteMonsterIds() {
  try {
    const raw = localStorage.getItem(FAVORITE_MONSTERS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveFavoriteMonsterIds(ids: string[]) {
  localStorage.setItem(FAVORITE_MONSTERS_STORAGE_KEY, JSON.stringify(ids));
}
