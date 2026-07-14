export type NpcDisposition = "Dost" | "Tarafsız" | "Şüpheli" | "Düşman";

export type NpcRelationship = {
  id: string;
  targetNpcId: string;
  label: string;
};

export type NpcRecord = {
  id: string;
  campaignId: string;
  name: string;
  role: string;
  location: string;
  disposition: NpcDisposition;
  status: string;
  publicNotes: string;
  secretNotes: string;
  tags: string[];
  relationships: NpcRelationship[];
  createdAt: string;
  updatedAt: string;
};

const NPC_STORAGE_KEY = "e4_dnd_npc_records_v1";
const DISPOSITIONS: readonly NpcDisposition[] = ["Dost", "Tarafsız", "Şüpheli", "Düşman"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeNpcRecord(value: unknown): NpcRecord | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const now = new Date().toISOString();
  const disposition = DISPOSITIONS.includes(value.disposition as NpcDisposition)
    ? (value.disposition as NpcDisposition)
    : "Tarafsız";
  const relationships = Array.isArray(value.relationships)
    ? value.relationships.filter(isRecord).map((relationship) => ({
        id: typeof relationship.id === "string" ? relationship.id : crypto.randomUUID(),
        targetNpcId: typeof relationship.targetNpcId === "string" ? relationship.targetNpcId : "",
        label: typeof relationship.label === "string" ? relationship.label : "Bağlantı",
      })).filter((relationship) => relationship.targetNpcId.length > 0)
    : [];

  return {
    id: value.id,
    campaignId: typeof value.campaignId === "string" ? value.campaignId : "",
    name: value.name.trim() || "Adsız NPC",
    role: typeof value.role === "string" ? value.role : "",
    location: typeof value.location === "string" ? value.location : "",
    disposition,
    status: typeof value.status === "string" ? value.status : "Aktif",
    publicNotes: typeof value.publicNotes === "string" ? value.publicNotes : "",
    secretNotes: typeof value.secretNotes === "string" ? value.secretNotes : "",
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean) : [],
    relationships,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

export function createNpcRecord(name = "Yeni NPC", campaignId = ""): NpcRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), campaignId, name: name.trim() || "Yeni NPC", role: "", location: "",
    disposition: "Tarafsız", status: "Aktif", publicNotes: "", secretNotes: "", tags: [], relationships: [],
    createdAt: now, updatedAt: now,
  };
}

export function loadNpcRecords(): NpcRecord[] {
  try {
    const raw = localStorage.getItem(NPC_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeNpcRecord).filter((npc): npc is NpcRecord => Boolean(npc));
  } catch { return []; }
}

export function saveNpcRecords(records: NpcRecord[]) {
  try { localStorage.setItem(NPC_STORAGE_KEY, JSON.stringify(records)); } catch { /* local fallback */ }
}

export function getNpcRelationshipCount(records: NpcRecord[], npcId: string) {
  return records.reduce((count, npc) => count + npc.relationships.filter((relationship) => relationship.targetNpcId === npcId || npc.id === npcId).length, 0);
}
