import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { getCurrentRelease, RELEASE_NOTES } from "./releaseNotes";
import { useDialogFocus } from "../accessibility/dialogFocus";
import {
  FIRST_RUN_COMPLETED_EVENT,
  LAST_SEEN_VERSION_KEY,
  shouldOpenReleaseNotes,
} from "../layout/shellOverlayRuntime";

export function ReleaseNotesDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const currentRelease = getCurrentRelease();

  useEffect(() => {
    const openWhenEligible = () => {
      try {
        if (shouldOpenReleaseNotes(localStorage, __APP_VERSION__)) {
          setIsOpen(true);
        }
      } catch {
        // localStorage kapalıysa sürüm notları yalnızca manuel açılır.
      }
    };

    openWhenEligible();
    window.addEventListener(FIRST_RUN_COMPLETED_EVENT, openWhenEligible);

    return () => {
      window.removeEventListener(FIRST_RUN_COMPLETED_EVENT, openWhenEligible);
    };
  }, []);

  const closeReleaseNotes = useCallback(() => {
    setIsOpen(false);

    try {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, __APP_VERSION__);
    } catch {
      // Sürüm notunu kapatmak storage iznine bağlı kalmamalı.
    }
  }, []);

  const dialogRef = useDialogFocus(isOpen, closeReleaseNotes);

  return (
    <>
      <button
        type="button"
        className="app-version-button"
        onClick={() => setIsOpen(true)}
        aria-label={`Sürüm notlarını aç. Mevcut sürüm ${__APP_VERSION__}`}
      >
        <span>v{__APP_VERSION__}</span>
        <small>Sürüm notları</small>
      </button>

      {isOpen ? createPortal(
        <div
          className="release-notes-backdrop"
          role="presentation"
          onMouseDown={closeReleaseNotes}
        >
          <section
            ref={dialogRef}
            tabIndex={-1}
            data-dialog-id="release-notes"
            data-testid="release-notes-dialog"
            className="release-notes-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="release-notes-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="release-notes-head">
              <div>
                <span className="mini-label">E4 D&D v{__APP_VERSION__}</span>
                <h2 id="release-notes-title">{currentRelease.title}</h2>
                <p>{currentRelease.summary}</p>
              </div>

              <button
                type="button"
                onClick={closeReleaseNotes}
                aria-label="Sürüm notlarını kapat"
                data-testid="release-notes-close"
              >
                ×
              </button>
            </header>

            <div className="release-notes-list">
              {RELEASE_NOTES.map((release) => (
                <article key={release.version} className="release-note-card">
                  <div className="release-note-meta">
                    <strong>v{release.version}</strong>
                    <span>{release.date}</span>
                  </div>

                  <h3>{release.title}</h3>
                  <ul>
                    {release.changes.map((change) => (
                      <li key={change.text}>
                        <strong>{change.category}</strong> {change.text}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <footer className="release-notes-footer">
              <span>
                Build: {new Date(__BUILD_DATE__).toLocaleString("tr-TR")}
              </span>
              <div className="release-notes-footer-actions">
                <Link to="/updates" className="secondary-action" onClick={closeReleaseNotes}>
                  Tüm geçmiş
                </Link>
                <button
                  type="button"
                  className="primary-action"
                  onClick={closeReleaseNotes}
                >
                  Devam et
                </button>
              </div>
            </footer>
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
