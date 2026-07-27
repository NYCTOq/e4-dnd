import { useEffect, useMemo, useState } from "react";
import ClassFeaturePanel from "./ClassFeaturePanel";
import {
  discoverClassCharacterStorageKey,
  parseClassCharacterCollection,
  serializeClassCharacterCollection,
  type CharacterCollection,
} from "../../core/rulesets/classFeaturePersistenceBridge";
import type { ClassCompatibleCharacter } from "../../core/rulesets/classSubclassCharacterAdapter";

function collectionCharacters(
  collection: CharacterCollection,
): ClassCompatibleCharacter[] {
  return Array.isArray(collection)
    ? collection
    : collection.characters;
}

function replaceCharacter(
  collection: CharacterCollection,
  character: ClassCompatibleCharacter,
): CharacterCollection {
  const characters = collectionCharacters(collection).map((entry) =>
    String(entry.id ?? "") === String(character.id ?? "")
      ? character
      : entry,
  );

  return Array.isArray(collection)
    ? characters
    : { ...collection, characters };
}

function routeAllowsPanel(pathname: string): boolean {
  const value = pathname.toLowerCase();

  return (
    value.includes("character") ||
    value.includes("karakter") ||
    value.includes("play") ||
    value.includes("oyna")
  );
}

function candidateCharacterId(pathname: string): string | null {
  const ignored = new Set([
    "characters",
    "character",
    "karakterler",
    "karakter",
    "play",
    "play-mode",
    "playmode",
    "oyna",
  ]);

  const parts = pathname
    .split("/")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (!ignored.has(parts[index].toLowerCase())) {
      return parts[index];
    }
  }

  return null;
}

export function ClassFeatureRuntimeIntegrationMount() {
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [collection, setCollection] =
    useState<CharacterCollection | null>(null);

  const visible =
    typeof window !== "undefined" &&
    routeAllowsPanel(window.location.pathname);

  useEffect(() => {
    if (!visible) return;

    const key = discoverClassCharacterStorageKey(window.localStorage);
    if (!key) return;

    const parsed = parseClassCharacterCollection(
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

  if (!visible || !storageKey || !collection || !selected) {
    return null;
  }

  return (
    <aside
      className="class-feature-runtime-mount"
      data-testid="class-feature-runtime-integration"
    >
      <ClassFeaturePanel
        character={selected}
        compact
        onCharacterChange={(character) => {
          const next = replaceCharacter(collection, character);
          window.localStorage.setItem(
            storageKey,
            serializeClassCharacterCollection(next),
          );
          setCollection(next);
        }}
      />
    </aside>
  );
}

export default ClassFeatureRuntimeIntegrationMount;
