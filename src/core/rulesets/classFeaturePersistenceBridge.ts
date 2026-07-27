import {
  buildClassRuntimeSnapshot,
  type ClassCompatibleCharacter,
} from "./classSubclassCharacterAdapter";
import type { RuntimeFeature } from "./classSubclassRuntimeRules";

export type CharacterCollection =
  | ClassCompatibleCharacter[]
  | { characters: ClassCompatibleCharacter[]; [key: string]: unknown };

export type FeatureMutationResult = {
  updated: boolean;
  character?: ClassCompatibleCharacter;
  collection?: CharacterCollection;
};

function charactersOf(collection: CharacterCollection): ClassCompatibleCharacter[] {
  return Array.isArray(collection) ? collection : collection.characters;
}

function replaceCharacters(
  collection: CharacterCollection,
  characters: ClassCompatibleCharacter[],
): CharacterCollection {
  return Array.isArray(collection)
    ? characters
    : { ...collection, characters };
}

export function parseClassCharacterCollection(
  payload: string | null,
): CharacterCollection | null {
  if (!payload) return null;

  try {
    const parsed: unknown = JSON.parse(payload);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (entry): entry is ClassCompatibleCharacter =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      );
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { characters?: unknown }).characters)
    ) {
      return parsed as CharacterCollection;
    }

    return null;
  } catch {
    return null;
  }
}

export function serializeClassCharacterCollection(
  collection: CharacterCollection,
): string {
  return JSON.stringify(collection);
}

export function mutateCharacterFeature(
  character: ClassCompatibleCharacter,
  featureId: string,
  mode: "spend" | "restore",
): ClassCompatibleCharacter {
  const next = structuredClone(character);
  const snapshot = buildClassRuntimeSnapshot(next);
  const unlockedIds = new Set(
    snapshot.unlockedFeatures.map((feature) => feature.id),
  );

  if (!Array.isArray(next.classFeatures) || !unlockedIds.has(featureId)) {
    return next;
  }

  next.classFeatures = next.classFeatures.map((feature) => {
    if (feature.id !== featureId) return feature;

    const maximum =
      snapshot.unlockedFeatures.find((entry) => entry.id === featureId)
        ?.maxUses ?? feature.maxUses;

    if (typeof maximum !== "number") return feature;

    const current =
      typeof feature.currentUses === "number"
        ? feature.currentUses
        : maximum;

    return {
      ...feature,
      maxUses: maximum,
      currentUses:
        mode === "spend"
          ? Math.max(0, current - 1)
          : maximum,
    } as RuntimeFeature;
  });

  return next;
}

export function mutateFeatureInCollection(
  collection: CharacterCollection,
  characterId: string,
  featureId: string,
  mode: "spend" | "restore",
): FeatureMutationResult {
  const source = charactersOf(collection);
  const index = source.findIndex(
    (entry) => String(entry.id ?? "") === characterId,
  );

  if (index < 0) {
    return { updated: false, collection: structuredClone(collection) };
  }

  const characters = structuredClone(source);
  characters[index] = mutateCharacterFeature(
    characters[index],
    featureId,
    mode,
  );

  return {
    updated: true,
    character: characters[index],
    collection: replaceCharacters(collection, characters),
  };
}

export function mutateFeatureInStorage(
  storage: Pick<Storage, "getItem" | "setItem">,
  storageKey: string,
  characterId: string,
  featureId: string,
  mode: "spend" | "restore",
): FeatureMutationResult {
  const collection = parseClassCharacterCollection(
    storage.getItem(storageKey),
  );

  if (!collection) return { updated: false };

  const result = mutateFeatureInCollection(
    collection,
    characterId,
    featureId,
    mode,
  );

  if (result.updated && result.collection) {
    storage.setItem(
      storageKey,
      serializeClassCharacterCollection(result.collection),
    );
  }

  return result;
}

export function discoverClassCharacterStorageKey(
  storage: Pick<Storage, "length" | "key" | "getItem">,
  preferredKeys: string[] = [
    "characters",
    "characters_list",
    "e4-dnd-characters",
    "e4_dnd_characters",
  ],
): string | null {
  for (const key of preferredKeys) {
    if (parseClassCharacterCollection(storage.getItem(key))) return key;
  }

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && parseClassCharacterCollection(storage.getItem(key))) {
      return key;
    }
  }

  return null;
}
