import {
  applyCharacterLevelUp,
  normalizeLevelUpCharacter,
  type AbilityKey,
  type LevelUpChoice,
  type LevelUpCompatibleCharacter,
} from "./levelUpCharacterAdapter";

export type LevelUpCharacterCollection =
  | LevelUpCompatibleCharacter[]
  | {
      characters: LevelUpCompatibleCharacter[];
      [key: string]: unknown;
    };

function characterList(
  collection: LevelUpCharacterCollection,
): LevelUpCompatibleCharacter[] {
  return Array.isArray(collection)
    ? collection
    : collection.characters;
}

function replaceCharacterList(
  collection: LevelUpCharacterCollection,
  characters: LevelUpCompatibleCharacter[],
): LevelUpCharacterCollection {
  return Array.isArray(collection)
    ? characters
    : { ...collection, characters };
}

export function parseLevelUpCharacterCollection(
  payload: string | null,
): LevelUpCharacterCollection | null {
  if (!payload) return null;

  try {
    const parsed: unknown = JSON.parse(payload);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (entry): entry is LevelUpCompatibleCharacter =>
            Boolean(entry) &&
            typeof entry === "object" &&
            !Array.isArray(entry),
        )
        .map((entry) =>
          normalizeLevelUpCharacter(entry),
        );
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(
        (parsed as { characters?: unknown }).characters,
      )
    ) {
      const wrapped = parsed as {
        characters: LevelUpCompatibleCharacter[];
        [key: string]: unknown;
      };

      return {
        ...wrapped,
        characters: wrapped.characters.map((entry) =>
          normalizeLevelUpCharacter(entry),
        ),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function mutateCharacterLevelUpInCollection(
  collection: LevelUpCharacterCollection,
  characterId: string,
  choice: LevelUpChoice,
): LevelUpCharacterCollection {
  const characters = characterList(collection).map(
    (character) =>
      String(character.id ?? "") === characterId
        ? applyCharacterLevelUp(character, choice)
        : character,
  );

  return replaceCharacterList(
    collection,
    characters,
  );
}

export function serializeLevelUpCollection(
  collection: LevelUpCharacterCollection,
): string {
  return JSON.stringify(collection);
}

export function persistCharacterLevelUp(
  storage: Pick<Storage, "getItem" | "setItem">,
  storageKey: string,
  characterId: string,
  choice: LevelUpChoice,
): boolean {
  const collection =
    parseLevelUpCharacterCollection(
      storage.getItem(storageKey),
    );

  if (!collection) return false;

  const next =
    mutateCharacterLevelUpInCollection(
      collection,
      characterId,
      choice,
    );

  storage.setItem(
    storageKey,
    serializeLevelUpCollection(next),
  );

  return true;
}

export function discoverLevelUpStorageKey(
  storage: Pick<Storage, "length" | "key" | "getItem">,
  preferredKeys = [
    "characters",
    "characters_list",
    "e4-dnd-characters",
    "e4_dnd_characters",
  ],
): string | null {
  for (const key of preferredKeys) {
    if (
      parseLevelUpCharacterCollection(
        storage.getItem(key),
      )
    ) {
      return key;
    }
  }

  for (
    let index = 0;
    index < storage.length;
    index += 1
  ) {
    const key = storage.key(index);

    if (
      key &&
      parseLevelUpCharacterCollection(
        storage.getItem(key),
      )
    ) {
      return key;
    }
  }

  return null;
}

export function buildAbilityIncreaseChoice(
  classId: string,
  firstAbility: AbilityKey,
  secondAbility: AbilityKey,
): LevelUpChoice {
  return {
    classId,
    abilityIncreases:
      firstAbility === secondAbility
        ? { [firstAbility]: 2 }
        : {
            [firstAbility]: 1,
            [secondAbility]: 1,
          },
  };
}

export function buildFeatChoice(
  classId: string,
  featId: string,
): LevelUpChoice {
  return {
    classId,
    selectedFeatId: featId.trim(),
  };
}
