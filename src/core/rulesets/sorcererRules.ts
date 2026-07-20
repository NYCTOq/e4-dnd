export type SorcererEdition = "dnd_2014" | "dnd_2024";

const clampLevel = (level: number) => Math.max(1, Math.min(20, Math.floor(level)));
const SLOT_COSTS: Readonly<Record<number, number>> = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };
const SLOT_MIN_LEVEL: Readonly<Record<number, number>> = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 9 };
const KNOWN_SPELLS_2014 = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15] as const;
const PREPARED_SPELLS_2024 = [0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22] as const;
const CANTRIPS_2014 = [0, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6] as const;
const CANTRIPS_2024 = [0, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6] as const;

export function getSorcerySlotCost(slotLevel: number) { return SLOT_COSTS[Math.floor(slotLevel)] ?? null; }
export function getSorcerySlotMinimumLevel(slotLevel: number) { return SLOT_MIN_LEVEL[Math.floor(slotLevel)] ?? null; }
export function canCreateSorcerySlot(slotLevel: number, pointsRemaining: number, hasSpentSlot: boolean, sorcererLevel = 20) {
  const cost = getSorcerySlotCost(slotLevel);
  const minimumLevel = getSorcerySlotMinimumLevel(slotLevel);
  return cost !== null && minimumLevel !== null && clampLevel(sorcererLevel) >= minimumLevel && pointsRemaining >= cost && hasSpentSlot;
}
export function getPointsFromSlot(slotLevel: number) { return Math.max(1, Math.min(9, Math.floor(slotLevel))); }
export function getSorceryPointMaximum(level: number) { const safe = clampLevel(level); return safe >= 2 ? safe : 0; }
export function getSorcererKnownSpellLimit(level: number, ruleset: SorcererEdition) { return ruleset === "dnd_2014" ? KNOWN_SPELLS_2014[clampLevel(level)] : 0; }
export function getSorcererPreparedSpellLimit(level: number, ruleset: SorcererEdition) { return ruleset === "dnd_2024" ? PREPARED_SPELLS_2024[clampLevel(level)] : 0; }
export function getSorcererCantripCount(level: number, ruleset: SorcererEdition) { const safe = clampLevel(level); return ruleset === "dnd_2024" ? CANTRIPS_2024[safe] : CANTRIPS_2014[safe]; }
export function getSorcererSubclassLevel(ruleset: SorcererEdition) { return ruleset === "dnd_2024" ? 3 : 1; }
export function getSorcererSubclassFeatureLevels(ruleset: SorcererEdition) { return ruleset === "dnd_2024" ? [3, 6, 14, 18] : [1, 6, 14, 18]; }
export function getMetamagicChoiceCountForSorcerer(level: number, ruleset: SorcererEdition) {
  const safe = clampLevel(level);
  const unlock = ruleset === "dnd_2024" ? 2 : 3;
  if (safe < unlock) return 0;
  if (ruleset === "dnd_2024") return safe >= 17 ? 6 : safe >= 10 ? 4 : 2;
  return safe >= 17 ? 4 : safe >= 10 ? 3 : 2;
}
export function getInnateSorceryUses(level: number, ruleset: SorcererEdition) { return ruleset === "dnd_2024" && clampLevel(level) >= 1 ? 2 : 0; }
export function getSorcerousRestorationAmount(level: number, ruleset: SorcererEdition) {
  const safe = clampLevel(level);
  if (ruleset === "dnd_2024") return safe >= 5 ? Math.floor(safe / 2) : 0;
  return safe >= 20 ? 4 : 0;
}
export function getSorcererCombatFeatures(level: number, ruleset: SorcererEdition = "dnd_2014") {
  const safe = clampLevel(level);
  const modern = ruleset === "dnd_2024";
  return {
    spellcasting: true,
    sorcerousOrigin: !modern && safe >= 1,
    innateSorcery: modern && safe >= 1,
    innateSorceryUses: getInnateSorceryUses(safe, ruleset),
    fontOfMagic: safe >= 2,
    metamagic: safe >= (modern ? 2 : 3),
    metamagicChoices: getMetamagicChoiceCountForSorcerer(safe, ruleset),
    sorcerousRestoration: modern ? safe >= 5 : safe >= 20,
    sorcerousRestorationAmount: getSorcerousRestorationAmount(safe, ruleset),
    sorceryIncarnate: modern && safe >= 7,
    epicBoon: modern && safe >= 19,
    arcaneApotheosis: modern && safe >= 20,
    sorceryPointMaximum: getSorceryPointMaximum(safe),
    cantrips: getSorcererCantripCount(safe, ruleset),
    knownSpells: getSorcererKnownSpellLimit(safe, ruleset),
    preparedSpells: getSorcererPreparedSpellLimit(safe, ruleset),
  };
}

export function getDraconicSorcererProgression(level: number, ruleset: SorcererEdition) {
  const safe = clampLevel(level), modern = ruleset === "dnd_2024";
  const unlock = modern ? 3 : 1;
  return {
    unlocked: safe >= unlock,
    draconicResilience: safe >= unlock,
    dragonAncestor: !modern && safe >= 1,
    draconicSpells: modern && safe >= 3,
    elementalAffinity: safe >= 6,
    dragonWings: safe >= 14,
    capstone: safe >= 18 ? (modern ? "Dragon Companion" : "Draconic Presence") : null,
  };
}

export function getWildMagicSorcererProgression(level: number, ruleset: SorcererEdition) {
  const safe = clampLevel(level), unlock = ruleset === "dnd_2024" ? 3 : 1;
  return {
    wildMagicSurge: safe >= unlock,
    tidesOfChaos: safe >= unlock,
    bendLuck: safe >= 6,
    controlledChaos: safe >= 14,
    capstone: safe >= 18 ? (ruleset === "dnd_2024" ? "Tamed Surge" : "Spell Bombardment") : null,
  };
}
