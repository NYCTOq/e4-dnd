export type OngoingSpellEffect = {
  id: string;
  spellId: string;
  spellName: string;
  castLevel: number;
  remainingRounds: number | null;
  concentration: boolean;
  repeatSaveAbility?: string;
  saveDc?: number;
  endOnSuccessfulSave: boolean;
  targets: Array<{
    id: string;
    label: string;
    active: boolean;
    successfulSaves: number;
    failedSaves: number;
  }>;
};

export type OngoingEffectCharacter = {
  ongoingSpellEffects?: OngoingSpellEffect[];
  concentrating?: boolean;
  concentrationSpellId?: string | null;
  [key: string]: unknown;
};

const cleanRounds = (rounds: number | null | undefined) =>
  rounds === null || rounds === undefined ? null : Math.max(1, Math.floor(rounds));

export function startOngoingSpellEffect<T extends OngoingEffectCharacter>(
  character: T,
  input: {
    spellId: string;
    spellName?: string;
    castLevel: number;
    durationRounds?: number | null;
    concentration?: boolean;
    repeatSaveAbility?: string;
    saveDc?: number;
    endOnSuccessfulSave?: boolean;
    targetCount?: number;
  },
): T & OngoingEffectCharacter {
  const targetCount = Math.max(1, Math.min(50, Math.floor(input.targetCount ?? 1)));
  const effect: OngoingSpellEffect = {
    id: input.spellId + '-' + Date.now().toString(36),
    spellId: input.spellId,
    spellName: input.spellName ?? input.spellId,
    castLevel: Math.max(0, Math.floor(input.castLevel)),
    remainingRounds: cleanRounds(input.durationRounds),
    concentration: Boolean(input.concentration),
    repeatSaveAbility: input.repeatSaveAbility,
    saveDc: typeof input.saveDc === 'number' ? Math.floor(input.saveDc) : undefined,
    endOnSuccessfulSave: input.endOnSuccessfulSave !== false,
    targets: Array.from({ length: targetCount }, (_, index) => ({
      id: 'target-' + (index + 1),
      label: 'Hedef ' + (index + 1),
      active: true,
      successfulSaves: 0,
      failedSaves: 0,
    })),
  };

  const existing = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  const withoutReplacedConcentration = effect.concentration
    ? existing.filter((entry) => !entry.concentration)
    : existing;

  return {
    ...character,
    ongoingSpellEffects: [...withoutReplacedConcentration, effect],
    concentrating: effect.concentration ? true : character.concentrating,
    concentrationSpellId: effect.concentration ? effect.spellId : character.concentrationSpellId,
  };
}

export function resolveOngoingEffectSave<T extends OngoingEffectCharacter>(
  character: T,
  effectId: string,
  targetId: string,
  saveTotal: number,
): { character: T & OngoingEffectCharacter; succeeded: boolean; ended: boolean } {
  const effects = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  let succeeded = false;
  let ended = false;
  const nextEffects = effects.map((effect) => {
    if (effect.id !== effectId) return effect;
    const dc = effect.saveDc ?? 0;
    succeeded = Math.floor(saveTotal) >= dc;
    const targets = effect.targets.map((target) => {
      if (target.id !== targetId || !target.active) return target;
      const active = succeeded && effect.endOnSuccessfulSave ? false : target.active;
      ended = !active;
      return {
        ...target,
        active,
        successfulSaves: target.successfulSaves + (succeeded ? 1 : 0),
        failedSaves: target.failedSaves + (succeeded ? 0 : 1),
      };
    });
    return { ...effect, targets };
  });
  return { character: { ...character, ongoingSpellEffects: nextEffects } as T & OngoingEffectCharacter, succeeded, ended };
}

export function advanceOngoingSpellEffects<T extends OngoingEffectCharacter>(character: T): T & OngoingEffectCharacter {
  const effects = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  const next = effects
    .map((effect) => ({
      ...effect,
      remainingRounds: effect.remainingRounds === null ? null : Math.max(0, effect.remainingRounds - 1),
    }))
    .filter((effect) => effect.remainingRounds === null || effect.remainingRounds > 0)
    .filter((effect) => effect.targets.some((target) => target.active));
  const concentrationStillActive = next.some((effect) => effect.concentration);
  return {
    ...character,
    ongoingSpellEffects: next,
    concentrating: concentrationStillActive ? true : character.concentrating && !effects.some((effect) => effect.concentration),
    concentrationSpellId: concentrationStillActive
      ? next.find((effect) => effect.concentration)?.spellId ?? null
      : effects.some((effect) => effect.concentration) ? null : character.concentrationSpellId,
  };
}

export function endOngoingSpellEffect<T extends OngoingEffectCharacter>(character: T, effectId: string): T & OngoingEffectCharacter {
  const effects = Array.isArray(character.ongoingSpellEffects) ? character.ongoingSpellEffects : [];
  const removed = effects.find((effect) => effect.id === effectId);
  const next = effects.filter((effect) => effect.id !== effectId);
  return {
    ...character,
    ongoingSpellEffects: next,
    concentrating: removed?.concentration ? false : character.concentrating,
    concentrationSpellId: removed?.concentration ? null : character.concentrationSpellId,
  };
}
