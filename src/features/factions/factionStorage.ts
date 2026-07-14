export type FactionKind = "Krallık" | "Lonca" | "Tarikat" | "Korsan Tayfası" | "Şirket" | "Gizli Örgüt" | "Diğer";
export type FactionStanding = "Müttefik" | "Tarafsız" | "Gergin" | "Düşman";

export type FactionRelation = {
  id: string;
  targetFactionId: string;
  standing: FactionStanding;
  notes: string;
};

export type FactionRecord = {
  id: string;
  campaignId: string;
  name: string;
  kind: FactionKind;
  status: string;
  motto: string;
  publicGoal: string;
  secretGoal: string;
  headquartersLocationId: string;
  memberNpcIds: string[];
  tags: string[];
  relations: FactionRelation[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "e4_dnd_factions_v1";
const KINDS: readonly FactionKind[] = ["Krallık", "Lonca", "Tarikat", "Korsan Tayfası", "Şirket", "Gizli Örgüt", "Diğer"];
const STANDINGS: readonly FactionStanding[] = ["Müttefik", "Tarafsız", "Gergin", "Düşman"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : [];
}

export function sanitizeFactionRecord(value: unknown): FactionRecord | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const now = new Date().toISOString();
  const relations = Array.isArray(value.relations)
    ? value.relations.filter(isRecord).map((relation) => ({
        id: typeof relation.id === "string" ? relation.id : crypto.randomUUID(),
        targetFactionId: typeof relation.targetFactionId === "string" ? relation.targetFactionId : "",
        standing: STANDINGS.includes(relation.standing as FactionStanding)
          ? (relation.standing as FactionStanding)
          : "Tarafsız",
        notes: typeof relation.notes === "string" ? relation.notes : "",
      })).filter((relation) => relation.targetFactionId.length > 0)
    : [];

  return {
    id: value.id,
    campaignId: typeof value.campaignId === "string" ? value.campaignId : "",
    name: value.name.trim() || "Adsız oluşum",
    kind: KINDS.includes(value.kind as FactionKind) ? (value.kind as FactionKind) : "Diğer",
    status: typeof value.status === "string" ? value.status : "Aktif",
    motto: typeof value.motto === "string" ? value.motto : "",
    publicGoal: typeof value.publicGoal === "string" ? value.publicGoal : "",
    secretGoal: typeof value.secretGoal === "string" ? value.secretGoal : "",
    headquartersLocationId: typeof value.headquartersLocationId === "string" ? value.headquartersLocationId : "",
    memberNpcIds: sanitizeStringArray(value.memberNpcIds),
    tags: sanitizeStringArray(value.tags),
    relations,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

export function createFactionRecord(name = "Yeni oluşum", campaignId = ""): FactionRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), campaignId, name: name.trim() || "Yeni oluşum", kind: "Diğer", status: "Aktif",
    motto: "", publicGoal: "", secretGoal: "", headquartersLocationId: "", memberNpcIds: [], tags: [], relations: [],
    createdAt: now, updatedAt: now,
  };
}

export function loadFactionRecords(): FactionRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeFactionRecord).filter((record): record is FactionRecord => Boolean(record));
  } catch { return []; }
}

export function saveFactionRecords(records: FactionRecord[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* local fallback */ }
}

export function removeFactionAndRelations(records: FactionRecord[], factionId: string) {
  return records
    .filter((record) => record.id !== factionId)
    .map((record) => ({ ...record, relations: record.relations.filter((relation) => relation.targetFactionId !== factionId) }));
}
