import type { Character, RulesetId } from "../character/character.types";
import { isRulesetId } from "./rulesetRegistry";

export const LEGACY_RULESET: RulesetId = "dnd_2014";

export function normalizeRulesetId(value: unknown): RulesetId {
  return isRulesetId(value) ? value : LEGACY_RULESET;
}

export function migrateCharacterRuleset<T extends Partial<Character>>(character: T): T & { ruleset: RulesetId } {
  return { ...character, ruleset: normalizeRulesetId(character.ruleset) };
}
