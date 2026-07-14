export type LocationKind = "Bölge" | "Şehir" | "Kasaba" | "Bina" | "Zindan" | "Doğa" | "Diğer";

export type WorldLocation = {
  id: string;
  campaignId: string;
  parentId: string;
  name: string;
  kind: LocationKind;
  status: string;
  description: string;
  secretNotes: string;
  tags: string[];
  linkedNpcIds: string[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "e4_dnd_world_locations_v1";
const KINDS: readonly LocationKind[] = ["Bölge", "Şehir", "Kasaba", "Bina", "Zindan", "Doğa", "Diğer"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : [];
}

export function sanitizeWorldLocation(value: unknown): WorldLocation | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const now = new Date().toISOString();
  return {
    id: value.id,
    campaignId: typeof value.campaignId === "string" ? value.campaignId : "",
    parentId: typeof value.parentId === "string" ? value.parentId : "",
    name: value.name.trim() || "Adsız mekân",
    kind: KINDS.includes(value.kind as LocationKind) ? (value.kind as LocationKind) : "Diğer",
    status: typeof value.status === "string" ? value.status : "Aktif",
    description: typeof value.description === "string" ? value.description : "",
    secretNotes: typeof value.secretNotes === "string" ? value.secretNotes : "",
    tags: sanitizeStringArray(value.tags),
    linkedNpcIds: sanitizeStringArray(value.linkedNpcIds),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

export function createWorldLocation(name = "Yeni mekân", campaignId = ""): WorldLocation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), campaignId, parentId: "", name: name.trim() || "Yeni mekân", kind: "Diğer",
    status: "Aktif", description: "", secretNotes: "", tags: [], linkedNpcIds: [], createdAt: now, updatedAt: now,
  };
}

export function loadWorldLocations(): WorldLocation[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeWorldLocation).filter((item): item is WorldLocation => Boolean(item));
  } catch { return []; }
}

export function saveWorldLocations(locations: WorldLocation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(locations)); } catch { /* local fallback */ }
}

export function getLocationDepth(locations: WorldLocation[], locationId: string) {
  const byId = new Map(locations.map((location) => [location.id, location]));
  const visited = new Set<string>();
  let current = byId.get(locationId);
  let depth = 0;
  while (current?.parentId && !visited.has(current.parentId)) {
    visited.add(current.parentId);
    current = byId.get(current.parentId);
    if (current) depth += 1;
  }
  return depth;
}

export function removeLocationAndDetach(locations: WorldLocation[], locationId: string) {
  return locations
    .filter((location) => location.id !== locationId)
    .map((location) => location.parentId === locationId ? { ...location, parentId: "" } : location);
}
