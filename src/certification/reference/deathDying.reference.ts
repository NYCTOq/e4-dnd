export type DeathSaveState = {
  successes: number;
  failures: number;
  stable: boolean;
  dead: boolean;
};

export function clampDeathSaveCount(value: number): number {
  return Math.min(3, Math.max(0, Math.floor(value)));
}

export function normalizeDeathSaveState(
  state: Partial<DeathSaveState>,
): DeathSaveState {
  const successes = clampDeathSaveCount(state.successes ?? 0);
  const failures = clampDeathSaveCount(state.failures ?? 0);
  const dead = Boolean(state.dead) || failures >= 3;
  const stable =
    !dead &&
    (Boolean(state.stable) || successes >= 3);

  return {
    successes,
    failures,
    stable,
    dead,
  };
}

export function deathSaveRollOutcome(
  roll: number,
): "critical-failure" | "failure" | "success" | "critical-success" {
  const normalized = Math.min(20, Math.max(1, Math.floor(roll)));

  if (normalized === 1) return "critical-failure";
  if (normalized === 20) return "critical-success";
  if (normalized >= 10) return "success";
  return "failure";
}

export function applyDeathSaveRoll(
  state: DeathSaveState,
  roll: number,
): DeathSaveState & { regainHp: number } {
  const current = normalizeDeathSaveState(state);

  if (current.dead || current.stable) {
    return { ...current, regainHp: 0 };
  }

  const outcome = deathSaveRollOutcome(roll);

  if (outcome === "critical-success") {
    return {
      successes: 0,
      failures: 0,
      stable: false,
      dead: false,
      regainHp: 1,
    };
  }

  const successes =
    current.successes +
    (outcome === "success" ? 1 : 0);

  const failures =
    current.failures +
    (outcome === "failure"
      ? 1
      : outcome === "critical-failure"
        ? 2
        : 0);

  return {
    ...normalizeDeathSaveState({
      successes,
      failures,
    }),
    regainHp: 0,
  };
}

export function damageAtZeroFailureCount(
  isCriticalHit: boolean,
): number {
  return isCriticalHit ? 2 : 1;
}

export function massiveDamageKills(
  currentHp: number,
  maxHp: number,
  damage: number,
): boolean {
  const remaining = currentHp - Math.max(0, damage);

  return remaining <= -Math.max(1, maxHp);
}

export function stabilizeDeathSaveState(
  state: DeathSaveState,
): DeathSaveState {
  const current = normalizeDeathSaveState(state);

  if (current.dead) return current;

  return {
    successes: 0,
    failures: 0,
    stable: true,
    dead: false,
  };
}

export function healFromZero(
  amount: number,
): {
  currentHp: number;
  deathSaves: DeathSaveState;
} {
  return {
    currentHp: Math.max(0, Math.floor(amount)),
    deathSaves: {
      successes: 0,
      failures: 0,
      stable: false,
      dead: false,
    },
  };
}

export function resetDeathSaves(): DeathSaveState {
  return {
    successes: 0,
    failures: 0,
    stable: false,
    dead: false,
  };
}
