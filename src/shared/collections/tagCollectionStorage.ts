export type ItemTagMap = Record<string, string[]>;

const TAGS_KEY = "e4_dnd_item_tags_v1";

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ").slice(0, 32);
}

export function loadItemTags(): ItemTagMap {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as ItemTagMap
      : {};
  } catch {
    return {};
  }
}

export function saveItemTags(value: ItemTagMap) {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(value));
  } catch {
    // Storage kapalıysa uygulamanın geri kalanı çalışmaya devam eder.
  }
}

export function addTagToItem(map: ItemTagMap, itemId: string, rawTag: string) {
  const tag = normalizeTag(rawTag);
  if (!tag) return map;
  const existing = map[itemId] ?? [];
  if (existing.some((entry) => entry.toLocaleLowerCase("tr-TR") === tag.toLocaleLowerCase("tr-TR"))) {
    return map;
  }
  return { ...map, [itemId]: [...existing, tag].sort((a, b) => a.localeCompare(b, "tr")) };
}

export function removeTagFromItem(map: ItemTagMap, itemId: string, tag: string) {
  const nextTags = (map[itemId] ?? []).filter((entry) => entry !== tag);
  if (nextTags.length) return { ...map, [itemId]: nextTags };
  const next = { ...map };
  delete next[itemId];
  return next;
}

export function renameTag(map: ItemTagMap, oldTag: string, rawNewTag: string) {
  const newTag = normalizeTag(rawNewTag);
  if (!newTag || newTag === oldTag) return map;
  return Object.fromEntries(
    Object.entries(map).map(([itemId, tags]) => [
      itemId,
      [...new Set(tags.map((tag) => tag === oldTag ? newTag : tag))].sort((a, b) => a.localeCompare(b, "tr")),
    ]),
  );
}

export function deleteTag(map: ItemTagMap, tagToDelete: string) {
  return Object.fromEntries(
    Object.entries(map)
      .map(([itemId, tags]) => [itemId, tags.filter((tag) => tag !== tagToDelete)] as const)
      .filter(([, tags]) => tags.length > 0),
  );
}

export function getAllTags(map: ItemTagMap) {
  return [...new Set(Object.values(map).flat())].sort((a, b) => a.localeCompare(b, "tr"));
}
