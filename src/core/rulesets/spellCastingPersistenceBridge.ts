import {
  applyDamageToSpellTarget,
  applyHealingToSpellTarget,
  setCharacterConcentration,
  spendCharacterSpellSlot,
  restoreCharacterSpellSlot,
  type SpellCompatibleCharacter,
} from "./spellCharacterCombatAdapter";

export type SpellCharacterCollection =
  | SpellCompatibleCharacter[]
  | { characters: SpellCompatibleCharacter[]; [key: string]: unknown };

export type CombatTargetCollection =
  | SpellCompatibleCharacter[]
  | { combatants: SpellCompatibleCharacter[]; [key: string]: unknown };

const characterList = (collection: SpellCharacterCollection) =>
  Array.isArray(collection) ? collection : collection.characters;
const combatantList = (collection: CombatTargetCollection) =>
  Array.isArray(collection) ? collection : collection.combatants;

export function parseSpellCharacterCollection(payload: string | null): SpellCharacterCollection | null {
  if (!payload) return null;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (Array.isArray(parsed)) return parsed.filter((entry): entry is SpellCompatibleCharacter => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry));
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { characters?: unknown }).characters)) return parsed as SpellCharacterCollection;
    return null;
  } catch { return null; }
}

export function parseCombatTargetCollection(payload: string | null): CombatTargetCollection | null {
  if (!payload) return null;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (Array.isArray(parsed)) return parsed.filter((entry): entry is SpellCompatibleCharacter => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry));
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { combatants?: unknown }).combatants)) return parsed as CombatTargetCollection;
    return null;
  } catch { return null; }
}

export function mutateCasterInCollection(
  collection: SpellCharacterCollection,
  casterId: string,
  mutation:
    | { type: "spend-slot" | "restore-slot"; level: number; pact?: boolean }
    | { type: "set-concentration"; spellId: string | null },
): SpellCharacterCollection {
  const characters = characterList(collection).map((character) => {
    if (String(character.id ?? "") !== casterId) return character;
    if (mutation.type === "spend-slot") return spendCharacterSpellSlot(character, mutation.level, Boolean(mutation.pact));
    if (mutation.type === "restore-slot") return restoreCharacterSpellSlot(character, mutation.level, Boolean(mutation.pact));
    if (mutation.type === "set-concentration") {
      return setCharacterConcentration(
        character,
        mutation.spellId,
      );
    }

    return character;
  });
  return Array.isArray(collection) ? characters : { ...collection, characters };
}

export function mutateTargetInCollection(
  collection: CombatTargetCollection,
  targetId: string,
  mutation: { type: "damage" | "healing"; amount: number },
): CombatTargetCollection {
  const combatants = combatantList(collection).map((target) => {
    if (String(target.id ?? "") !== targetId) return target;
    return mutation.type === "damage"
      ? applyDamageToSpellTarget(target, mutation.amount)
      : applyHealingToSpellTarget(target, mutation.amount);
  });
  return Array.isArray(collection) ? combatants : { ...collection, combatants };
}

export const serializeSpellCollection = (collection: SpellCharacterCollection | CombatTargetCollection) => JSON.stringify(collection);

export function persistCasterMutation(
  storage: Pick<Storage, "getItem" | "setItem">,
  storageKey: string,
  casterId: string,
  mutation:
    | { type: "spend-slot" | "restore-slot"; level: number; pact?: boolean }
    | { type: "set-concentration"; spellId: string | null },
): boolean {
  const collection = parseSpellCharacterCollection(storage.getItem(storageKey));
  if (!collection) return false;
  storage.setItem(storageKey, serializeSpellCollection(mutateCasterInCollection(collection, casterId, mutation)));
  return true;
}

export function persistTargetMutation(
  storage: Pick<Storage, "getItem" | "setItem">,
  storageKey: string,
  targetId: string,
  mutation: { type: "damage" | "healing"; amount: number },
): boolean {
  const collection = parseCombatTargetCollection(storage.getItem(storageKey));
  if (!collection) return false;
  storage.setItem(storageKey, serializeSpellCollection(mutateTargetInCollection(collection, targetId, mutation)));
  return true;
}

function discover(storage: Pick<Storage, "length" | "key" | "getItem">, preferredKeys: string[], parser: (payload: string | null) => unknown): string | null {
  for (const key of preferredKeys) if (parser(storage.getItem(key))) return key;
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && parser(storage.getItem(key))) return key;
  }
  return null;
}

export const discoverSpellStorageKey = (
  storage: Pick<Storage, "length" | "key" | "getItem">,
  preferredKeys = ["characters", "characters_list", "e4-dnd-characters", "e4_dnd_characters"],
) => discover(storage, preferredKeys, parseSpellCharacterCollection);

export const discoverCombatStorageKey = (
  storage: Pick<Storage, "length" | "key" | "getItem">,
  preferredKeys = ["combatTracker", "combat-tracker", "combatants", "e4-dnd-combat"],
) => discover(storage, preferredKeys, parseCombatTargetCollection);
