import { createFullBackup, type E4FullBackup, type FullBackupData } from "./fullBackup";

const PRE_RESTORE_SNAPSHOT_KEY = "e4_dnd_pre_restore_snapshot_v1";

export type BackupRecoveryMessage = {
  tone: "success" | "warning" | "error";
  title: string;
  detail: string;
  action: string;
};

export function classifyBackupImportError(error: unknown): BackupRecoveryMessage {
  const detail = error instanceof Error ? error.message : "Yedek dosyası okunamadı.";
  const lower = detail.toLocaleLowerCase("tr-TR");

  if (lower.includes("json") || lower.includes("kök yapısı")) {
    return {
      tone: "error",
      title: "Dosya geçerli JSON değil",
      detail,
      action: "Dosyayı yeniden indir veya acil storage snapshot'ını kullan.",
    };
  }

  if (lower.includes("daha yeni") || lower.includes("sürüm")) {
    return {
      tone: "warning",
      title: "Yedek sürümü uyumsuz",
      detail,
      action: "Uygulamayı güncelledikten sonra dosyayı yeniden dene.",
    };
  }

  return {
    tone: "error",
    title: "Yedek güvenlik kontrolünden geçemedi",
    detail,
    action: "Mevcut veriler korunmuştur. Başka bir yedek seç veya kurtarma kaydını indir.",
  };
}

export function savePreRestoreSnapshot(data: FullBackupData): boolean {
  try {
    localStorage.setItem(PRE_RESTORE_SNAPSHOT_KEY, JSON.stringify(createFullBackup(data)));
    return true;
  } catch {
    return false;
  }
}

export function loadPreRestoreSnapshot(): E4FullBackup | null {
  try {
    const raw = localStorage.getItem(PRE_RESTORE_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as E4FullBackup;
    return parsed?.format === "e4-dnd-full-backup" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPreRestoreSnapshot() {
  try {
    localStorage.removeItem(PRE_RESTORE_SNAPSHOT_KEY);
  } catch {
    // Storage unavailable. There is nothing useful to clear.
  }
}

export function downloadPreRestoreSnapshot(snapshot: E4FullBackup) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `e4-dnd-pre-restore-${snapshot.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
