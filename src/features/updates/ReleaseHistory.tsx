import { useMemo, useState } from "react";
import { PageShell } from "../../shared/layout/PageShell";
import {
  RELEASE_CATEGORIES,
  RELEASE_NOTES,
  type ReleaseCategory,
} from "../../shared/release/releaseNotes";

export function ReleaseHistory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ReleaseCategory | "Tümü">("Tümü");

  const filteredReleases = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return RELEASE_NOTES.map((release) => ({
      ...release,
      changes: release.changes.filter((change) => {
        const matchesCategory = category === "Tümü" || change.category === category;
        const haystack = `${release.version} ${release.title} ${release.summary} ${change.text}`
          .toLocaleLowerCase("tr-TR");
        return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
      }),
    })).filter((release) => {
      if (release.changes.length > 0) return true;
      if (!normalizedQuery) return false;
      return `${release.version} ${release.title} ${release.summary}`
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery);
    });
  }, [category, query]);

  const totalChanges = RELEASE_NOTES.reduce(
    (total, release) => total + release.changes.length,
    0,
  );

  return (
    <PageShell
      eyebrow="Güncellemeler"
      title="Sürüm Geçmişi"
      description="E4 D&D'nin hangi sürümde ne kazandığını, neyin düzeltildiğini ve hangi teknik işlerin sessizce hayat kurtardığını burada görebilirsin."
    >
      <section className="release-history-summary" aria-label="Sürüm özeti">
        <div><strong>v{__APP_VERSION__}</strong><span>Mevcut sürüm</span></div>
        <div><strong>{RELEASE_NOTES.length}</strong><span>Toplam sürüm</span></div>
        <div><strong>{totalChanges}</strong><span>Kayıtlı değişiklik</span></div>
        <div><strong>{new Date(__BUILD_DATE__).toLocaleDateString("tr-TR")}</strong><span>Son build</span></div>
      </section>

      <section className="release-history-filters" aria-label="Sürüm filtreleri">
        <label>
          Sürüm notlarında ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Örn. campaign, PWA, düzeltme..."
          />
        </label>

        <div className="release-category-filter" role="group" aria-label="Değişiklik türü">
          {["Tümü", ...RELEASE_CATEGORIES].map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item as ReleaseCategory | "Tümü")}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="release-history-list">
        {filteredReleases.length ? filteredReleases.map((release) => (
          <article className="release-history-card" key={release.version}>
            <header>
              <div>
                <span className="mini-label">v{release.version}</span>
                <h2>{release.title}</h2>
                <p>{release.summary}</p>
              </div>
              <time dateTime={release.date}>{release.date}</time>
            </header>

            <ul>
              {release.changes.map((change) => (
                <li key={`${release.version}-${change.text}`}>
                  <span className={`release-category-badge release-category-${change.category.toLocaleLowerCase("tr-TR")}`}>
                    {change.category}
                  </span>
                  <span>{change.text}</span>
                </li>
              ))}
            </ul>
          </article>
        )) : (
          <div className="empty-panel">Bu filtrelerle eşleşen sürüm kaydı yok.</div>
        )}
      </div>
    </PageShell>
  );
}
