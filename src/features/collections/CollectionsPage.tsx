import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Character } from "../../core/character/character.types";
import type { DndItemData, DndMonsterData, DndSpellData, RulesetData } from "../../core/rulesets/ruleset.types";
import { useFavorites } from "../../shared/favorites/FavoritesProvider";
import { PageShell } from "../../shared/layout/PageShell";
import { useTagCollections } from "../../shared/collections/TagCollectionsProvider";
import type { Campaign } from "../campaigns/campaignTypes";
import { buildGlobalSearchEntries } from "../search/globalSearchEngine";

type CollectionsPageProps = {
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
  homebrewSpells: DndSpellData[];
  homebrewItems: DndItemData[];
  homebrewMonsters: DndMonsterData[];
};

export function CollectionsPage({
  characters,
  campaigns,
  rulesetData,
  homebrewSpells,
  homebrewItems,
  homebrewMonsters,
}: CollectionsPageProps) {
  const { itemTags, allTags, removeTag, renameCollection, deleteCollection } = useTagCollections();
  const { favorites, recordRecent } = useFavorites();
  const [selectedTag, setSelectedTag] = useState(allTags[0] ?? "");

  const entries = useMemo(() => buildGlobalSearchEntries({
    characters,
    campaigns,
    rulesetData,
    homebrewSpellIds: new Set(homebrewSpells.map((entry) => entry.id)),
    homebrewItemIds: new Set(homebrewItems.map((entry) => entry.id)),
    homebrewMonsterIds: new Set(homebrewMonsters.map((entry) => entry.id)),
  }), [campaigns, characters, homebrewItems, homebrewMonsters, homebrewSpells, rulesetData]);

  const entryMap = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const taggedEntries = selectedTag
    ? Object.entries(itemTags)
        .filter(([, tags]) => tags.includes(selectedTag))
        .map(([itemId]) => entryMap.get(itemId))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const favoriteIds = new Set(favorites.map((item) => item.id));

  function handleRename() {
    if (!selectedTag) return;
    const nextName = prompt("Koleksiyonun yeni adı:", selectedTag)?.trim();
    if (!nextName || nextName === selectedTag) return;
    renameCollection(selectedTag, nextName);
    setSelectedTag(nextName);
  }

  function handleDelete() {
    if (!selectedTag) return;
    if (!confirm(`“${selectedTag}” koleksiyonu silinsin mi? İçerikler silinmez, yalnızca etiket kaldırılır.`)) return;
    deleteCollection(selectedTag);
    setSelectedTag(allTags.find((tag) => tag !== selectedTag) ?? "");
  }

  return (
    <PageShell
      eyebrow="Düzen"
      title="Etiketler ve Koleksiyonlar"
      description="Arama sonuçlarını kendi etiketlerinle grupla. Sistem koleksiyonları otomatik oluşturur; klasör hiyerarşisiyle bürokrasi üretmiyoruz."
    >
      <section className="collection-overview-grid">
        <article><strong>{allTags.length}</strong><span>Koleksiyon</span></article>
        <article><strong>{Object.keys(itemTags).length}</strong><span>Etiketli kayıt</span></article>
        <article><strong>{favorites.length}</strong><span>Favori kayıt</span></article>
      </section>

      {allTags.length ? (
        <section className="collection-layout">
          <aside className="collection-sidebar" aria-label="Koleksiyonlar">
            {allTags.map((tag) => {
              const count = Object.values(itemTags).filter((tags) => tags.includes(tag)).length;
              return (
                <button
                  type="button"
                  key={tag}
                  className={selectedTag === tag ? "active" : ""}
                  onClick={() => setSelectedTag(tag)}
                >
                  <span>#{tag}</span><strong>{count}</strong>
                </button>
              );
            })}
          </aside>

          <div className="collection-content">
            <header className="collection-header">
              <div><span>Koleksiyon</span><h2>#{selectedTag}</h2></div>
              <div>
                <button type="button" onClick={handleRename}>Yeniden adlandır</button>
                <button type="button" className="danger" onClick={handleDelete}>Sil</button>
              </div>
            </header>

            {taggedEntries.length ? (
              <div className="collection-item-list">
                {taggedEntries.map((entry) => {
                  const quickItem = {
                    id: entry.id,
                    title: entry.title,
                    subtitle: entry.subtitle,
                    to: entry.to,
                    icon: entry.icon,
                    category: entry.category,
                  };
                  return (
                    <article key={entry.id}>
                      <Link to={entry.to} onClick={() => recordRecent(quickItem)}>
                        <span aria-hidden="true">{entry.icon}</span>
                        <span><strong>{entry.title}</strong><small>{entry.category} · {entry.subtitle}</small></span>
                        {favoriteIds.has(entry.id) ? <em>★</em> : null}
                      </Link>
                      <button type="button" onClick={() => removeTag(entry.id, selectedTag)}>Etiketi kaldır</button>
                    </article>
                  );
                })}
              </div>
            ) : <p className="collection-empty">Bu koleksiyonda görünür kayıt kalmadı.</p>}
          </div>
        </section>
      ) : (
        <section className="collection-empty-state">
          <strong>Henüz koleksiyon yok.</strong>
          <p>Global Arama sonuçlarında “Etiketle” düğmesini kullan. İlk etiketle birlikte koleksiyon otomatik doğar.</p>
          <Link to="/search">Global Arama’ya git →</Link>
        </section>
      )}
    </PageShell>
  );
}
