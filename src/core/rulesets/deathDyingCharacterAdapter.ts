import {
  runtimeApplyDeathSaveRoll,
  runtimeDamageAtZero,
  runtimeIsMassiveDamageDeath,
  runtimeNormalizeDeathSaveState,
  runtimeResetDeathSaves,
  runtimeStabilize,
  type DeathSaveState,
} from "./deathDyingRuntimeRules";

export type DeathDyingHistoryEntry = {
  id: string;
  at: string;
  type: "damage" | "death-save" | "healing" | "stabilize" | "reset";
  summary: string;
};

export type DeathDyingCompatibleCharacter = Record<string, unknown> & {
  id?: string;
  currentHp?: number;
  maxHp?: number;
  tempHp?: number;
  temporaryHp?: number;
  deathSaves?: { successes?: number; failures?: number };
  deathSaveStable?: boolean;
  dead?: boolean;
  deathDyingHistory?: DeathDyingHistoryEntry[];
};

const int = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;

function appendHistory<T extends DeathDyingCompatibleCharacter>(
  character: T,
  type: DeathDyingHistoryEntry["type"],
  summary: string,
): T {
  const previous = Array.isArray(character.deathDyingHistory)
    ? character.deathDyingHistory
    : [];
  return {
    ...character,
    deathDyingHistory: [{
      id: globalThis.crypto?.randomUUID?.() ?? `death-${Date.now()}`,
      at: new Date().toISOString(),
      type,
      summary,
    }, ...structuredClone(previous)].slice(0, 50),
  };
}

export function characterDeathSaveState(
  character: DeathDyingCompatibleCharacter,
): DeathSaveState {
  return runtimeNormalizeDeathSaveState({
    successes: int(character.deathSaves?.successes),
    failures: int(character.deathSaves?.failures),
    stable: Boolean(character.deathSaveStable),
    dead: Boolean(character.dead),
  });
}

export function writeCharacterDeathSaveState<
  T extends DeathDyingCompatibleCharacter,
>(character: T, state: DeathSaveState): T {
  const next = structuredClone(character);
  next.deathSaves = {
    successes: state.successes,
    failures: state.failures,
  };
  next.deathSaveStable = state.stable;
  next.dead = state.dead;
  return next;
}

export function applyDamageToDyingCharacter<
  T extends DeathDyingCompatibleCharacter,
>(
  character: T,
  amount: number,
  options: { critical?: boolean } = {},
) {
  const next = structuredClone(character);
  const damage = Math.max(0, int(amount));
  const maxHp = Math.max(1, int(next.maxHp, 1));
  const currentHp = Math.min(maxHp, Math.max(0, int(next.currentHp)));
  const tempHp = Math.max(0, int(next.tempHp, int(next.temporaryHp)));
  const absorbedByTempHp = Math.min(tempHp, damage);
  const remainingDamage = damage - absorbedByTempHp;
  const hpDamage = Math.min(currentHp, remainingDamage);
  const overflowDamage = Math.max(0, remainingDamage - currentHp);
  const resultingHp = Math.max(0, currentHp - remainingDamage);
  const massiveDamage =
    currentHp > 0 &&
    runtimeIsMassiveDamageDeath(currentHp, maxHp, remainingDamage);
  const zeroHpHit = currentHp === 0 && remainingDamage > 0;
  const failuresAdded = zeroHpHit
    ? runtimeDamageAtZero(Boolean(options.critical)).failuresAdded
    : 0;
  let state = characterDeathSaveState(next);

  if (massiveDamage) {
    state = { successes: 0, failures: 3, stable: false, dead: true };
  } else if (zeroHpHit) {
    state = runtimeNormalizeDeathSaveState({
      ...state,
      stable: false,
      failures: state.failures + failuresAdded,
    });
  } else if (currentHp > 0 && resultingHp === 0) {
    state = runtimeResetDeathSaves();
  }

  next.currentHp = resultingHp;
  next.tempHp = tempHp - absorbedByTempHp;
  if ("temporaryHp" in next) next.temporaryHp = next.tempHp;
  const withState = writeCharacterDeathSaveState(next, state);
  const result = appendHistory(
    withState,
    "damage",
    `${damage} damage; HP ${currentHp}→${resultingHp}; failures +${failuresAdded}`,
  );

  return {
    character: result,
    damage,
    absorbedByTempHp,
    hpDamage,
    overflowDamage,
    failuresAdded,
    massiveDamage,
    becameUnconscious: currentHp > 0 && resultingHp === 0 && !state.dead,
    dead: state.dead,
    concentrationDc: damage > 0 ? Math.max(10, Math.floor(damage / 2)) : null,
  };
}

export function rollCharacterDeathSave<
  T extends DeathDyingCompatibleCharacter,
>(character: T, roll: number) {
  const state = characterDeathSaveState(character);
  if (Math.max(0, int(character.currentHp)) > 0) {
    return {
      character: structuredClone(character),
      roll,
      outcome: "ignored" as const,
      hpDelta: 0,
      state,
    };
  }
  const resolution = runtimeApplyDeathSaveRoll(state, roll);
  let next = writeCharacterDeathSaveState(
    structuredClone(character),
    resolution.state,
  );
  if (resolution.hpDelta > 0) {
    next.currentHp = Math.min(Math.max(1, int(next.maxHp, 1)), resolution.hpDelta);
    next = writeCharacterDeathSaveState(next, runtimeResetDeathSaves());
  }
  next = appendHistory(next, "death-save", `d20=${roll}; ${resolution.outcome}`);
  return { character: next, ...resolution };
}

export function stabilizeDyingCharacter<
  T extends DeathDyingCompatibleCharacter,
>(character: T): T {
  const state = runtimeStabilize(characterDeathSaveState(character));
  return appendHistory(
    writeCharacterDeathSaveState(structuredClone(character), state),
    "stabilize",
    state.dead ? "Ignored: dead" : "Stable",
  );
}

export function healDyingCharacter<
  T extends DeathDyingCompatibleCharacter,
>(character: T, amount: number): T {
  const next = structuredClone(character);
  const maxHp = Math.max(1, int(next.maxHp, 1));
  const before = Math.min(maxHp, Math.max(0, int(next.currentHp)));
  const healing = Math.max(0, int(amount));
  next.currentHp = Math.min(maxHp, before + healing);
  const withState = next.currentHp > 0
    ? writeCharacterDeathSaveState(next, runtimeResetDeathSaves())
    : next;
  return appendHistory(
    withState,
    "healing",
    `${healing} healing; HP ${before}→${next.currentHp}`,
  );
}

export function resetCharacterDeathSaves<
  T extends DeathDyingCompatibleCharacter,
>(character: T): T {
  return appendHistory(
    writeCharacterDeathSaveState(structuredClone(character), runtimeResetDeathSaves()),
    "reset",
    "Death saves reset",
  );
}

export const serializeDeathDyingCharacter = (
  character: DeathDyingCompatibleCharacter,
): string => JSON.stringify(character);

export function deserializeDeathDyingCharacter<
  T extends DeathDyingCompatibleCharacter,
>(payload: string): T {
  const parsed: unknown = JSON.parse(payload);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid death-and-dying character payload.");
  }
  return parsed as T;
}
