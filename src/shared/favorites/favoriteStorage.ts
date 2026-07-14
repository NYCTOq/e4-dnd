export type FavoriteItem = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  icon: string;
  category: string;
  updatedAt: string;
};

export type RecentItem = FavoriteItem & {
  openedAt: string;
};

const FAVORITES_KEY = "e4_dnd_favorites_v1";
const RECENTS_KEY = "e4_dnd_recent_items_v1";
const MAX_RECENTS = 12;

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage kapalıysa uygulama çalışmaya devam eder.
  }
}

export function loadFavorites() {
  return readList<FavoriteItem>(FAVORITES_KEY);
}

export function saveFavorites(items: FavoriteItem[]) {
  writeList(FAVORITES_KEY, items);
}

export function toggleFavoriteItem(items: FavoriteItem[], item: Omit<FavoriteItem, "updatedAt">) {
  const exists = items.some((entry) => entry.id === item.id);
  if (exists) return items.filter((entry) => entry.id !== item.id);

  return [
    { ...item, updatedAt: new Date().toISOString() },
    ...items,
  ];
}

export function loadRecentItems() {
  return readList<RecentItem>(RECENTS_KEY);
}

export function saveRecentItems(items: RecentItem[]) {
  writeList(RECENTS_KEY, items);
}

export function addRecentItem(items: RecentItem[], item: Omit<FavoriteItem, "updatedAt">) {
  const now = new Date().toISOString();
  const next: RecentItem = { ...item, updatedAt: now, openedAt: now };
  return [next, ...items.filter((entry) => entry.id !== item.id)].slice(0, MAX_RECENTS);
}
