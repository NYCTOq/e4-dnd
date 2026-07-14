import { useMemo } from "react";
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
}: {
  characters: Character[];
  onDeleteCharacter: (id: string) => boolean;
}) {
  const navigate = useNavigate();

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
    const normalizedSearch = searchTerm.trim().toLowerCase();

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
  }, [characters, searchTerm, rulesetFilter, classFilter, sortOrder]);

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

  return (
    <PageShell
      eyebrow="Character Vault"
      title="Karakterler"
      description="Kayıtlı karakterlerin burada listelenir. Filtreler artık hatırlanıyor; uygulama nihayet insan hafızasına bel bağlamayı bıraktı."
    >
      <div className="character-filter-panel filter-panel-extended">
        <label>
          Ara
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="İsim, class, race, background..."
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
            <option value="all">Tümü</option>
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
            <option value="all">Tümü</option>
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sırala
          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value as CharacterSort)
            }
          >
            <option value="recent">Kayıt sırası</option>
            <option value="name">İsim A-Z</option>
            <option value="level-desc">Seviye yüksekten</option>
            <option value="level-asc">Seviye düşükten</option>
          </select>
        </label>

        <div className="filter-result-count">
          <strong>{filteredCharacters.length}</strong>
          <span>sonuç</span>
        </div>

        <button
          type="button"
          className="filter-reset-button"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          Filtreleri sıfırla
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="empty-panel">
          <h2>Henüz karakter yok.</h2>
          <p>Builder ekranından karakter oluştur. Boş kasa kimseyi etkilemiyor.</p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="empty-panel">
          <h2>Sonuç bulunamadı.</h2>
          <p>Filtreleri sıfırla; karakterler muhtemelen hâlâ burada.</p>
        </div>
      ) : (
        <div className="character-grid">
          {filteredCharacters.map((character) => (
            <motion.article
              className="character-card"
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
                {character.race || "Unknown Race"} •{" "}
                {character.className || "Unknown Class"}
                {character.subclass ? ` • ${character.subclass}` : ""}
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
                  Düzenle
                </button>
                <button onClick={() => onDeleteCharacter(character.id)}>
                  Sil
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
