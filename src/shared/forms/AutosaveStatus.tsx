type AutosaveStatusProps = {
  lastSavedAt: string;
  restoredAt?: string;
  onClear?: () => void;
  label?: string;
};

function formatTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AutosaveStatus({
  lastSavedAt,
  restoredAt,
  onClear,
  label = "Taslak",
}: AutosaveStatusProps) {
  const restoredTime = restoredAt ? formatTime(restoredAt) : "";
  const savedTime = formatTime(lastSavedAt);

  return (
    <div className="autosave-status" role="status" aria-live="polite">
      <div>
        <strong>{label}</strong>
        <span>
          {restoredTime
            ? `KurtarÄ±ldÄ± Â· ${restoredTime}`
            : savedTime
              ? `Otomatik kaydedildi Â· ${savedTime}`
              : "DeÄŸiÅŸiklikler cihazda otomatik saklanÄ±r"}
        </span>
      </div>
      {onClear ? (
        <button type="button" onClick={onClear}>
          TaslaÄŸÄ± temizle
        </button>
      ) : null}
    </div>
  );
}

