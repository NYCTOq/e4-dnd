export type WarlockEdition = "dnd_2014" | "dnd_2024";

const clampLevel = (level: number) => Math.max(1, Math.min(20, Math.floor(level)));
const CANTRIPS = [0,2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4] as const;
const SPELLS_2014 = [0,2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15] as const;
const PREPARED_2024 = [0,2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15] as const;
const PACT_SLOTS = [
  { slotLevel: 0, slots: 0 },
  { slotLevel: 1, slots: 1 }, { slotLevel: 1, slots: 2 },
  { slotLevel: 2, slots: 2 }, { slotLevel: 2, slots: 2 },
  { slotLevel: 3, slots: 2 }, { slotLevel: 3, slots: 2 },
  { slotLevel: 4, slots: 2 }, { slotLevel: 4, slots: 2 },
  { slotLevel: 5, slots: 2 }, { slotLevel: 5, slots: 2 },
  { slotLevel: 5, slots: 3 }, { slotLevel: 5, slots: 3 },
  { slotLevel: 5, slots: 3 }, { slotLevel: 5, slots: 3 },
  { slotLevel: 5, slots: 3 }, { slotLevel: 5, slots: 3 },
  { slotLevel: 5, slots: 4 }, { slotLevel: 5, slots: 4 },
  { slotLevel: 5, slots: 4 }, { slotLevel: 5, slots: 4 },
] as const;

export function getWarlockCantripCount(level: number) { return CANTRIPS[clampLevel(level)]; }
export function getWarlockKnownSpellLimit(level: number, ruleset: WarlockEdition) { return ruleset === "dnd_2014" ? SPELLS_2014[clampLevel(level)] : 0; }
export function getWarlockPreparedSpellLimit(level: number, ruleset: WarlockEdition) { return ruleset === "dnd_2024" ? PREPARED_2024[clampLevel(level)] : 0; }
export function getWarlockSubclassLevel(ruleset: WarlockEdition) { return ruleset === "dnd_2024" ? 3 : 1; }
export function getWarlockSubclassFeatureLevels(ruleset: WarlockEdition) { return ruleset === "dnd_2024" ? [3,6,10,14] : [1,6,10,14]; }
export function getWarlockPactMagicProgression(level: number) { return PACT_SLOTS[clampLevel(level)]; }
export function getMagicalCunningRecovery(level: number, ruleset: WarlockEdition) {
  if (ruleset !== "dnd_2024" || clampLevel(level) < 2) return 0;
  const slots = getWarlockPactMagicProgression(level).slots;
  return clampLevel(level) >= 20 ? slots : Math.ceil(slots / 2);
}
export function getMysticArcanumSpellLevels(level: number) {
  const safe = clampLevel(level);
  return [6,7,8,9].filter((_, index) => safe >= 11 + index * 2);
}
export function getWarlockCombatFeatures(level: number, ruleset: WarlockEdition) {
  const safe = clampLevel(level);
  const modern = ruleset === "dnd_2024";
  const pact = getWarlockPactMagicProgression(safe);
  return {
    pactMagic: true,
    pactSlotLevel: pact.slotLevel,
    pactSlots: pact.slots,
    otherworldlyPatron: !modern && safe >= 1,
    eldritchInvocations: safe >= (modern ? 1 : 2),
    pactBoon: !modern && safe >= 3,
    magicalCunning: modern && safe >= 2,
    magicalCunningRecovery: getMagicalCunningRecovery(safe, ruleset),
    contactPatron: modern && safe >= 9,
    mysticArcanumLevels: getMysticArcanumSpellLevels(safe),
    epicBoon: modern && safe >= 19,
    eldritchMaster: safe >= 20,
    cantrips: getWarlockCantripCount(safe),
    knownSpells: getWarlockKnownSpellLimit(safe, ruleset),
    preparedSpells: getWarlockPreparedSpellLimit(safe, ruleset),
  };
}
