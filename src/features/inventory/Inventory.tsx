import { useDeferredValue, useMemo } from "react";
import { motion } from "framer-motion";
import type { DndItemData, RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
import { usePersistentState } from "../../shared/state/usePersistentState";
import { getItemCategoryLabel, getItemRulesSummary } from "../characters/characterShared";

type ItemSourceFilter = "all" | "official" | "homebrew";
type ItemSort = "name" | "weight" | "category";

export function Inventory({ rulesetData, isRulesetLoading, rulesetError }: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const [searchTerm, setSearchTerm] = usePersistentState("e4_filter_items_search_v1", "");
  const [categoryFilter, setCategoryFilter] = usePersistentState<"all" | DndItemData["category"]>("e4_filter_items_category_v1", "all");
  const [sourceFilter, setSourceFilter] = usePersistentState<ItemSourceFilter>("e4_filter_items_source_v1", "all");
  const [sortOrder, setSortOrder] = usePersistentState<ItemSort>("e4_filter_items_sort_v1", "name");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredItems = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    const result = (rulesetData?.items ?? []).filter((item) => {
      const isHomebrew = item.id.startsWith("homebrew-item-") || item.tags?.includes("homebrew");
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSource = sourceFilter === "all" || (sourceFilter === "homebrew" ? isHomebrew : !isHomebrew);
      const matchesSearch = normalizedSearch.length === 0 || [
        item.name, item.category, item.description, item.damage, item.damageType,
        item.armorType, item.properties?.join(" "), item.tags?.join(" "), item.cost,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSource && matchesSearch;
    });

    return [...result].sort((a, b) => {
      if (sortOrder === "weight") return a.weight - b.weight || a.name.localeCompare(b.name);
      if (sortOrder === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [rulesetData, deferredSearchTerm, categoryFilter, sourceFilter, sortOrder]);

  const hasActiveFilters = searchTerm.length > 0 || categoryFilter !== "all" || sourceFilter !== "all" || sortOrder !== "name";
  function resetFilters() {
    setSearchTerm(""); setCategoryFilter("all"); setSourceFilter("all"); setSortOrder("name");
  }

  return (
    <PageShell eyebrow="Inventory Library" title="Inventory" description="EÅŸyalarÄ± kaynaÄŸÄ±na, kategorisine ve aÄŸÄ±rlÄ±ÄŸÄ±na gÃ¶re sÃ¼z. Ã‡antayÄ± yazÄ±lÄ±ma Ã§evirdik, bari dÃ¼zgÃ¼n aransÄ±n.">
      {isRulesetLoading ? (
        <div className="empty-panel"><h2>Item data yÃ¼kleniyor...</h2><p>Raflar diziliyor.</p></div>
      ) : rulesetError ? (
        <div className="empty-panel"><h2>Item data yÃ¼klenemedi</h2><p>{rulesetError}</p></div>
      ) : rulesetData ? (
        <>
          <div className="character-filter-panel filter-panel-extended">
            <label>Ara<input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Longsword, armor, potion..." /></label>
            <label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | DndItemData["category"])}>
              <option value="all">TÃ¼mÃ¼</option><option value="weapon">Weapon</option><option value="armor">Armor</option><option value="shield">Shield</option><option value="gear">Gear</option>
            </select></label>
            <label>Kaynak<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as ItemSourceFilter)}>
              <option value="all">TÃ¼mÃ¼</option><option value="official">Data pack</option><option value="homebrew">Homebrew</option>
            </select></label>
            <label>SÄ±rala<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as ItemSort)}>
              <option value="name">Ä°sim A-Z</option><option value="category">Kategori</option><option value="weight">AÄŸÄ±rlÄ±k</option>
            </select></label>
            <div className="filter-result-count"><strong>{filteredItems.length}</strong><span>sonuÃ§</span></div>
            <button type="button" className="filter-reset-button" onClick={resetFilters} disabled={!hasActiveFilters}>Filtreleri sÄ±fÄ±rla</button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-panel"><h2>Item bulunamadÄ±.</h2><p>Filtreleri sÄ±fÄ±rlamak Ã§antayÄ± yakmaktan daha gÃ¼venli.</p></div>
          ) : (
            <div className="inventory-library-grid">
              {filteredItems.map((item) => {
                const isHomebrew = item.id.startsWith("homebrew-item-") || item.tags?.includes("homebrew");
                return (
                  <motion.article className="inventory-library-card" key={item.id} whileHover={{ y: -5 }}>
                    <div className="library-item-top">
                      <div><span className="mini-label">{getItemCategoryLabel(item.category)}{isHomebrew ? " â€¢ Homebrew" : ""}</span><h2>{item.name}</h2></div>
                      <span>{item.cost}</span>
                    </div>
                    <p>{item.description}</p>
                    <div className="spell-meta-grid">
                      <span>{getItemRulesSummary(item)}</span><span>Weight {item.weight} lb</span>
                      {item.damage ? <span>Damage {item.damage}</span> : null}
                      {item.damageType ? <span>{item.damageType}</span> : null}
                      {item.properties?.length ? <span>{item.properties.join(", ")}</span> : null}
                      {item.tags?.length ? <span>{item.tags.join(", ")}</span> : null}
                      {item.stealthDisadvantage ? <span>Stealth Disadvantage</span> : null}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </PageShell>
  );
}

