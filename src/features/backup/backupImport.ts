export function mergeRecordsById<T extends { id: string }>(
  current: T[],
  incoming: T[],
): T[] {
  const merged = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

export function mergeUniqueStrings(current: string[], incoming: string[]): string[] {
  return Array.from(new Set([...current, ...incoming]));
}

