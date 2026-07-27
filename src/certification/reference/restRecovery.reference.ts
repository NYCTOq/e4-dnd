export type RulesetId = "dnd_2014" | "dnd_2024";

export type HitDiePool = {
  die: number;
  max: number;
  used: number;
};

export type SpellSlotPool = {
  level: number;
  max: number;
  used: number;
  pact?: boolean;
};

export type ResourcePool = {
  id: string;
  current: number;
  max: number;
  recovery: "short" | "long" | "both" | "manual";
};

export type RestState = {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  hitDice: HitDiePool[];
  spellSlots: SpellSlotPool[];
  resources: ResourcePool[];
  exhaustion: number;
  deathSaves: { successes: number; failures: number };
  concentrating: boolean;
  activeEffects: Array<{
    id: string;
    durationType: "rounds" | "minutes" | "hours" | "until-rest" | "permanent";
    expiresOn?: "short" | "long";
  }>;
};

const clampInt = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.floor(Number.isFinite(value) ? value : min)));

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((clampInt(level, 1, 20) - 1) / 4);
}

export function abilityModifier(score: number): number {
  return Math.floor((clampInt(score, 1, 30) - 10) / 2);
}

export function spendHitDie(
  state: RestState,
  die: number,
  roll: number,
  conModifier: number,
): RestState {
  const index = state.hitDice.findIndex(
    (pool) => pool.die === die && pool.used < pool.max,
  );

  if (index < 0) return structuredClone(state);

  const next = structuredClone(state);
  next.hitDice[index].used += 1;

  const healing = Math.max(0, clampInt(roll, 1, die) + conModifier);
  next.currentHp = Math.min(next.maxHp, Math.max(0, next.currentHp) + healing);

  return next;
}

export function recoverHitDice(
  pools: HitDiePool[],
  ruleset: RulesetId,
): HitDiePool[] {
  const next = structuredClone(pools);
  const totalMax = next.reduce((sum, pool) => sum + Math.max(0, pool.max), 0);
  const recoverCount =
    ruleset === "dnd_2014"
      ? Math.max(1, Math.floor(totalMax / 2))
      : totalMax;

  let remaining = recoverCount;

  for (const pool of next) {
    if (remaining <= 0) break;
    const recovered = Math.min(pool.used, remaining);
    pool.used -= recovered;
    remaining -= recovered;
  }

  return next;
}

export function recoverResources(
  pools: ResourcePool[],
  rest: "short" | "long",
): ResourcePool[] {
  return pools.map((pool) => {
    const shouldRecover =
      pool.recovery === "both" ||
      pool.recovery === rest ||
      (rest === "long" && pool.recovery === "short");

    return {
      ...pool,
      current: shouldRecover ? pool.max : pool.current,
    };
  });
}

export function recoverSpellSlots(
  pools: SpellSlotPool[],
  rest: "short" | "long",
): SpellSlotPool[] {
  return pools.map((pool) => ({
    ...pool,
    used:
      rest === "long" || (rest === "short" && pool.pact)
        ? 0
        : pool.used,
  }));
}

export function applyShortRest(state: RestState): RestState {
  const next = structuredClone(state);
  next.resources = recoverResources(next.resources, "short");
  next.spellSlots = recoverSpellSlots(next.spellSlots, "short");
  next.activeEffects = next.activeEffects.filter(
    (effect) => effect.expiresOn !== "short",
  );
  return next;
}

export function applyLongRest(
  state: RestState,
  ruleset: RulesetId,
): RestState {
  const next = structuredClone(state);

  next.currentHp = next.maxHp;
  next.tempHp = 0;
  next.hitDice = recoverHitDice(next.hitDice, ruleset);
  next.spellSlots = recoverSpellSlots(next.spellSlots, "long");
  next.resources = recoverResources(next.resources, "long");
  next.deathSaves = { successes: 0, failures: 0 };
  next.concentrating = false;
  next.activeEffects = next.activeEffects.filter(
    (effect) =>
      effect.durationType === "permanent" &&
      effect.expiresOn !== "long",
  );

  if (ruleset === "dnd_2014") {
    next.exhaustion = Math.max(0, next.exhaustion - 1);
  } else {
    next.exhaustion = 0;
  }

  return next;
}

export function spendSpellSlot(
  pools: SpellSlotPool[],
  level: number,
): SpellSlotPool[] {
  const next = structuredClone(pools);
  const pool = next.find(
    (entry) => entry.level === level && entry.used < entry.max,
  );
  if (pool) pool.used += 1;
  return next;
}

export function spendResource(
  pools: ResourcePool[],
  id: string,
  amount = 1,
): ResourcePool[] {
  return pools.map((pool) =>
    pool.id === id
      ? {
          ...pool,
          current: Math.max(
            0,
            pool.current - Math.max(0, Math.floor(amount)),
          ),
        }
      : pool,
  );
}
