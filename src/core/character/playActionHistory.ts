import type { Character } from "./character.types";

export type PlayActionSnapshot = {
  characterId: string;
  label: string;
  createdAt: string;
  character: Character;
};

const PREFIX = "e4_dnd_play_undo_v1:";

export function getPlayActionStorageKey(characterId: string) {
  return `${PREFIX}${characterId}`;
}

export function savePlayActionSnapshot(character: Character, label: string, storage: Pick<Storage, "setItem"> = localStorage) {
  const snapshot: PlayActionSnapshot = {
    characterId: character.id,
    label,
    createdAt: new Date().toISOString(),
    character: structuredClone(character),
  };
  storage.setItem(getPlayActionStorageKey(character.id), JSON.stringify(snapshot));
  return snapshot;
}

export function readPlayActionSnapshot(characterId: string, storage: Pick<Storage, "getItem"> = localStorage): PlayActionSnapshot | null {
  try {
    const raw = storage.getItem(getPlayActionStorageKey(characterId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayActionSnapshot;
    if (parsed.characterId !== characterId || parsed.character?.id !== characterId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlayActionSnapshot(characterId: string, storage: Pick<Storage, "removeItem"> = localStorage) {
  storage.removeItem(getPlayActionStorageKey(characterId));
}
