import type { Character, CharacterResource } from "../../core/character/character.types";

export type RestKind = "short" | "long";
export type RestOptions = { healToFull: boolean; clearTempHp: boolean; resetDeathSaves: boolean; reduceExhaustion: boolean; clearConditions: boolean; shortRestHealing: number };
export type RestSummary = { characterId: string; name: string; hpBefore: number; hpAfter: number; tempHpBefore: number; tempHpAfter: number; spellSlotsRestored: number; hitDiceRestored: number; resourcesRestored: number; exhaustionBefore: number; exhaustionAfter: number };
export type RestHistoryEntry = { id: string; kind: RestKind; createdAt: string; characterIds: string[]; summaries: RestSummary[]; before: Character[] };
const HISTORY_KEY = "e4_dnd_rest_history_v1";

function restoreResources(resources: CharacterResource[], kind: RestKind) {
  return resources.map((resource) => {
    const shouldRestore = kind === "long" ? resource.recovery === "short" || resource.recovery === "long" : resource.recovery === "short";
    return shouldRestore ? { ...resource, used: 0 } : resource;
  });
}

export function getDefaultRestOptions(kind: RestKind): RestOptions {
  return { healToFull: kind === "long", clearTempHp: kind === "long", resetDeathSaves: kind === "long", reduceExhaustion: kind === "long", clearConditions: false, shortRestHealing: 0 };
}

export function applyRestToCharacter(character: Character, kind: RestKind, options: RestOptions) {
  const hpAfter = options.healToFull ? character.maxHp : Math.min(character.maxHp, character.currentHp + Math.max(0, Math.floor(options.shortRestHealing)));
  const spellSlots = kind === "long" ? character.spellSlots.map((slot) => ({ ...slot, used: 0 })) : character.spellSlots;
  const pactMagicSlots = kind === "long" ? (character.pactMagicSlots??[]).map((slot) => ({ ...slot, used: 0 })) : character.pactMagicSlots;
  const hitDice = kind === "long" ? character.hitDice.map((pool) => ({ ...pool, used: Math.max(0, pool.used - Math.max(1, Math.floor(pool.max / 2))) })) : character.hitDice;
  const resources = restoreResources(character.resources ?? [], kind);
  const next: Character = {
    ...character,
    currentHp: hpAfter,
    tempHp: options.clearTempHp ? 0 : character.tempHp,
    spellSlots,
    pactMagicSlots,
    usedArcanumSpellIds:kind==="long"?[]:character.usedArcanumSpellIds,
    activeSpellEffects:kind==="long"?[]:character.activeSpellEffects,
    hitDice,
    resources,
    deathSaves: options.resetDeathSaves ? { successes: 0, failures: 0 } : character.deathSaves,
    exhaustion: options.reduceExhaustion ? Math.max(0, character.exhaustion - 1) : character.exhaustion,
    conditions: options.clearConditions ? [] : character.conditions,
    conditionDurations: options.clearConditions ? {} : character.conditionDurations,
    updatedAt: new Date().toISOString(),
  };
  const summary: RestSummary = {
    characterId: character.id, name: character.name, hpBefore: character.currentHp, hpAfter: next.currentHp,
    tempHpBefore: character.tempHp, tempHpAfter: next.tempHp,
    spellSlotsRestored: character.spellSlots.reduce((sum, slot, index) => sum + Math.max(0, slot.used - (next.spellSlots[index]?.used ?? slot.used)), 0)+(character.pactMagicSlots??[]).reduce((sum,slot,index)=>sum+Math.max(0,slot.used-(next.pactMagicSlots?.[index]?.used??slot.used)),0),
    hitDiceRestored: character.hitDice.reduce((sum, pool, index) => sum + Math.max(0, pool.used - (next.hitDice[index]?.used ?? pool.used)), 0),
    resourcesRestored: (character.resources ?? []).reduce((sum, resource, index) => sum + Math.max(0, resource.used - (next.resources[index]?.used ?? resource.used)), 0),
    exhaustionBefore: character.exhaustion, exhaustionAfter: next.exhaustion,
  };
  return { character: next, summary };
}

export function applyRestToCharacters(characters: Character[], selectedIds: readonly string[], kind: RestKind, options: RestOptions) {
  const selected = new Set(selectedIds); const summaries: RestSummary[] = []; const before: Character[] = [];
  const next = characters.map((character) => {
    if (!selected.has(character.id)) return character;
    before.push(structuredClone(character));
    const result = applyRestToCharacter(character, kind, options); summaries.push(result.summary); return result.character;
  });
  return { characters: next, summaries, before };
}

export function loadRestHistory(): RestHistoryEntry[] {
  try { const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is RestHistoryEntry => Boolean(item) && typeof item === "object") : []; } catch { return []; }
}
export function saveRestHistory(history: RestHistoryEntry[]) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20))); } catch { /* unavailable */ } }
export function restoreRestSnapshot(characters: Character[], entry: RestHistoryEntry) { const snapshots = new Map(entry.before.map((character) => [character.id, character])); return characters.map((character) => snapshots.get(character.id) ?? character); }
