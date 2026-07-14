export type QuestStatus = "Taslak" | "Aktif" | "Beklemede" | "Tamamlandı" | "Başarısız";
export type QuestPriority = "Düşük" | "Normal" | "Yüksek" | "Kritik";
export type QuestObjective = { id: string; text: string; completed: boolean };
export type QuestRecord = {
  id: string; campaignId: string; title: string; status: QuestStatus; priority: QuestPriority;
  giverNpcId: string; locationId: string; factionId: string; summary: string; secretNotes: string;
  reward: string; tags: string[]; objectives: QuestObjective[]; createdAt: string; updatedAt: string;
};
const STORAGE_KEY = "e4_dnd_quest_journal_v1";
const STATUSES: readonly QuestStatus[] = ["Taslak", "Aktif", "Beklemede", "Tamamlandı", "Başarısız"];
const PRIORITIES: readonly QuestPriority[] = ["Düşük", "Normal", "Yüksek", "Kritik"];
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function sanitizeTags(value: unknown) { return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))] : []; }
export function sanitizeQuestRecord(value: unknown): QuestRecord | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") return null;
  const now = new Date().toISOString();
  const objectives = Array.isArray(value.objectives) ? value.objectives.filter(isRecord).map((objective) => ({
    id: typeof objective.id === "string" ? objective.id : crypto.randomUUID(),
    text: typeof objective.text === "string" ? objective.text : "",
    completed: objective.completed === true,
  })).filter((objective) => objective.text.trim().length > 0) : [];
  return {
    id: value.id, campaignId: typeof value.campaignId === "string" ? value.campaignId : "",
    title: value.title.trim() || "Adsız görev",
    status: STATUSES.includes(value.status as QuestStatus) ? value.status as QuestStatus : "Taslak",
    priority: PRIORITIES.includes(value.priority as QuestPriority) ? value.priority as QuestPriority : "Normal",
    giverNpcId: typeof value.giverNpcId === "string" ? value.giverNpcId : "",
    locationId: typeof value.locationId === "string" ? value.locationId : "",
    factionId: typeof value.factionId === "string" ? value.factionId : "",
    summary: typeof value.summary === "string" ? value.summary : "",
    secretNotes: typeof value.secretNotes === "string" ? value.secretNotes : "",
    reward: typeof value.reward === "string" ? value.reward : "", tags: sanitizeTags(value.tags), objectives,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}
export function createQuestRecord(title = "Yeni görev", campaignId = ""): QuestRecord {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), campaignId, title: title.trim() || "Yeni görev", status: "Taslak", priority: "Normal", giverNpcId: "", locationId: "", factionId: "", summary: "", secretNotes: "", reward: "", tags: [], objectives: [], createdAt: now, updatedAt: now };
}
export function calculateQuestProgress(quest: Pick<QuestRecord, "objectives">) { if (!quest.objectives.length) return 0; return Math.round((quest.objectives.filter((objective) => objective.completed).length / quest.objectives.length) * 100); }
export function loadQuestRecords(): QuestRecord[] { try { const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); if (!Array.isArray(parsed)) return []; return parsed.map(sanitizeQuestRecord).filter((record): record is QuestRecord => Boolean(record)); } catch { return []; } }
export function saveQuestRecords(records: QuestRecord[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* local fallback */ } }
