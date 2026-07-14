export type LootStatus = "Bekliyor" | "Paylaştırıldı" | "Satıldı" | "Kaybedildi";
export type LootKind = "Para" | "Eşya" | "Büyülü Eşya" | "Mücevher" | "Belge" | "Diğer";
export type LootRecord = {
  id: string;
  campaignId: string;
  questId: string;
  name: string;
  kind: LootKind;
  status: LootStatus;
  quantity: number;
  valueGp: number;
  ownerCharacterId: string;
  foundAt: string;
  notes: string;
  secretNotes: string;
  createdAt: string;
  updatedAt: string;
};
const STORAGE_KEY = "e4_dnd_loot_tracker_v1";
const KINDS: readonly LootKind[] = ["Para", "Eşya", "Büyülü Eşya", "Mücevher", "Belge", "Diğer"];
const STATUSES: readonly LootStatus[] = ["Bekliyor", "Paylaştırıldı", "Satıldı", "Kaybedildi"];
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function finiteNumber(value: unknown, fallback = 0) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
export function sanitizeLootRecord(value: unknown): LootRecord | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const now = new Date().toISOString();
  return {
    id: value.id,
    campaignId: typeof value.campaignId === "string" ? value.campaignId : "",
    questId: typeof value.questId === "string" ? value.questId : "",
    name: value.name.trim() || "Adsız ganimet",
    kind: KINDS.includes(value.kind as LootKind) ? value.kind as LootKind : "Diğer",
    status: STATUSES.includes(value.status as LootStatus) ? value.status as LootStatus : "Bekliyor",
    quantity: Math.max(1, Math.floor(finiteNumber(value.quantity, 1))),
    valueGp: Math.max(0, finiteNumber(value.valueGp)),
    ownerCharacterId: typeof value.ownerCharacterId === "string" ? value.ownerCharacterId : "",
    foundAt: typeof value.foundAt === "string" ? value.foundAt : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    secretNotes: typeof value.secretNotes === "string" ? value.secretNotes : "",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}
export function createLootRecord(name = "Yeni ganimet", campaignId = ""): LootRecord {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), campaignId, questId: "", name: name.trim() || "Yeni ganimet", kind: "Eşya", status: "Bekliyor", quantity: 1, valueGp: 0, ownerCharacterId: "", foundAt: "", notes: "", secretNotes: "", createdAt: now, updatedAt: now };
}
export function calculateLootTotal(records: readonly Pick<LootRecord, "quantity" | "valueGp">[]) { return records.reduce((total, record) => total + record.quantity * record.valueGp, 0); }
export function loadLootRecords(): LootRecord[] { try { const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); return Array.isArray(parsed) ? parsed.map(sanitizeLootRecord).filter((record): record is LootRecord => Boolean(record)) : []; } catch { return []; } }
export function saveLootRecords(records: LootRecord[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* local fallback */ } }
