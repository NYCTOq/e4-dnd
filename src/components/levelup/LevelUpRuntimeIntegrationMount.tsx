import { useEffect, useMemo, useState } from "react";
import LevelUpRuntimePanel from "./LevelUpRuntimePanel";
import MulticlassRuntimePanel from "./MulticlassRuntimePanel-N-MEGA9";
import {
  discoverLevelUpStorageKey,
  parseLevelUpCharacterCollection,
  serializeLevelUpCollection,
  type LevelUpCharacterCollection,
} from "../../core/rulesets/levelUpPersistenceBridge";
import type { LevelUpCompatibleCharacter } from "../../core/rulesets/levelUpCharacterAdapter";

function characterList(
  collection: LevelUpCharacterCollection,
): LevelUpCompatibleCharacter[] {
  return Array.isArray(collection)
    ? collection
    : collection.characters;
}

function replaceCharacter(
  collection: LevelUpCharacterCollection,
  character: LevelUpCompatibleCharacter,
): LevelUpCharacterCollection {
  const characters = characterList(collection).map((entry) =>
    String(entry.id ?? "") === String(character.id ?? "")
      ? character
      : entry,
  );

  return Array.isArray(collection)
    ? characters
    : { ...collection, characters };
}

function routeAllowsLevelUp(pathname: string): boolean {
  const value = pathname.toLowerCase();

  return (
    value.includes("builder") ||
    value.includes("character") ||
    value.includes("karakter") ||
    value.includes("play") ||
    value.includes("oyna") ||
    value.includes("level") ||
    value.includes("seviye")
  );
}

function routeEntityId(pathname: string): string | null {
  const ignored = new Set([
    "builder",
    "characters",
    "character",
    "karakterler",
    "karakter",
    "edit",
    "duzenle",
    "düzenle",
    "play",
    "play-mode",
    "playmode",
    "oyna",
    "level-up",
    "levelup",
    "seviye-atla",
  ]);

  const parts = pathname
    .split("/")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const candidate = parts[index];

    if (!ignored.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return null;
}

const defaultFeatOptions = [
  { id: "alert", name: "Alert" },
  { id: "lucky", name: "Lucky" },
  { id: "tough", name: "Tough" },
  { id: "war-caster", name: "War Caster" },
];

export function LevelUpRuntimeIntegrationMount() {
  const [storageKey, setStorageKey] =
    useState<string | null>(null);
  const [collection, setCollection] =
    useState<LevelUpCharacterCollection | null>(null);

  const visible =
    typeof window !== "undefined" &&
    routeAllowsLevelUp(window.location.pathname);

  useEffect(() => {
    if (!visible) return;

    const key = discoverLevelUpStorageKey(
      window.localStorage,
    );

    if (!key) return;

    const parsed =
      parseLevelUpCharacterCollection(
        window.localStorage.getItem(key),
      );

    if (!parsed) return;

    setStorageKey(key);
    setCollection(parsed);
  }, [visible]);

  const selectedCharacter = useMemo(() => {
    if (!collection) return null;

    const characters = characterList(collection);
    const routeId =
      typeof window !== "undefined"
        ? routeEntityId(window.location.pathname)
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

  if (
    !visible ||
    !storageKey ||
    !collection ||
    !selectedCharacter
  ) {
    return null;
  }

  return (
    <aside
      className="level-up-runtime-integration-mount"
      data-testid="level-up-runtime-integration"
    >
      <LevelUpRuntimePanel
        character={selectedCharacter}
        featOptions={defaultFeatOptions}
        onCharacterChange={(character) => {
          const next = replaceCharacter(
            collection,
            character,
          );

          window.localStorage.setItem(
            storageKey,
            serializeLevelUpCollection(next),
          );

          setCollection(next);
        }}
      />
      <MulticlassRuntimePanel
        character={selectedCharacter}
        onCharacterChange={(character) => {
          const next = replaceCharacter(collection, character);
          window.localStorage.setItem(storageKey, serializeLevelUpCollection(next));
          setCollection(next);
        }}
      />
    </aside>
  );
}

export default LevelUpRuntimeIntegrationMount;
