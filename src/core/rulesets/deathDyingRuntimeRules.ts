export type DeathSaveState = {
  successes: number;
  failures: number;
  stable: boolean;
  dead: boolean;
};

export type DeathSaveResolution = {
  state: DeathSaveState;
  roll: number;
  outcome:
    | "critical-failure"
    | "failure"
    | "success"
    | "critical-success"
    | "ignored";
  hpDelta: number;
};

export type DamageAtZeroResult = {
  failuresAdded: number;
  dead: boolean;
};

export function runtimeClampDeathSaveCount(
  value: number,
): number {
  return Math.min(
    3,
    Math.max(0, Math.floor(value)),
  );
}

export function runtimeNormalizeDeathSaveState(
  state: Partial<DeathSaveState>,
): DeathSaveState {
  const successes = runtimeClampDeathSaveCount(
    state.successes ?? 0,
  );
  const failures = runtimeClampDeathSaveCount(
    state.failures ?? 0,
  );
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

export function runtimeClassifyDeathSaveRoll(
  roll: number,
):
  | "critical-failure"
  | "failure"
  | "success"
  | "critical-success" {
  const normalized = Math.min(
    20,
    Math.max(1, Math.floor(roll)),
  );

  if (normalized === 1) return "critical-failure";
  if (normalized === 20) return "critical-success";
  if (normalized >= 10) return "success";
  return "failure";
}

export function runtimeApplyDeathSaveRoll(
  state: Partial<DeathSaveState>,
  roll: number,
): DeathSaveResolution {
  const current = runtimeNormalizeDeathSaveState(state);

  if (current.dead || current.stable) {
    return {
      state: current,
      roll,
      outcome: "ignored",
      hpDelta: 0,
    };
  }

  const outcome =
    runtimeClassifyDeathSaveRoll(roll);

  if (outcome === "critical-success") {
    return {
      state: {
        successes: 0,
        failures: 0,
        stable: false,
        dead: false,
      },
      roll,
      outcome,
      hpDelta: 1,
    };
  }

  const next = {
    ...current,
    successes:
      current.successes +
      (outcome === "success" ? 1 : 0),
    failures:
      current.failures +
      (outcome === "failure"
        ? 1
        : outcome === "critical-failure"
          ? 2
          : 0),
  };

  return {
    state: runtimeNormalizeDeathSaveState(next),
    roll,
    outcome,
    hpDelta: 0,
  };
}

export function runtimeDamageAtZero(
  criticalHit: boolean,
): DamageAtZeroResult {
  const failuresAdded = criticalHit ? 2 : 1;

  return {
    failuresAdded,
    dead: failuresAdded >= 3,
  };
}

export function runtimeIsMassiveDamageDeath(
  currentHp: number,
  maxHp: number,
  damage: number,
): boolean {
  const hp = Math.max(0, Math.floor(currentHp));
  const maximum = Math.max(1, Math.floor(maxHp));
  const incoming = Math.max(0, Math.floor(damage));
  const remaining = hp - incoming;

  return remaining <= -maximum;
}

export function runtimeStabilize(
  state: Partial<DeathSaveState>,
): DeathSaveState {
  const current = runtimeNormalizeDeathSaveState(state);

  if (current.dead) return current;

  return {
    successes: 0,
    failures: 0,
    stable: true,
    dead: false,
  };
}

export function runtimeHealFromZero(
  healing: number,
): {
  hp: number;
  state: DeathSaveState;
} {
  const amount = Math.max(
    0,
    Math.floor(healing),
  );

  return {
    hp: amount,
    state: {
      successes: 0,
      failures: 0,
      stable: false,
      dead: false,
    },
  };
}

export function runtimeResetDeathSaves(): DeathSaveState {
  return {
    successes: 0,
    failures: 0,
    stable: false,
    dead: false,
  };
}
