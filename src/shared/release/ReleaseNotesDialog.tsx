import { useEffect, useState } from "react";
import { getCurrentRelease, RELEASE_NOTES } from "./releaseNotes";

const LAST_SEEN_VERSION_KEY = "e4_dnd_last_seen_version_v1";

export function ReleaseNotesDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const currentRelease = getCurrentRelease();

  useEffect(() => {
    try {
      const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);

      if (lastSeenVersion !== __APP_VERSION__) {
        setIsOpen(true);
      }
    } catch {
      // localStorage kapalıysa sürüm notları yalnızca manuel açılır.
    }
  }, []);

  function closeReleaseNotes() {
    setIsOpen(false);

    try {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, __APP_VERSION__);
    } catch {
      // Sürüm notunu kapatmak storage iznine bağlı kalmamalı.
    }
  }

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

      {isOpen ? (
        <div
          className="release-notes-backdrop"
          role="presentation"
          onMouseDown={closeReleaseNotes}
        >
          <section
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
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <footer className="release-notes-footer">
              <span>
                Build: {new Date(__BUILD_DATE__).toLocaleString("tr-TR")}
              </span>
              <button
                type="button"
                className="primary-action"
                onClick={closeReleaseNotes}
              >
                Devam et
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
