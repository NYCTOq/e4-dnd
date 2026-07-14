import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Character } from "../../core/character/character.types";
import {
  formatModifier,
  getInitiative,
  getPassivePerception,
  getProficiencyBonus,
  getSpellSaveDc,
} from "../../core/character/characterCalculator";
import { PageShell } from "../../shared/layout/PageShell";
import { usePersistentState } from "../../shared/state/usePersistentState";

type CharacterSort = "recent" | "name" | "level-desc" | "level-asc";

export function Characters({
  characters,
  onDeleteCharacter,
  onDuplicateCharacter,
}: {
  characters: Character[];
  onDeleteCharacter: (id: string) => boolean;
  onDuplicateCharacter: (id: string) => Character | null;
}) {
  const navigate = useNavigate();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = usePersistentState(
    "e4_filter_characters_search_v1",
    "",
  );
  const [rulesetFilter, setRulesetFilter] = usePersistentState<
    "all" | Character["ruleset"]
  >("e4_filter_characters_ruleset_v1", "all");
  const [classFilter, setClassFilter] = usePersistentState(
    "e4_filter_characters_class_v1",
    "all",
  );
  const [sortOrder, setSortOrder] = usePersistentState<CharacterSort>(
    "e4_filter_characters_sort_v1",
    "recent",
  );

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const availableClasses = useMemo(() => {
    return Array.from(
      new Set(
        characters
          .map((character) => character.className)
          .filter((className) => className.trim().length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  const filteredCharacters = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    const result = characters.filter((character) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          character.name,
          character.playerName,
          character.race,
          character.className,
          character.subclass,
          character.background,
          character.ruleset,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesRuleset =
        rulesetFilter === "all" || character.ruleset === rulesetFilter;
      const matchesClass =
        classFilter === "all" || character.className === classFilter;

      return matchesSearch && matchesRuleset && matchesClass;
    });

    if (sortOrder === "name") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortOrder === "level-desc") {
      return [...result].sort((a, b) => b.level - a.level);
    }

    if (sortOrder === "level-asc") {
      return [...result].sort((a, b) => a.level - b.level);
    }

    return result;
  }, [characters, deferredSearchTerm, rulesetFilter, classFilter, sortOrder]);

  const hasActiveFilters =
    searchTerm.length > 0 ||
    rulesetFilter !== "all" ||
    classFilter !== "all" ||
    sortOrder !== "recent";

  function resetFilters() {
    setSearchTerm("");
    setRulesetFilter("all");
    setClassFilter("all");
    setSortOrder("recent");
  }

  function toggleCompareCharacter(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 2) {
        return [current[1], id];
      }

      return [...current, id];
    });
  }

  function duplicateCharacter(id: string) {
    const duplicate = onDuplicateCharacter(id);

    if (duplicate) {
      navigate(`/characters/${duplicate.id}/edit`);
    }
  }

  return (
    <PageShell
      eyebrow="Character Vault"
      title="Karakterler"
      description="KayÄ±tlÄ± karakterlerin burada listelenir. Filtreler artÄ±k hatÄ±rlanÄ±yor; uygulama nihayet insan hafÄ±zasÄ±na bel baÄŸlamayÄ± bÄ±raktÄ±."
    >
      <div className="character-filter-panel filter-panel-extended">
        <label>
          Ara
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Ä°sim, class, race, background..."
          />
        </label>

        <label>
          Ruleset
          <select
            value={rulesetFilter}
            onChange={(event) =>
              setRulesetFilter(
                event.target.value as "all" | Character["ruleset"],
              )
            }
          >
            <option value="all">TÃ¼mÃ¼</option>
            <option value="dnd_2014">D&D 2014</option>
            <option value="dnd_2024">D&D 2024</option>
            <option value="homebrew">Homebrew</option>
          </select>
        </label>

        <label>
          Class
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="all">TÃ¼mÃ¼</option>
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <label>
          SÄ±rala
          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value as CharacterSort)
            }
          >
            <option value="recent">KayÄ±t sÄ±rasÄ±</option>
            <option value="name">Ä°sim A-Z</option>
            <option value="level-desc">Seviye yÃ¼ksekten</option>
            <option value="level-asc">Seviye dÃ¼ÅŸÃ¼kten</option>
          </select>
        </label>

        <div className="filter-result-count">
          <strong>{filteredCharacters.length}</strong>
          <span>sonuÃ§</span>
        </div>

        <button
          type="button"
          className="filter-reset-button"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          Filtreleri sÄ±fÄ±rla
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="empty-panel">
          <h2>HenÃ¼z karakter yok.</h2>
          <p>Builder ekranÄ±ndan karakter oluÅŸtur. BoÅŸ kasa kimseyi etkilemiyor.</p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="empty-panel">
          <h2>SonuÃ§ bulunamadÄ±.</h2>
          <p>Filtreleri sÄ±fÄ±rla; karakterler muhtemelen hÃ¢lÃ¢ burada.</p>
        </div>
      ) : (
        <div className="character-grid">
          {filteredCharacters.map((character) => (
            <motion.article
              className={`character-card ${compareIds.includes(character.id) ? "compare-selected" : ""}`}
              key={character.id}
              whileHover={{ y: -6 }}
            >
              <div className="character-card-top">
                <div>
                  <span className="mini-label">{character.ruleset}</span>
                  <h2>{character.name}</h2>
                </div>
                <strong className="level-badge">Lv. {character.level}</strong>
              </div>

              <p>
                {character.race || "Unknown Race"} â€¢{" "}
                {character.className || "Unknown Class"}
                {character.subclass ? ` â€¢ ${character.subclass}` : ""}
              </p>

              <div className="stat-row">
                <span>AC {character.armorClass}</span>
                <span>
                  HP {character.currentHp}/{character.maxHp}
                </span>
                <span>PB +{getProficiencyBonus(character.level)}</span>
              </div>

              <div className="stat-row">
                <span>Init {formatModifier(getInitiative(character))}</span>
                <span>PP {getPassivePerception(character)}</span>
                <span>DC {getSpellSaveDc(character)}</span>
              </div>

              <div className="character-actions">
                <button onClick={() => navigate(`/characters/${character.id}`)}>
                  Detay
                </button>
                <button
                  onClick={() => navigate(`/characters/${character.id}/edit`)}
                >
                  DÃ¼zenle
                </button>
                <button type="button" onClick={() => toggleCompareCharacter(character.id)}>
                  {compareIds.includes(character.id) ? "SeÃ§imi kaldÄ±r" : "KarÅŸÄ±laÅŸtÄ±r"}
                </button>
                <button type="button" onClick={() => duplicateCharacter(character.id)}>
                  Kopyala
                </button>
                <button onClick={() => onDeleteCharacter(character.id)}>
                  Sil
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {characters.length >= 2 ? (
        <div className="character-compare-toolbar">
          <p>
            <strong>{compareIds.length}/2 karakter seÃ§ildi.</strong>{" "}
            {compareIds.length < 2
              ? "KarÅŸÄ±laÅŸtÄ±rmak iÃ§in iki kart seÃ§."
              : "Build farklarÄ±nÄ± yan yana aÃ§abilirsin."}
          </p>
          <div className="character-compare-toolbar-actions">
            <button type="button" onClick={() => setCompareIds([])} disabled={compareIds.length === 0}>
              Temizle
            </button>
            <button
              type="button"
              className="primary-action"
              disabled={compareIds.length !== 2}
              onClick={() => navigate(`/characters/compare?ids=${compareIds.join(",")}`)}
            >
              KarÅŸÄ±laÅŸtÄ±rmayÄ± aÃ§
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

