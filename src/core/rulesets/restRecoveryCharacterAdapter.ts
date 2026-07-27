import {
  applyLongRest,
  applyShortRest,
  normalizeRestState,
  type ActiveEffect,
  type HitDiePool,
  type ResourcePool,
  type RestRecoveryState,
  type RestRulesetId,
  type SpellSlotPool,
} from "./restRecoveryRules";

export type RestCompatibleCharacter = Record<string, unknown> & {
  id?: string;
  name?: string;
  ruleset?: string;
  currentHp?: number;
  maxHp?: number;
  tempHp?: number;
  temporaryHp?: number;
  hitDice?: HitDiePool[];
  spellSlots?: SpellSlotPool[];
  resources?: ResourcePool[];
  exhaustion?: number;
  deathSaves?: { successes?: number; failures?: number };
  concentrating?: boolean;
  concentration?: boolean;
  activeEffects?: ActiveEffect[];
};

export type CharacterRestResult<T extends RestCompatibleCharacter> = {
  character: T;
  state: RestRecoveryState;
  summary: ReturnType<typeof applyShortRest>["summary"];
};

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const arrayOr = <T>(value: unknown): T[] =>
  Array.isArray(value) ? structuredClone(value as T[]) : [];

export function resolveCharacterRuleset(
  character: RestCompatibleCharacter,
): RestRulesetId {
  return character.ruleset === "dnd_2024" ? "dnd_2024" : "dnd_2014";
}

export function characterToRestState(
  character: RestCompatibleCharacter,
): RestRecoveryState {
  const maxHp = Math.max(0, numberOr(character.maxHp, 0));

  return normalizeRestState({
    currentHp: numberOr(character.currentHp, maxHp),
    maxHp,
    tempHp: numberOr(
      character.tempHp,
      numberOr(character.temporaryHp, 0),
    ),
    hitDice: arrayOr<HitDiePool>(character.hitDice),
    spellSlots: arrayOr<SpellSlotPool>(character.spellSlots),
    resources: arrayOr<ResourcePool>(character.resources),
    exhaustion: numberOr(character.exhaustion, 0),
    deathSaves: {
      successes: numberOr(character.deathSaves?.successes, 0),
      failures: numberOr(character.deathSaves?.failures, 0),
    },
    concentrating:
      typeof character.concentrating === "boolean"
        ? character.concentrating
        : Boolean(character.concentration),
    activeEffects: arrayOr<ActiveEffect>(character.activeEffects),
  });
}

export function restStateToCharacter<T extends RestCompatibleCharacter>(
  character: T,
  state: RestRecoveryState,
): T {
  const next = structuredClone(character);

  next.currentHp = state.currentHp;
  next.maxHp = state.maxHp;
  next.tempHp = state.tempHp;

  if ("temporaryHp" in next) {
    next.temporaryHp = state.tempHp;
  }

  next.hitDice = structuredClone(state.hitDice);
  next.spellSlots = structuredClone(state.spellSlots);
  next.resources = structuredClone(state.resources);
  next.exhaustion = state.exhaustion;
  next.deathSaves = structuredClone(state.deathSaves);
  next.concentrating = state.concentrating;

  if ("concentration" in next) {
    next.concentration = state.concentrating;
  }

  next.activeEffects = structuredClone(state.activeEffects);

  return next;
}

export function performCharacterShortRest<
  T extends RestCompatibleCharacter,
>(character: T): CharacterRestResult<T> {
  const state = characterToRestState(character);
  const result = applyShortRest(state, resolveCharacterRuleset(character));

  return {
    character: restStateToCharacter(character, result.state),
    state: result.state,
    summary: result.summary,
  };
}

export function performCharacterLongRest<
  T extends RestCompatibleCharacter,
>(character: T): CharacterRestResult<T> {
  const state = characterToRestState(character);
  const result = applyLongRest(
    state,
    resolveCharacterRuleset(character),
  );

  return {
    character: restStateToCharacter(character, result.state),
    state: result.state,
    summary: result.summary,
  };
}

export function serializeRestCompatibleCharacter(
  character: RestCompatibleCharacter,
): string {
  return JSON.stringify(character);
}

export function deserializeRestCompatibleCharacter<
  T extends RestCompatibleCharacter,
>(payload: string): T {
  const parsed: unknown = JSON.parse(payload);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid character payload.");
  }

  return parsed as T;
}
