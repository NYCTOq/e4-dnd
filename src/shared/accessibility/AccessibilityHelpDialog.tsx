import { useCallback, useEffect, useState } from "react";
import { useDialogFocus } from "./dialogFocus";

export const ACCESSIBILITY_SHORTCUTS = [
  { keys: "Alt + 0", label: "Ana içeriğe geç" },
  { keys: "Ctrl + K", label: "Komut paletini aç" },
  { keys: "Shift + ?", label: "Klavye yardımını aç" },
  { keys: "Escape", label: "Açık pencereyi kapat" },
] as const;

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}

export function AccessibilityHelpDialog() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const dialogRef = useDialogFocus<HTMLElement>(open, close);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "0") {
        event.preventDefault();
        document.getElementById("main-content")?.focus({ preventScroll: true });
        return;
      }
      if (!isTypingTarget(event.target) && event.shiftKey && event.key === "?") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className="accessibility-help-trigger"
        data-testid="accessibility-help-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⌨</span>
        <span>Klavye yardımı</span>
      </button>
      {open && (
        <div className="accessibility-help-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <section
            ref={dialogRef}
            className="accessibility-help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-help-title"
            tabIndex={-1}
            data-testid="accessibility-help-dialog"
          >
            <header>
              <div>
                <span className="mini-label">Erişilebilirlik</span>
                <h2 id="accessibility-help-title">Klavye kısayolları</h2>
              </div>
              <button type="button" onClick={close} aria-label="Klavye yardımını kapat">×</button>
            </header>
            <p>Uygulamada fare kullanmadan hızlı ve güvenli biçimde dolaş.</p>
            <dl>
              {ACCESSIBILITY_SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys}>
                  <dt><kbd>{shortcut.keys}</kbd></dt>
                  <dd>{shortcut.label}</dd>
                </div>
              ))}
            </dl>
            <div className="accessibility-help-actions">
              <a href="#main-content" onClick={close}>Ana içeriğe geç</a>
              <button type="button" onClick={close}>Kapat</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
