import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { DndItemData, RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
import {
  getItemCategoryLabel,
  getItemRulesSummary,
} from "../characters/characterShared";

export function Inventory({
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | DndItemData["category"]
  >("all");

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (rulesetData?.items ?? []).filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          item.name,
          item.category,
          item.description,
          item.damage,
          item.damageType,
          item.armorType,
          item.properties?.join(" "),
          item.tags?.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [rulesetData, searchTerm, categoryFilter]);

  return (
    <PageShell
      eyebrow="Inventory Library"
      title="Inventory"
      description="D&D 2014 silah, zırh, shield ve gear datası. Evet, çanta düzenlemeyi de yazılıma çevirdik. Medeniyet böyle ilerliyor sanırım."
    >
      {isRulesetLoading ? (
        <div className="empty-panel">
          <h2>Item data yükleniyor...</h2>
          <p>Market rafları diziliyor. Fantastik kapitalizm beklemede.</p>
        </div>
      ) : rulesetError ? (
        <div className="empty-panel">
          <h2>Item data yüklenemedi</h2>
          <p>{rulesetError}</p>
        </div>
      ) : rulesetData ? (
        <>
          <div className="character-filter-panel">
            <label>
              Ara
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Longsword, armor, potion..."
              />
            </label>

            <label>
              Category
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as "all" | DndItemData["category"],
                  )
                }
              >
                <option value="all">Tümü</option>
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="shield">Shield</option>
                <option value="gear">Gear</option>
              </select>
            </label>

            <div className="filter-result-count">
              <strong>{filteredItems.length}</strong>
              <span>sonuç</span>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-panel">
              <h2>Item bulunamadı.</h2>
              <p>
                Arama yine evrenin anlamını kaçırdı. Daha yumuşak filtre dene.
              </p>
            </div>
          ) : (
            <div className="inventory-library-grid">
              {filteredItems.map((item) => (
                <motion.article
                  className="inventory-library-card"
                  key={item.id}
                  whileHover={{ y: -5 }}
                >
                  <div className="library-item-top">
                    <div>
                      <span className="mini-label">
                        {getItemCategoryLabel(item.category)}
                      </span>
                      <h2>{item.name}</h2>
                    </div>
                    <span>{item.cost}</span>
                  </div>

                  <p>{item.description}</p>

                  <div className="spell-meta-grid">
                    <span>{getItemRulesSummary(item)}</span>
                    <span>Weight {item.weight} lb</span>
                    {item.damage ? <span>Damage {item.damage}</span> : null}
                    {item.damageType ? <span>{item.damageType}</span> : null}
                    {item.properties?.length ? (
                      <span>{item.properties.join(", ")}</span>
                    ) : null}
                    {item.tags?.length ? (
                      <span>{item.tags.join(", ")}</span>
                    ) : null}
                    {item.stealthDisadvantage ? (
                      <span>Stealth Disadvantage</span>
                    ) : null}
                  </div>
                  </motion.article>
              ))}
            </div>
          )}
        </>
      ) : null}
    </PageShell>
  );
}
