import { useEffect, useMemo, useState } from "react";
import RestActionsPanel from "./RestActionsPanel";
import {
  discoverCharacterStorageKey,
  parseCharacterCollection,
  serializeCharacterCollection,
  type CharacterCollectionShape,
} from "../../core/rulesets/restRecoveryPersistenceBridge";
import type { RestCompatibleCharacter } from "../../core/rulesets/restRecoveryCharacterAdapter";

function collectionCharacters(
  collection: CharacterCollectionShape,
): RestCompatibleCharacter[] {
  return Array.isArray(collection)
    ? collection
    : collection.characters;
}

function replaceCharacter(
  collection: CharacterCollectionShape,
  character: RestCompatibleCharacter,
): CharacterCollectionShape {
  const characters = collectionCharacters(collection).map((entry) =>
    String(entry.id ?? "") === String(character.id ?? "")
      ? character
      : entry,
  );

  return Array.isArray(collection)
    ? characters
    : { ...collection, characters };
}

function routeAllowsRestPanel(pathname: string): boolean {
  const value = pathname.toLowerCase();
  return (
    value.includes("rest") ||
    value.includes("dinlen") ||
    value.includes("character") ||
    value.includes("karakter")
  );
}

function candidateCharacterId(pathname: string): string | null {
  const parts = pathname
    .split("/")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);

  const ignored = new Set([
    "rest",
    "rest-center",
    "restcenter",
    "characters",
    "character",
    "karakterler",
    "karakter",
  ]);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (!ignored.has(parts[index].toLowerCase())) {
      return parts[index];
    }
  }

  return null;
}

export function RestRuntimeIntegrationMount() {
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [collection, setCollection] =
    useState<CharacterCollectionShape | null>(null);

  const visible =
    typeof window !== "undefined" &&
    routeAllowsRestPanel(window.location.pathname);

  useEffect(() => {
    if (!visible) return;

    const key = discoverCharacterStorageKey(window.localStorage);
    if (!key) return;

    const parsed = parseCharacterCollection(
      window.localStorage.getItem(key),
    );
    if (!parsed) return;

    setStorageKey(key);
    setCollection(parsed);
  }, [visible]);

  const selected = useMemo(() => {
    if (!collection) return null;

    const characters = collectionCharacters(collection);
    const routeId =
      typeof window !== "undefined"
        ? candidateCharacterId(window.location.pathname)
        : null;

    return (
      characters.find(
        (character) =>
          routeId &&
          String(character.id ?? "") === routeId,
      ) ??
      characters[0] ??
      null
    );
  }, [collection]);

  if (!visible || !collection || !selected || !storageKey) {
    return null;
  }

  return (
    <aside
      className="rest-runtime-integration-mount"
      data-testid="rest-runtime-integration"
    >
      <RestActionsPanel
        character={selected}
        compact
        onCharacterChange={(character) => {
          const next = replaceCharacter(collection, character);
          window.localStorage.setItem(
            storageKey,
            serializeCharacterCollection(next),
          );
          setCollection(next);
        }}
      />
    </aside>
  );
}

export default RestRuntimeIntegrationMount;
