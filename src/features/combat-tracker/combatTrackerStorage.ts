export type CombatantKind = "Karakter" | "NPC" | "Canavar" | "Özel";
export type CombatCondition = "Blessed" | "Poisoned" | "Prone" | "Invisible" | "Stunned" | "Restrained" | "Concentration" | "Rage" | "Haki" | "Cursed";

export type CombatEffect = {
  id: string;
  condition: CombatCondition;
  remainingRounds: number | null;
  source: string;
};

export type Combatant = {
  id: string;
  sourceId: string;
  name: string;
  kind: CombatantKind;
  initiative: number;
  armorClass: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  conditions: CombatCondition[];
  effects: CombatEffect[];
  notes: string;
  isDefeated: boolean;
};

export type CombatEncounter = {
  id: string;
  campaignId: string;
  name: string;
  round: number;
  activeCombatantId: string;
  combatants: Combatant[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "e4_dnd_combat_tracker_v1";
const KINDS: readonly CombatantKind[] = ["Karakter", "NPC", "Canavar", "Özel"];
export const COMBAT_CONDITIONS: readonly CombatCondition[] = ["Blessed", "Poisoned", "Prone", "Invisible", "Stunned", "Restrained", "Concentration", "Rage", "Haki", "Cursed"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeEffect(value: unknown): CombatEffect | null {
  if (!isRecord(value) || typeof value.id !== "string" || !COMBAT_CONDITIONS.includes(value.condition as CombatCondition)) return null;
  const duration = value.remainingRounds === null ? null : Math.max(1, Math.floor(finiteNumber(value.remainingRounds, 1)));
  return {
    id: value.id,
    condition: value.condition as CombatCondition,
    remainingRounds: duration,
    source: typeof value.source === "string" ? value.source : "",
  };
}

export function createCombatEffect(condition: CombatCondition, remainingRounds: number | null = null, source = ""): CombatEffect {
  return {
    id: crypto.randomUUID(),
    condition,
    remainingRounds: remainingRounds === null ? null : Math.max(1, Math.floor(remainingRounds)),
    source: source.trim(),
  };
}

export function getActiveConditions(combatant: Pick<Combatant, "conditions" | "effects">) {
  return Array.from(new Set([...combatant.conditions, ...combatant.effects.map((effect) => effect.condition)]));
}

export function sanitizeCombatant(value: unknown): Combatant | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const maxHp = Math.max(1, Math.floor(finiteNumber(value.maxHp, 1)));
  const conditions = Array.isArray(value.conditions) ? value.conditions.filter((item): item is CombatCondition => COMBAT_CONDITIONS.includes(item as CombatCondition)) : [];
  const effects = Array.isArray(value.effects) ? value.effects.map(sanitizeEffect).filter((item): item is CombatEffect => Boolean(item)) : [];
  return {
    id: value.id,
    sourceId: typeof value.sourceId === "string" ? value.sourceId : "",
    name: value.name.trim() || "Adsız savaşçı",
    kind: KINDS.includes(value.kind as CombatantKind) ? value.kind as CombatantKind : "Özel",
    initiative: Math.floor(finiteNumber(value.initiative)),
    armorClass: Math.max(0, Math.floor(finiteNumber(value.armorClass, 10))),
    maxHp,
    currentHp: Math.min(maxHp, Math.max(0, Math.floor(finiteNumber(value.currentHp, maxHp)))),
    tempHp: Math.max(0, Math.floor(finiteNumber(value.tempHp))),
    conditions,
    effects,
    notes: typeof value.notes === "string" ? value.notes : "",
    isDefeated: Boolean(value.isDefeated),
  };
}

export function sanitizeCombatEncounter(value: unknown): CombatEncounter | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const now = new Date().toISOString();
  const combatants = Array.isArray(value.combatants) ? value.combatants.map(sanitizeCombatant).filter((item): item is Combatant => Boolean(item)) : [];
  const activeCombatantId = typeof value.activeCombatantId === "string" && combatants.some((item) => item.id === value.activeCombatantId) ? value.activeCombatantId : combatants[0]?.id ?? "";
  return {
    id: value.id,
    campaignId: typeof value.campaignId === "string" ? value.campaignId : "",
    name: value.name.trim() || "Adsız karşılaşma",
    round: Math.max(1, Math.floor(finiteNumber(value.round, 1))),
    activeCombatantId,
    combatants: sortCombatants(combatants),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

export function createCombatEncounter(name = "Yeni savaş", campaignId = ""): CombatEncounter {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), campaignId, name: name.trim() || "Yeni savaş", round: 1, activeCombatantId: "", combatants: [], createdAt: now, updatedAt: now };
}

export function createCombatant(name = "Yeni savaşçı", kind: CombatantKind = "Özel"): Combatant {
  return { id: crypto.randomUUID(), sourceId: "", name: name.trim() || "Yeni savaşçı", kind, initiative: 0, armorClass: 10, maxHp: 1, currentHp: 1, tempHp: 0, conditions: [], effects: [], notes: "", isDefeated: false };
}

export function sortCombatants(combatants: readonly Combatant[]) {
  return [...combatants].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name, "tr"));
}

export function tickCombatEffects(combatants: readonly Combatant[]) {
  return combatants.map((combatant) => ({
    ...combatant,
    effects: combatant.effects
      .map((effect) => effect.remainingRounds === null ? effect : { ...effect, remainingRounds: effect.remainingRounds - 1 })
      .filter((effect) => effect.remainingRounds === null || effect.remainingRounds > 0),
  }));
}

export function advanceTurn(encounter: CombatEncounter): CombatEncounter {
  if (!encounter.combatants.length) return encounter;
  const ordered = sortCombatants(encounter.combatants);
  const currentIndex = ordered.findIndex((item) => item.id === encounter.activeCombatantId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % ordered.length;
  const roundAdvanced = currentIndex >= 0 && nextIndex === 0;
  const combatants = roundAdvanced ? tickCombatEffects(ordered) : ordered;
  return { ...encounter, combatants, activeCombatantId: combatants[nextIndex].id, round: roundAdvanced ? encounter.round + 1 : encounter.round, updatedAt: new Date().toISOString() };
}

export function applyDamage(combatant: Combatant, amount: number): Combatant {
  let remaining = Math.max(0, Math.floor(amount));
  const tempAbsorbed = Math.min(combatant.tempHp, remaining);
  remaining -= tempAbsorbed;
  const currentHp = Math.max(0, combatant.currentHp - remaining);
  return { ...combatant, tempHp: combatant.tempHp - tempAbsorbed, currentHp, isDefeated: currentHp === 0 };
}

export function applyHealing(combatant: Combatant, amount: number): Combatant {
  const currentHp = Math.min(combatant.maxHp, combatant.currentHp + Math.max(0, Math.floor(amount)));
  return { ...combatant, currentHp, isDefeated: currentHp === 0 ? combatant.isDefeated : false };
}

export function loadCombatEncounters(): CombatEncounter[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(sanitizeCombatEncounter).filter((item): item is CombatEncounter => Boolean(item)) : [];
  } catch { return []; }
}

export function saveCombatEncounters(encounters: CombatEncounter[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(encounters)); } catch { /* localStorage kapalıysa oturum belleği devam eder. */ }
}
