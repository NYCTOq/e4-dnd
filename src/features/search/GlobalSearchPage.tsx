import { useDeferredValue, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Character } from "../../core/character/character.types";
import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
  RulesetData,
} from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
import { useFavorites } from "../../shared/favorites/FavoritesProvider";
import { useTagCollections } from "../../shared/collections/TagCollectionsProvider";
import type { Campaign } from "../campaigns/campaignTypes";
import {
  buildGlobalSearchEntries,
  searchGlobalEntries,
  type GlobalSearchCategory,
} from "./globalSearchEngine";

const CATEGORIES: readonly (GlobalSearchCategory | "all")[] = [
  "all",
  "Sayfa",
  "Karakter",
  "Campaign",
  "Büyü",
  "Eşya",
  "Canavar",
  "Yardım",
];

const CATEGORY_LABELS: Record<GlobalSearchCategory | "all", string> = {
  all: "Tümü",
  Sayfa: "Sayfalar",
  Karakter: "Karakterler",
  Campaign: "Campaigns",
  Büyü: "Büyüler",
  Eşya: "Eşyalar",
  Canavar: "Canavarlar",
  Yardım: "Yardım",
};

type GlobalSearchProps = {
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
  homebrewSpells: DndSpellData[];
  homebrewItems: DndItemData[];
  homebrewMonsters: DndMonsterData[];
  isRulesetLoading: boolean;
  rulesetError: string | null;
};

export function GlobalSearch({
  characters,
  campaigns,
  rulesetData,
  homebrewSpells,
  homebrewItems,
  homebrewMonsters,
  isRulesetLoading,
  rulesetError,
}: GlobalSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFavorite, toggleFavorite, recordRecent } = useFavorites();
  const { allTags, getTagsForItem, addTag, removeTag } = useTagCollections();
  const query = searchParams.get("q") ?? "";
  const rawCategory = searchParams.get("category") ?? "all";
  const category = CATEGORIES.includes(rawCategory as GlobalSearchCategory | "all")
    ? (rawCategory as GlobalSearchCategory | "all")
    : "all";
  const deferredQuery = useDeferredValue(query);

  const entries = useMemo(
    () =>
      buildGlobalSearchEntries({
        characters,
        campaigns,
        rulesetData,
        homebrewSpellIds: new Set(homebrewSpells.map((spell) => spell.id)),
        homebrewItemIds: new Set(homebrewItems.map((item) => item.id)),
        homebrewMonsterIds: new Set(homebrewMonsters.map((monster) => monster.id)),
      }),
    [campaigns, characters, homebrewItems, homebrewMonsters, homebrewSpells, rulesetData],
  );

  const results = useMemo(
    () => searchGlobalEntries(entries, deferredQuery, category).slice(0, 100),
    [category, deferredQuery, entries],
  );

  const categoryCounts = useMemo(() => {
    return entries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.category] = (counts[entry.category] ?? 0) + 1;
      return counts;
    }, {});
  }, [entries]);

  function updateSearch(nextQuery: string, nextCategory = category) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextCategory !== "all") params.set("category", nextCategory);
    setSearchParams(params, { replace: true });
  }

  return (
    <PageShell
      eyebrow="Arama"
      title="Global Arama"
      description="Karakter, campaign, büyü, eşya, canavar, sayfa ve yardım içeriklerini tek yerden bul. Uygulama büyüdü; hafızaya güvenmek artık gereksiz bir kahramanlık."
    >
      <section className="global-search-panel" aria-label="Global arama kontrolleri">
        <label className="global-search-input-wrap">
          <span>Arama</span>
          <div>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Örn. Fireball, Tengiz, Goblin, yedek..."
            />
            {query ? (
              <button type="button" onClick={() => updateSearch("")}>
                Temizle
              </button>
            ) : null}
          </div>
        </label>

        <div className="global-search-categories" role="group" aria-label="Sonuç türü">
          {CATEGORIES.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => updateSearch(query, item)}
            >
              <span>{CATEGORY_LABELS[item]}</span>
              {item === "all" ? entries.length : categoryCounts[item] ?? 0}
            </button>
          ))}
        </div>
      </section>

      {isRulesetLoading ? (
        <div className="global-search-notice" role="status">
          Ruleset verileri yükleniyor. Karakter ve campaign sonuçları şimdiden kullanılabilir.
        </div>
      ) : null}

      {rulesetError ? (
        <div className="global-search-notice error" role="alert">
          Ruleset içerikleri aramaya eklenemedi: {rulesetError}
        </div>
      ) : null}

      <div className="global-search-summary" aria-live="polite">
        <strong>{results.length}</strong>
        <span>{query ? `“${query}” için sonuç` : "gösterilen kayıt"}</span>
        {results.length === 100 ? <small>İlk 100 sonuç gösteriliyor.</small> : null}
      </div>

      {results.length ? (
        <section className="global-search-results" aria-label="Arama sonuçları">
          {results.map((result) => {
            const favoriteItem = {
              id: result.id,
              title: result.title,
              subtitle: result.subtitle,
              to: result.to,
              icon: result.icon,
              category: result.category,
            };

            return (
              <article className="global-search-result-row" key={result.id}>
                <Link
                  className="global-search-result"
                  to={result.to}
                  onClick={() => recordRecent(favoriteItem)}
                >
                  <span className="global-search-result-icon" aria-hidden="true">
                    {result.icon}
                  </span>
                  <span className="global-search-result-copy">
                    <span className="global-search-result-heading">
                      <strong>{result.title}</strong>
                      <span>{CATEGORY_LABELS[result.category]}</span>
                      {result.isHomebrew ? <em>Homebrew</em> : null}
                      {isFavorite(result.id) ? <em className="favorite-badge">Favori</em> : null}
                    </span>
                    <small>{result.subtitle}</small>
                    <p>{result.description}</p>
                    {getTagsForItem(result.id).length ? (
                      <span className="result-tag-row">
                        {getTagsForItem(result.id).map((tag) => (
                          <button
                            type="button"
                            className="result-tag-chip"
                            key={tag}
                            title="Etiketi kaldır"
                            onClick={(event) => { event.preventDefault(); event.stopPropagation(); removeTag(result.id, tag); }}
                          >
                            #{tag} ×
                          </button>
                        ))}
                      </span>
                    ) : null}
                  </span>
                  <span className="global-search-open" aria-hidden="true">→</span>
                </Link>
                <div className="global-search-row-actions">
                  <button
                    type="button"
                    className={isFavorite(result.id) ? "favorite-toggle active" : "favorite-toggle"}
                    aria-label={isFavorite(result.id) ? `${result.title} favorilerden çıkar` : `${result.title} favorilere ekle`}
                    aria-pressed={isFavorite(result.id)}
                    onClick={() => toggleFavorite(favoriteItem)}
                  >
                    {isFavorite(result.id) ? "★" : "☆"}
                  </button>
                  <button
                    type="button"
                    className="tag-toggle"
                    onClick={() => {
                      const suggestion = allTags[0] ?? "";
                      const tag = prompt("Etiket adı:", suggestion)?.trim();
                      if (tag) addTag(result.id, tag);
                    }}
                  >
                    Etiketle
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="global-search-empty">
          <strong>Sonuç bulunamadı.</strong>
          <p>Aramayı kısalt veya farklı kategori seç. D&D isimleri zaten yeterince gösterişli, yazım da bazen ayrı encounter.</p>
        </div>
      )}
    </PageShell>
  );
}
