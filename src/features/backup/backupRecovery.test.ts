import { beforeEach, describe, expect, it } from "vitest";

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
  clear: () => values.clear(),
  key: (index: number) => [...values.keys()][index] ?? null,
  get length() { return values.size; },
};
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
import {
  classifyBackupImportError,
  clearPreRestoreSnapshot,
  loadPreRestoreSnapshot,
  savePreRestoreSnapshot,
} from "./backupRecovery";
import { DEFAULT_APP_SETTINGS } from "../../shared/settings/appSettings";

const emptyData = {
  characters: [],
  campaigns: [],
  homebrewSpells: [],
  homebrewItems: [],
  homebrewMonsters: [],
  favoriteMonsterIds: [],
  appSettings: DEFAULT_APP_SETTINGS,
};

describe("v5.126 backup recovery", () => {
  beforeEach(() => localStorage.clear());

  it("classifies broken JSON with a concrete recovery action", () => {
    const message = classifyBackupImportError(new Error("Unexpected token in JSON"));
    expect(message.tone).toBe("error");
    expect(message.action).toMatch(/snapshot|yeniden/i);
  });

  it("classifies newer backup versions as compatibility warnings", () => {
    expect(classifyBackupImportError(new Error("Yedek sürümü daha yeni."))).toMatchObject({
      tone: "warning",
      title: "Yedek sürümü uyumsuz",
    });
  });

  it("stores a full pre-restore snapshot", () => {
    expect(savePreRestoreSnapshot(emptyData)).toBe(true);
    expect(loadPreRestoreSnapshot()).toMatchObject({ format: "e4-dnd-full-backup", data: emptyData });
  });

  it("clears the pre-restore snapshot", () => {
    savePreRestoreSnapshot(emptyData);
    clearPreRestoreSnapshot();
    expect(loadPreRestoreSnapshot()).toBeNull();
  });
});
