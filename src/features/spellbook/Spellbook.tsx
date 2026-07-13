import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";

export function Spellbook({
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const availableSpellClasses = useMemo(() => {
    if (!rulesetData) {
      return [];
    }

    return Array.from(
      new Set(rulesetData.spells.flatMap((spell) => spell.classes)),
    ).sort((a, b) => a.localeCompare(b));
  }, [rulesetData]);

  const filteredSpells = useMemo(() => {
    if (!rulesetData) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rulesetData.spells.filter((spell) => {
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
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesLevel =
        levelFilter === "all" || spell.level === Number(levelFilter);

      const matchesClass =
        classFilter === "all" || spell.classes.includes(classFilter);

      return matchesSearch && matchesLevel && matchesClass;
    });
  }, [rulesetData, searchTerm, levelFilter, classFilter]);

  return (
    <PageShell
      eyebrow="Spellbook"
      title="Büyüler"
      description="D&D 2014 spell data pack içindeki büyüleri ara, filtrele ve masa ortasında panik yapmadan bul. Büyük ilerleme, insanlık için küçük bir Fireball."
    >
      {isRulesetLoading ? (
        <div className="empty-panel">
          <h2>Spell data yükleniyor...</h2>
          <p>Büyü kitabını açıyoruz. Toz çıkarsa şaşırma.</p>
        </div>
      ) : rulesetError ? (
        <div className="empty-panel">
          <h2>Spell data yüklenemedi</h2>
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
                placeholder="Bless, Fireball, cleric, concentration..."
              />
            </label>

            <label>
              Level
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
              >
                <option value="all">Tümü</option>
                <option value="0">Cantrip</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Class
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="all">Tümü</option>

                {availableSpellClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </label>

            <div className="filter-result-count">
              <strong>{filteredSpells.length}</strong>
              <span>spell</span>
            </div>
          </div>

          {filteredSpells.length === 0 ? (
            <div className="empty-panel">
              <h2>Büyü bulunamadı.</h2>
              <p>
                Filtreler fazla agresif. Büyüler bile bu kadar baskıya
                dayanamaz.
              </p>
            </div>
          ) : (
            <div className="spell-grid">
              {filteredSpells.map((spell) => (
                <motion.article
                  className="spell-card"
                  key={spell.id}
                  whileHover={{ y: -5 }}
                >
                  <div className="library-item-top">
                    <div>
                      <span className="mini-label">{spell.school}</span>
                      <h3>{spell.name}</h3>
                    </div>

                    <span>
                      {spell.level === 0 ? "Cantrip" : `Lv. ${spell.level}`}
                    </span>
                  </div>

                  <div className="spell-meta-grid">
                    <span>Cast: {spell.castingTime}</span>
                    <span>Range: {spell.range}</span>
                    <span>Duration: {spell.duration}</span>
                    <span>Comp: {spell.components.join(", ")}</span>
                  </div>

                  <p>{spell.description}</p>

                  {spell.higherLevels ? (
                    <p className="spell-higher-levels">
                      <strong>Higher Levels:</strong> {spell.higherLevels}
                    </p>
                  ) : null}

                  <div className="library-pill-row">
                    {spell.classes.map((className) => (
                      <span key={className}>{className}</span>
                    ))}
                    {spell.concentration ? <span>Concentration</span> : null}
                    {spell.ritual ? <span>Ritual</span> : null}
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
