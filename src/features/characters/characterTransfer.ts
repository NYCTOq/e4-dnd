import type { Character } from "../../core/character/character.types";
import { hydrateCharacterRecord } from "../../core/storage/characterStorage";

export const CHARACTER_TRANSFER_VERSION = 1;
export type CharacterTransferFile = { format: "e4-dnd-character"; version: number; exportedAt: string; character: Character };

export function createCharacterTransfer(character: Character): CharacterTransferFile {
  return { format: "e4-dnd-character", version: CHARACTER_TRANSFER_VERSION, exportedAt: new Date().toISOString(), character: hydrateCharacterRecord(character) };
}

function looksLikeCharacter(value: unknown): value is Character {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<Character>;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.className === "string" && typeof item.level === "number" && item.level >= 1 && item.level <= 20 && Boolean(item.abilities && typeof item.abilities === "object");
}

export function parseCharacterTransfer(value: unknown): Character {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Dosyanın kök yapısı geçersiz.");
  const envelope = value as Partial<CharacterTransferFile>;
  if (envelope.format !== "e4-dnd-character") throw new Error("Bu dosya E4 D&D tek karakter formatında değil.");
  if (typeof envelope.version !== "number" || envelope.version > CHARACTER_TRANSFER_VERSION) throw new Error("Karakter dosyası bu uygulamadan daha yeni bir sürümle oluşturulmuş.");
  if (!looksLikeCharacter(envelope.character)) throw new Error("Dosyada geçerli bir karakter kaydı yok.");
  return hydrateCharacterRecord(envelope.character);
}

export function resolveImportedCharacter(character: Character, existing: Character[], createId: () => string = () => crypto.randomUUID()): Character {
  if (!existing.some((item) => item.id === character.id)) return character;
  const now = new Date().toISOString();
  return { ...structuredClone(character), id: createId(), name: `${character.name} (İçe Aktarılan)`, createdAt: now, updatedAt: now };
}

export function downloadCharacterTransfer(character: Character) {
  const safeName = character.name.trim().replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ_-]+/gi, "-").replace(/^-|-$/g, "") || "character";
  const blob = new Blob([JSON.stringify(createCharacterTransfer(character), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `e4-dnd-${safeName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
