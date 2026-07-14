import { useDeferredValue, useMemo } from "react";
import { motion } from "framer-motion";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
import { usePersistentState } from "../../shared/state/usePersistentState";

type SpellSourceFilter = "all" | "official" | "homebrew";
type SpellSort = "level-name" | "name" | "level-desc";

export function Spellbook({
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const [searchTerm, setSearchTerm] = usePersistentState(
    "e4_filter_spells_search_v1",
    "",
  );
  const [levelFilter, setLevelFilter] = usePersistentState(
    "e4_filter_spells_level_v1",
    "all",
  );
  const [classFilter, setClassFilter] = usePersistentState(
    "e4_filter_spells_class_v1",
    "all",
  );
  const [sourceFilter, setSourceFilter] =
    usePersistentState<SpellSourceFilter>("e4_filter_spells_source_v1", "all");
  const [concentrationOnly, setConcentrationOnly] = usePersistentState(
    "e4_filter_spells_concentration_v1",
    false,
  );
  const [ritualOnly, setRitualOnly] = usePersistentState(
    "e4_filter_spells_ritual_v1",
    false,
  );
  const [sortOrder, setSortOrder] = usePersistentState<SpellSort>(
    "e4_filter_spells_sort_v1",
    "level-name",
  );

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const availableSpellClasses = useMemo(() => {
    if (!rulesetData) return [];
    return Array.from(
      new Set(rulesetData.spells.flatMap((spell) => spell.classes)),
    ).sort((a, b) => a.localeCompare(b));
  }, [rulesetData]);

  const filteredSpells = useMemo(() => {
    if (!rulesetData) return [];
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    const result = rulesetData.spells.filter((spell) => {
      const isHomebrew = spell.id.startsWith("homebrew-spell-");
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          spell.name,
          spell.school,
          spell.castingTime,
          spell.range,
          spell.duration,
          spell.description,
          spell.higherLevels ?? "",
          spell.classes.join(" "),
          spell.damageType ?? "",
          spell.conditionEffect ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesLevel =
        levelFilter === "all" || spell.level === Number(levelFilter);
      const matchesClass =
        classFilter === "all" || spell.classes.includes(classFilter);
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "homebrew" ? isHomebrew : !isHomebrew);

      return (
        matchesSearch &&
        matchesLevel &&
        matchesClass &&
        matchesSource &&
        (!concentrationOnly || spell.concentration) &&
        (!ritualOnly || spell.ritual)
      );
    });

    return [...result].sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      if (sortOrder === "level-desc") {
        return b.level - a.level || a.name.localeCompare(b.name);
      }
      return a.level - b.level || a.name.localeCompare(b.name);
    });
  }, [
    rulesetData,
    deferredSearchTerm,
    levelFilter,
    classFilter,
    sourceFilter,
    concentrationOnly,
    ritualOnly,
    sortOrder,
  ]);

  const hasActiveFilters =
    searchTerm.length > 0 ||
    levelFilter !== "all" ||
    classFilter !== "all" ||
    sourceFilter !== "all" ||
    concentrationOnly ||
    ritualOnly ||
    sortOrder !== "level-name";

  function resetFilters() {
    setSearchTerm("");
    setLevelFilter("all");
    setClassFilter("all");
    setSourceFilter("all");
    setConcentrationOnly(false);
    setRitualOnly(false);
    setSortOrder("level-name");
  }

  return (
    <PageShell
      eyebrow="Spellbook"
      title="BÃ¼yÃ¼ler"
      description="BÃ¼yÃ¼leri ara, filtrele ve son kullandÄ±ÄŸÄ±n seÃ§imlerle geri dÃ¶n. Ã‡Ã¼nkÃ¼ aynÄ± filtreyi her oturumda yeniden kurmak kahramanlÄ±k deÄŸildir."
    >
      {isRulesetLoading ? (
        <div className="empty-panel"><h2>Spell data yÃ¼kleniyor...</h2><p>BÃ¼yÃ¼ kitabÄ± aÃ§Ä±lÄ±yor.</p></div>
      ) : rulesetError ? (
        <div className="empty-panel"><h2>Spell data yÃ¼klenemedi</h2><p>{rulesetError}</p></div>
      ) : rulesetData ? (
        <>
          <div className="character-filter-panel filter-panel-extended">
            <label>
              Ara
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Bless, Fireball, cleric, concentration..."
              />
            </label>
            <label>
              Level
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                <option value="all">TÃ¼mÃ¼</option>
                <option value="0">Cantrip</option>
                {[1,2,3,4,5,6,7,8,9].map((level) => <option key={level} value={level}>Level {level}</option>)}
              </select>
            </label>
            <label>
              Class
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                <option value="all">TÃ¼mÃ¼</option>
                {availableSpellClasses.map((className) => <option key={className} value={className}>{className}</option>)}
              </select>
            </label>
            <label>
              Kaynak
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SpellSourceFilter)}>
                <option value="all">TÃ¼mÃ¼</option>
                <option value="official">Data pack</option>
                <option value="homebrew">Homebrew</option>
              </select>
            </label>
            <label>
              SÄ±rala
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SpellSort)}>
                <option value="level-name">Level + isim</option>
                <option value="name">Ä°sim A-Z</option>
                <option value="level-desc">YÃ¼ksek level Ã¶nce</option>
              </select>
            </label>
            <div className="filter-toggle-group">
              <button type="button" className={concentrationOnly ? "active" : ""} onClick={() => setConcentrationOnly((value) => !value)}>Concentration</button>
              <button type="button" className={ritualOnly ? "active" : ""} onClick={() => setRitualOnly((value) => !value)}>Ritual</button>
            </div>
            <div className="filter-result-count"><strong>{filteredSpells.length}</strong><span>spell</span></div>
            <button type="button" className="filter-reset-button" onClick={resetFilters} disabled={!hasActiveFilters}>Filtreleri sÄ±fÄ±rla</button>
          </div>

          {filteredSpells.length === 0 ? (
            <div className="empty-panel"><h2>BÃ¼yÃ¼ bulunamadÄ±.</h2><p>Filtreleri sÄ±fÄ±rla; bÃ¼yÃ¼ler muhtemelen baÅŸka boyuta kaÃ§madÄ±.</p></div>
          ) : (
            <div className="spell-grid">
              {filteredSpells.map((spell) => {
                const isHomebrew = spell.id.startsWith("homebrew-spell-");
                return (
                  <motion.article className="spell-card" key={spell.id} whileHover={{ y: -5 }}>
                    <div className="library-item-top">
                      <div>
                        <span className="mini-label">{spell.school}{isHomebrew ? " â€¢ Homebrew" : ""}</span>
                        <h3>{spell.name}</h3>
                      </div>
                      <span>{spell.level === 0 ? "Cantrip" : `Lv. ${spell.level}`}</span>
                    </div>
                    <div className="spell-meta-grid">
                      <span>Cast: {spell.castingTime}</span><span>Range: {spell.range}</span>
                      <span>Duration: {spell.duration}</span><span>Comp: {spell.components.join(", ")}</span>
                    </div>
                    <p>{spell.description}</p>
                    {spell.higherLevels ? <p className="spell-higher-levels"><strong>Higher Levels:</strong> {spell.higherLevels}</p> : null}
                    <div className="library-pill-row">
                      {spell.classes.map((className) => <span key={className}>{className}</span>)}
                      {spell.concentration ? <span>Concentration</span> : null}
                      {spell.ritual ? <span>Ritual</span> : null}
                      {isHomebrew ? <span>Homebrew</span> : null}
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

