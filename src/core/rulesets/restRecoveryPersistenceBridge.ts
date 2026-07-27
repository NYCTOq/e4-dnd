import {
  performCharacterLongRest,
  performCharacterShortRest,
  type RestCompatibleCharacter,
} from "./restRecoveryCharacterAdapter";

export type CharacterCollectionShape =
  | RestCompatibleCharacter[]
  | { characters: RestCompatibleCharacter[]; [key: string]: unknown };

export type RestPersistenceResult = {
  updated: boolean;
  character?: RestCompatibleCharacter;
  collection?: CharacterCollectionShape;
  summary?: ReturnType<typeof performCharacterShortRest>["summary"];
};

function getCharacters(
  collection: CharacterCollectionShape,
): RestCompatibleCharacter[] {
  return Array.isArray(collection)
    ? collection
    : Array.isArray(collection.characters)
      ? collection.characters
      : [];
}

function replaceCharacters(
  collection: CharacterCollectionShape,
  characters: RestCompatibleCharacter[],
): CharacterCollectionShape {
  return Array.isArray(collection)
    ? characters
    : { ...collection, characters };
}

export function applyRestToCharacterCollection(
  collection: CharacterCollectionShape,
  characterId: string,
  kind: "short" | "long",
): RestPersistenceResult {
  const source = getCharacters(collection);
  const index = source.findIndex(
    (character) => String(character.id ?? "") === characterId,
  );

  if (index < 0) {
    return { updated: false, collection: structuredClone(collection) };
  }

  const characters = structuredClone(source);
  const result =
    kind === "short"
      ? performCharacterShortRest(characters[index])
      : performCharacterLongRest(characters[index]);

  characters[index] = result.character;

  return {
    updated: true,
    character: result.character,
    collection: replaceCharacters(collection, characters),
    summary: result.summary,
  };
}

export function parseCharacterCollection(
  payload: string | null,
): CharacterCollectionShape | null {
  if (!payload) return null;

  try {
    const parsed: unknown = JSON.parse(payload);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (entry): entry is RestCompatibleCharacter =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      );
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { characters?: unknown }).characters)
    ) {
      return parsed as CharacterCollectionShape;
    }

    return null;
  } catch {
    return null;
  }
}

export function serializeCharacterCollection(
  collection: CharacterCollectionShape,
): string {
  return JSON.stringify(collection);
}

export function applyRestInStorage(
  storage: Pick<Storage, "getItem" | "setItem">,
  storageKey: string,
  characterId: string,
  kind: "short" | "long",
): RestPersistenceResult {
  const collection = parseCharacterCollection(storage.getItem(storageKey));

  if (!collection) {
    return { updated: false };
  }

  const result = applyRestToCharacterCollection(
    collection,
    characterId,
    kind,
  );

  if (result.updated && result.collection) {
    storage.setItem(
      storageKey,
      serializeCharacterCollection(result.collection),
    );
  }

  return result;
}

export function discoverCharacterStorageKey(
  storage: Pick<Storage, "length" | "key" | "getItem">,
  preferredKeys: string[] = [
    "characters",
    "characters_list",
    "e4-dnd-characters",
    "e4_dnd_characters",
  ],
): string | null {
  for (const key of preferredKeys) {
    if (parseCharacterCollection(storage.getItem(key))) {
      return key;
    }
  }

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && parseCharacterCollection(storage.getItem(key))) {
      return key;
    }
  }

  return null;
}
