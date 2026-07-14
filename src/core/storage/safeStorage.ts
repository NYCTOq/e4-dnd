export type RecoveryRecord = {
  id: string;
  storageKey: string;
  rawValue: string;
  reason: string;
  createdAt: string;
};

const RECOVERY_STORAGE_KEY = "e4_dnd_recovery_records_v1";
export const STORAGE_RECOVERY_EVENT = "e4-dnd-storage-recovery";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readRecoveryRecordsUnsafe(): RecoveryRecord[] {
  try {
    const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notifyRecoveryChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORAGE_RECOVERY_EVENT));
  }
}

export function quarantineStorageValue(
  storageKey: string,
  rawValue: string,
  reason: string,
) {
  try {
    const records = readRecoveryRecordsUnsafe();
    const next: RecoveryRecord[] = [
      {
        id: createId(),
        storageKey,
        rawValue,
        reason,
        createdAt: new Date().toISOString(),
      },
      ...records,
    ].slice(0, 30);

    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(next));
    localStorage.removeItem(storageKey);
    notifyRecoveryChanged();
  } catch {
    // Storage may be unavailable or full. The app still falls back safely.
  }
}

export function readJsonSafely<T>(
  storageKey: string,
  fallback: T,
  validator?: (value: unknown) => value is T,
): T {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return fallback;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      quarantineStorageValue(storageKey, raw, "JSON verisi ayrÄ±ÅŸtÄ±rÄ±lamadÄ±.");
      return fallback;
    }

    if (validator && !validator(parsed)) {
      quarantineStorageValue(storageKey, raw, "Veri beklenen formatta deÄŸildi.");
      return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeJsonSafely<T>(storageKey: string, value: T): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadRecoveryRecords(): RecoveryRecord[] {
  return readRecoveryRecordsUnsafe();
}

export function removeRecoveryRecord(id: string) {
  const next = readRecoveryRecordsUnsafe().filter((record) => record.id !== id);
  writeJsonSafely(RECOVERY_STORAGE_KEY, next);
  notifyRecoveryChanged();
}

export function clearRecoveryRecords() {
  try {
    localStorage.removeItem(RECOVERY_STORAGE_KEY);
    notifyRecoveryChanged();
  } catch {
    // Ignore unavailable storage.
  }
}

export function downloadRecoveryRecord(record: RecoveryRecord) {
  const blob = new Blob([record.rawValue], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeKey = record.storageKey.replace(/[^a-z0-9-_]/gi, "-");
  link.href = url;
  link.download = `e4-dnd-recovery-${safeKey}-${record.createdAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadEmergencyStorageSnapshot() {
  const snapshot: Record<string, string> = {};

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      snapshot[key] = localStorage.getItem(key) ?? "";
    }
  } catch {
    // Export whatever could be read.
  }

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `e4-dnd-emergency-storage-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

