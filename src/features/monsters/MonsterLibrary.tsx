import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import type { DiceRollResult } from "../../core/dice/dice.types";
import { rollDice } from "../../core/dice/diceRoller";
import type { DndMonsterData, RulesetData } from "../../core/rulesets/ruleset.types";
import { PageShell } from "../../shared/layout/PageShell";
import { usePersistentState } from "../../shared/state/usePersistentState";
import { useDebouncedEffect } from "../../shared/state/useDebouncedEffect";
import type { MonsterCombatState } from "./monsterUtils";
import {
  formatMonsterModifier,
  getMonsterAbilityModifier,
  getMonsterMainAttackModifier,
  loadFavoriteMonsterIds,
  parseFirstDiceExpression,
  saveFavoriteMonsterIds,
} from "./monsterUtils";

export function MonsterLibrary({
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = usePersistentState(
    "e4_filter_monsters_search_v1",
    "",
  );
  const [typeFilter, setTypeFilter] = usePersistentState(
    "e4_filter_monsters_type_v1",
    "all",
  );
  const [crFilter, setCrFilter] = usePersistentState(
    "e4_filter_monsters_cr_v1",
    "all",
  );
  const [sourceFilter, setSourceFilter] = usePersistentState<
    "all" | "official" | "homebrew"
  >("e4_filter_monsters_source_v1", "all");
  const [sortOrder, setSortOrder] = usePersistentState<
    "name" | "cr-asc" | "cr-desc"
  >("e4_filter_monsters_sort_v1", "name");
  const [showFavoritesOnly, setShowFavoritesOnly] = usePersistentState(
    "e4_filter_monsters_favorites_v1",
    false,
  );

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [favoriteMonsterIds, setFavoriteMonsterIds] = useState<string[]>(() =>
    loadFavoriteMonsterIds(),
  );
  const [monsterCombatState, setMonsterCombatState] = useState<
    Record<string, MonsterCombatState>
  >({});

  const monsters = useMemo(() => rulesetData?.monsters ?? [], [rulesetData?.monsters]);

  useDebouncedEffect(favoriteMonsterIds, saveFavoriteMonsterIds, 250, {
    skipInitial: true,
  });

  function toggleFavoriteMonster(monsterId: string) {
    setFavoriteMonsterIds((current) =>
      current.includes(monsterId)
        ? current.filter((id) => id !== monsterId)
        : [...current, monsterId],
    );
  }

  const favoriteMonsterCount = monsters.filter((monster) =>
    favoriteMonsterIds.includes(monster.id),
  ).length;

  const monsterTypes = useMemo(() => {
    return Array.from(new Set(monsters.map((monster) => monster.type))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [monsters]);

  const challengeRatings = useMemo(() => {
    return Array.from(
      new Set(monsters.map((monster) => monster.challengeRating)),
    ).sort((a, b) => {
      const parseCr = (value: string) => {
        if (value.includes("/")) {
          const [top, bottom] = value.split("/").map(Number);
          return top / bottom;
        }

        return Number(value);
      };

      return parseCr(a) - parseCr(b);
    });
  }, [monsters]);

  const filteredMonsters = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    const result = monsters.filter((monster) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          monster.name,
          monster.type,
          monster.size,
          monster.alignment,
          monster.description,
          monster.challengeRating,
          monster.source ?? "",
          monster.traits.join(" "),
          monster.actions.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesType = typeFilter === "all" || monster.type === typeFilter;
      const matchesCr =
        crFilter === "all" || monster.challengeRating === crFilter;
      const isHomebrew = monster.id.startsWith("homebrew-monster-");
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "homebrew" ? isHomebrew : !isHomebrew);
      const matchesFavorite =
        !showFavoritesOnly || favoriteMonsterIds.includes(monster.id);

      return (
        matchesSearch &&
        matchesType &&
        matchesCr &&
        matchesSource &&
        matchesFavorite
      );
    });

    const parseCr = (value: string) => {
      if (value.includes("/")) {
        const [top, bottom] = value.split("/").map(Number);
        return top / bottom;
      }
      return Number(value) || 0;
    };

    return [...result].sort((a, b) => {
      if (sortOrder === "cr-asc") {
        return parseCr(a.challengeRating) - parseCr(b.challengeRating) ||
          a.name.localeCompare(b.name);
      }
      if (sortOrder === "cr-desc") {
        return parseCr(b.challengeRating) - parseCr(a.challengeRating) ||
          a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    monsters,
    deferredSearchTerm,
    typeFilter,
    crFilter,
    sourceFilter,
    sortOrder,
    showFavoritesOnly,
    favoriteMonsterIds,
  ]);

  const hasActiveFilters =
    searchTerm.length > 0 ||
    typeFilter !== "all" ||
    crFilter !== "all" ||
    sourceFilter !== "all" ||
    sortOrder !== "name" ||
    showFavoritesOnly;

  function resetFilters() {
    setSearchTerm("");
    setTypeFilter("all");
    setCrFilter("all");
    setSourceFilter("all");
    setSortOrder("name");
    setShowFavoritesOnly(false);
  }

  function getMonsterCombatState(monster: DndMonsterData) {
    return (
      monsterCombatState[monster.id] ?? {
        currentHp: monster.hitPoints,
        rollHistory: [],
      }
    );
  }

  function updateMonsterHp(monster: DndMonsterData, amount: number) {
    setMonsterCombatState((current) => {
      const state = current[monster.id] ?? {
        currentHp: monster.hitPoints,
        rollHistory: [],
      };

      return {
        ...current,
        [monster.id]: {
          ...state,
          currentHp: Math.max(
            0,
            Math.min(monster.hitPoints, state.currentHp + amount),
          ),
        },
      };
    });
  }

  function resetMonsterCombat(monster: DndMonsterData) {
    setMonsterCombatState((current) => ({
      ...current,
      [monster.id]: {
        currentHp: monster.hitPoints,
        rollHistory: [],
      },
    }));
  }

  function addMonsterRoll(monster: DndMonsterData, label: string, result: DiceRollResult) {
    setMonsterCombatState((current) => {
      const state = current[monster.id] ?? {
        currentHp: monster.hitPoints,
        rollHistory: [],
      };

      return {
        ...current,
        [monster.id]: {
          ...state,
          rollHistory: [
            {
              ...result,
              notation: `${label}: ${result.notation}`,
            },
            ...state.rollHistory,
          ].slice(0, 6),
        },
      };
    });
  }

  function rollMonsterCheck(
    monster: DndMonsterData,
    label: string,
    modifier: number,
  ) {
    addMonsterRoll(
      monster,
      label,
      rollDice({
        count: 1,
        sides: 20,
        modifier,
      }),
    );
  }

  function rollMonsterDamage(monster: DndMonsterData) {
    const parsedDamage = parseFirstDiceExpression(monster.actions.join(" "));

    if (!parsedDamage) {
      alert(
        "Bu monster action iÃ§inde otomatik okunabilir damage dice bulamadÄ±m. Evet, metin parse etmek hÃ¢lÃ¢ kÃ¼Ã§Ã¼k bir lanet.",
      );
      return;
    }

    addMonsterRoll(monster, "Damage", rollDice(parsedDamage));
  }

  return (
    <PageShell
      eyebrow="Monster Library"
      title="Monsters & NPCs"
      description="HazÄ±r yaratÄ±k ve NPC stat block arÅŸivi. Encounter modÃ¼lÃ¼ ÅŸimdilik bekliyor ama canavarlarÄ± rafa diziyoruz, Ã§Ã¼nkÃ¼ kaosun da kataloglanmasÄ± gerekir."
    >
      {isRulesetLoading ? (
        <div className="empty-panel">
          <h2>Monster data yÃ¼kleniyor...</h2>
          <p>
            CanavarlarÄ± kafeslerinden Ã§Ä±karÄ±yoruz. Muhtemelen iyi bir fikir
            deÄŸildir.
          </p>
        </div>
      ) : rulesetError ? (
        <div className="empty-panel">
          <h2>Monster data yÃ¼klenemedi</h2>
          <p>{rulesetError}</p>
        </div>
      ) : (
        <>
          <div className="monster-library-summary">
            <div>
              <span className="mini-label">Total</span>
              <strong>{monsters.length}</strong>
              <p>monster / NPC</p>
            </div>

            <div>
              <span className="mini-label">Types</span>
              <strong>{monsterTypes.length}</strong>
              <p>kategori</p>
            </div>

            <div>
              <span className="mini-label">Filtered</span>
              <strong>{filteredMonsters.length}</strong>
              <p>sonuÃ§</p>
            </div>

            <div>
              <span className="mini-label">Favorites</span>
              <strong>{favoriteMonsterCount}</strong>
              <p>favori</p>
            </div>
          </div>

          <div className="character-filter-panel monster-filter-panel filter-panel-extended">
            <label>
              Ara
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Goblin, undead, desert, guard..."
              />
            </label>

            <label>
              Type
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">TÃ¼mÃ¼</option>
                {monsterTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              CR
              <select
                value={crFilter}
                onChange={(event) => setCrFilter(event.target.value)}
              >
                <option value="all">TÃ¼mÃ¼</option>
                {challengeRatings.map((challengeRating) => (
                  <option key={challengeRating} value={challengeRating}>
                    CR {challengeRating}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Kaynak
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(
                    event.target.value as "all" | "official" | "homebrew",
                  )
                }
              >
                <option value="all">TÃ¼mÃ¼</option>
                <option value="official">Data pack</option>
                <option value="homebrew">Homebrew</option>
              </select>
            </label>

            <label>
              SÄ±rala
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value as "name" | "cr-asc" | "cr-desc",
                  )
                }
              >
                <option value="name">Ä°sim A-Z</option>
                <option value="cr-asc">CR dÃ¼ÅŸÃ¼kten</option>
                <option value="cr-desc">CR yÃ¼ksekten</option>
              </select>
            </label>

            <label className="checkbox-filter-row">
              Favoriler
              <button
                type="button"
                className={showFavoritesOnly ? "active" : ""}
                onClick={() => setShowFavoritesOnly((current) => !current)}
              >
                {showFavoritesOnly ? "Sadece favoriler" : "TÃ¼mÃ¼"}
              </button>
            </label>

            <div className="filter-result-count">
              <strong>{filteredMonsters.length}</strong>
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

          {filteredMonsters.length === 0 ? (
            <div className="empty-panel">
              <h2>Monster bulunamadÄ±.</h2>
              <p>
                Filtreler fazla acÄ±masÄ±z olmuÅŸ olabilir. Canavarlar bile bu
                kadar sorgulanmayÄ± hak etmiyor.
              </p>
            </div>
          ) : (
            <div className="monster-card-grid">
              {filteredMonsters.map((monster) => {
                const combatState = getMonsterCombatState(monster);
                const latestMonsterRoll = combatState.rollHistory[0];
                const attackModifier = getMonsterMainAttackModifier(monster);
                const isFavorite = favoriteMonsterIds.includes(monster.id);

                return (
                  <motion.article
                    className={isFavorite ? "monster-card favorite-monster-card" : "monster-card"}
                    key={monster.id}
                    whileHover={{ y: -5 }}
                  >
                    <div className="monster-card-head">
                      <div>
                        <span className="mini-label">
                          {monster.size} {monster.type}
                          {monster.id.startsWith("homebrew-monster-")
                            ? " â€¢ Homebrew"
                            : ""}
                        </span>
                        <h2>{monster.name}</h2>
                        <p>{monster.alignment}</p>
                      </div>

                      <div className="monster-card-actions">
                        <strong className="level-badge">
                          CR {monster.challengeRating}
                        </strong>
                        <button
                          type="button"
                          onClick={() => toggleFavoriteMonster(monster.id)}
                        >
                          {isFavorite ? "â˜… Favori" : "â˜† Favori"}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/monsters/${monster.id}`)}
                        >
                          Detay
                        </button>
                      </div>
                    </div>

                    <div className="monster-core-grid">
                      <div>
                        <span>AC</span>
                        <strong>{monster.armorClass}</strong>
                      </div>

                      <div>
                        <span>HP</span>
                        <strong>{monster.hitPoints}</strong>
                        <em>{monster.hitDice}</em>
                      </div>

                      <div>
                        <span>Speed</span>
                        <strong>{monster.speed}</strong>
                      </div>

                      <div>
                        <span>PB</span>
                        <strong>+{monster.proficiencyBonus}</strong>
                      </div>
                    </div>

                    <div className="monster-combat-panel">
                      <div className="monster-combat-head">
                        <div>
                          <span className="mini-label">Combat HP</span>
                          <strong>
                            {combatState.currentHp}/{monster.hitPoints}
                          </strong>
                        </div>

                        <button onClick={() => resetMonsterCombat(monster)}>
                          Reset
                        </button>
                      </div>

                      <div className="hp-button-grid monster-hp-grid">
                        <button onClick={() => updateMonsterHp(monster, -10)}>
                          -10
                        </button>
                        <button onClick={() => updateMonsterHp(monster, -5)}>
                          -5
                        </button>
                        <button onClick={() => updateMonsterHp(monster, -1)}>
                          -1
                        </button>
                        <button onClick={() => updateMonsterHp(monster, 1)}>
                          +1
                        </button>
                        <button onClick={() => updateMonsterHp(monster, 5)}>
                          +5
                        </button>
                        <button onClick={() => updateMonsterHp(monster, 10)}>
                          +10
                        </button>
                      </div>

                      <div className="monster-roll-buttons">
                        <button
                          onClick={() =>
                            rollMonsterCheck(
                              monster,
                              "Initiative",
                              getMonsterAbilityModifier(monster.abilities.dex),
                            )
                          }
                        >
                          Initiative
                        </button>

                        <button
                          onClick={() =>
                            rollMonsterCheck(monster, "Attack", attackModifier)
                          }
                        >
                          Attack {attackModifier >= 0 ? "+" : ""}
                          {attackModifier}
                        </button>

                        <button onClick={() => rollMonsterDamage(monster)}>
                          Damage
                        </button>

                        <button
                          onClick={() =>
                            rollMonsterCheck(
                              monster,
                              "STR",
                              getMonsterAbilityModifier(monster.abilities.str),
                            )
                          }
                        >
                          STR
                        </button>

                        <button
                          onClick={() =>
                            rollMonsterCheck(
                              monster,
                              "DEX",
                              getMonsterAbilityModifier(monster.abilities.dex),
                            )
                          }
                        >
                          DEX
                        </button>

                        <button
                          onClick={() =>
                            rollMonsterCheck(
                              monster,
                              "CON",
                              getMonsterAbilityModifier(monster.abilities.con),
                            )
                          }
                        >
                          CON
                        </button>
                      </div>

                      {latestMonsterRoll ? (
                        <div className="monster-latest-roll">
                          <span className="mini-label">Latest Monster Roll</span>
                          <strong>{latestMonsterRoll.total}</strong>
                          <p>
                            {latestMonsterRoll.notation} â†’ [
                            {latestMonsterRoll.rolls.join(", ")}]
                            {latestMonsterRoll.modifier !== 0
                              ? ` ${
                                  latestMonsterRoll.modifier > 0 ? "+" : ""
                                }${latestMonsterRoll.modifier}`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <div className="monster-latest-roll">
                          <span className="mini-label">Latest Monster Roll</span>
                          <strong>--</strong>
                          <p>HenÃ¼z roll yok. Canavar bile beklemede.</p>
                        </div>
                      )}
                    </div>

                    <div className="monster-ability-grid">
                      {Object.entries(monster.abilities).map(
                        ([ability, score]) => (
                          <div key={ability}>
                            <span>{ability.toUpperCase()}</span>
                            <strong>{score}</strong>
                            <em>{formatMonsterModifier(score)}</em>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="monster-meta-block">
                      <p>
                        <strong>Senses:</strong> {monster.senses}
                      </p>
                      <p>
                        <strong>Languages:</strong> {monster.languages}
                      </p>
                    </div>

                    <details className="monster-details">
                      <summary>Traits & Actions</summary>

                      {monster.traits.length > 0 ? (
                        <div>
                          <h3>Traits</h3>
                          {monster.traits.map((trait) => (
                            <p key={trait}>{trait}</p>
                          ))}
                        </div>
                      ) : null}

                      {monster.actions.length > 0 ? (
                        <div>
                          <h3>Actions</h3>
                          {monster.actions.map((action) => (
                            <p key={action}>{action}</p>
                          ))}
                        </div>
                      ) : null}
                    </details>

                    <p className="monster-description">{monster.description}</p>

                    {monster.source ? (
                      <div className="library-pill-row">
                        <span>{monster.source}</span>
                      </div>
                    ) : null}
                  </motion.article>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}


export function MonsterDetail({
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const { monsterId } = useParams();
  const navigate = useNavigate();
  const monster = rulesetData?.monsters.find((item) => item.id === monsterId);
  const [favoriteMonsterIds, setFavoriteMonsterIds] = useState<string[]>(() =>
    loadFavoriteMonsterIds(),
  );
  const [combatState, setCombatState] = useState<MonsterCombatState | null>(
    null,
  );

  useDebouncedEffect(favoriteMonsterIds, saveFavoriteMonsterIds, 250, {
    skipInitial: true,
  });

  useEffect(() => {
    if (monster) {
      setCombatState((current) =>
        current ?? {
          currentHp: monster.hitPoints,
          rollHistory: [],
        },
      );
    }
  }, [monster]);

  if (isRulesetLoading) {
    return (
      <PageShell
        eyebrow="Monster Detail"
        title="Monster yÃ¼kleniyor"
        description="Stat block Ã§aÄŸÄ±rÄ±yoruz. Canavar bile loading state yaÅŸÄ±yor."
      >
        <div className="empty-panel">
          <h2>Data yÃ¼kleniyor...</h2>
          <p>Beklemedeyiz. Dramatik ama teknik.</p>
        </div>
      </PageShell>
    );
  }

  if (rulesetError) {
    return (
      <PageShell
        eyebrow="Monster Detail"
        title="Monster data yÃ¼klenemedi"
        description="Bir yerlerde JSON inledi."
      >
        <div className="empty-panel">
          <h2>Data yÃ¼klenemedi</h2>
          <p>{rulesetError}</p>
        </div>
      </PageShell>
    );
  }

  if (!monster || !combatState) {
    return (
      <PageShell
        eyebrow="Monster Detail"
        title="Monster bulunamadÄ±"
        description="Ya silindi ya da boyut kapÄ±sÄ±ndan kaÃ§tÄ±. Ä°kisi de sinir bozucu."
      >
        <button className="primary-action" onClick={() => navigate("/monsters")}>
          Monster listesine dÃ¶n
        </button>
      </PageShell>
    );
  }

  const activeMonster = monster;
  const activeCombatState = combatState;

  const isFavorite = favoriteMonsterIds.includes(activeMonster.id);
  const latestMonsterRoll = activeCombatState.rollHistory[0];
  const attackModifier = getMonsterMainAttackModifier(activeMonster);

  function toggleFavoriteMonster(monsterIdToToggle: string) {
    setFavoriteMonsterIds((current) =>
      current.includes(monsterIdToToggle)
        ? current.filter((id) => id !== monsterIdToToggle)
        : [...current, monsterIdToToggle],
    );
  }

  function updateMonsterHp(amount: number) {
    setCombatState((current) => {
      const state = current ?? {
        currentHp: activeMonster.hitPoints,
        rollHistory: [],
      };

      return {
        ...state,
        currentHp: Math.max(
          0,
          Math.min(activeMonster.hitPoints, state.currentHp + amount),
        ),
      };
    });
  }

  function resetMonsterCombat() {
    setCombatState({
      currentHp: activeMonster.hitPoints,
      rollHistory: [],
    });
  }

  function addMonsterRoll(label: string, result: DiceRollResult) {
    setCombatState((current) => {
      const state = current ?? {
        currentHp: activeMonster.hitPoints,
        rollHistory: [],
      };

      return {
        ...state,
        rollHistory: [
          {
            ...result,
            notation: `${label}: ${result.notation}`,
          },
          ...state.rollHistory,
        ].slice(0, 12),
      };
    });
  }

  function rollMonsterCheck(label: string, modifier: number) {
    addMonsterRoll(
      label,
      rollDice({
        count: 1,
        sides: 20,
        modifier,
      }),
    );
  }

  function rollMonsterDamage() {
    const parsedDamage = parseFirstDiceExpression(activeMonster.actions.join(" "));

    if (!parsedDamage) {
      alert(
        "Bu monster action iÃ§inde otomatik okunabilir damage dice bulamadÄ±m. Metin parse etmek yine medeniyeti yordu.",
      );
      return;
    }

    addMonsterRoll("Damage", rollDice(parsedDamage));
  }

  return (
    <PageShell
      eyebrow="Monster Detail"
      title={activeMonster.name}
      description={`${activeMonster.size} ${activeMonster.type} â€¢ ${activeMonster.alignment} â€¢ CR ${activeMonster.challengeRating}`}
    >
      <div className="monster-detail-layout">
        <section className="monster-detail-main-card">
          <div className="monster-card-head">
            <div>
              <span className="mini-label">{activeMonster.source ?? "Monster"}</span>
              <h2>{activeMonster.name}</h2>
              <p>{activeMonster.description}</p>
            </div>

            <div className="monster-card-actions">
              <strong className="level-badge">CR {activeMonster.challengeRating}</strong>
              <button onClick={() => toggleFavoriteMonster(activeMonster.id)}>
                {isFavorite ? "â˜… Favori" : "â˜† Favori"}
              </button>
              <button onClick={() => navigate("/monsters")}>Listeye DÃ¶n</button>
            </div>
          </div>

          <div className="monster-core-grid monster-detail-core-grid">
            <div>
              <span>Armor Class</span>
              <strong>{activeMonster.armorClass}</strong>
            </div>
            <div>
              <span>Hit Points</span>
              <strong>{activeMonster.hitPoints}</strong>
              <em>{activeMonster.hitDice}</em>
            </div>
            <div>
              <span>Speed</span>
              <strong>{activeMonster.speed}</strong>
            </div>
            <div>
              <span>Proficiency</span>
              <strong>+{activeMonster.proficiencyBonus}</strong>
            </div>
          </div>

          <div className="monster-ability-grid monster-detail-ability-grid">
            {Object.entries(activeMonster.abilities).map(([ability, score]) => (
              <div key={ability}>
                <span>{ability.toUpperCase()}</span>
                <strong>{score}</strong>
                <em>{formatMonsterModifier(score)}</em>
              </div>
            ))}
          </div>

          <div className="monster-detail-section-grid">
            <section className="monster-detail-section-card">
              <span className="mini-label">Senses</span>
              <p>{activeMonster.senses}</p>
            </section>
            <section className="monster-detail-section-card">
              <span className="mini-label">Languages</span>
              <p>{activeMonster.languages}</p>
            </section>
          </div>

          <section className="monster-detail-section-card">
            <span className="mini-label">Traits</span>
            {activeMonster.traits.length > 0 ? (
              activeMonster.traits.map((trait) => <p key={trait}>{trait}</p>)
            ) : (
              <p>Trait yok. Canavar sade yaÅŸamÄ± seÃ§miÅŸ.</p>
            )}
          </section>

          <section className="monster-detail-section-card">
            <span className="mini-label">Actions</span>
            {activeMonster.actions.length > 0 ? (
              activeMonster.actions.map((action) => <p key={action}>{action}</p>)
            ) : (
              <p>Action yok. Pasif agresif bir stat block.</p>
            )}
          </section>
        </section>

        <aside className="monster-detail-combat-card">
          <span className="mini-label">Combat Tools</span>
          <div className="hp-display">
            <strong>
              {activeCombatState.currentHp}/{activeMonster.hitPoints}
            </strong>
            <span>Monster HP</span>
          </div>

          <div className="hp-button-grid monster-hp-grid">
            <button onClick={() => updateMonsterHp(-10)}>-10</button>
            <button onClick={() => updateMonsterHp(-5)}>-5</button>
            <button onClick={() => updateMonsterHp(-1)}>-1</button>
            <button onClick={() => updateMonsterHp(1)}>+1</button>
            <button onClick={() => updateMonsterHp(5)}>+5</button>
            <button onClick={() => updateMonsterHp(10)}>+10</button>
          </div>

          <div className="monster-roll-buttons detail-monster-roll-buttons">
            <button
              onClick={() =>
                rollMonsterCheck(
                  "Initiative",
                  getMonsterAbilityModifier(activeMonster.abilities.dex),
                )
              }
            >
              Initiative
            </button>
            <button onClick={() => rollMonsterCheck("Attack", attackModifier)}>
              Attack {attackModifier >= 0 ? "+" : ""}
              {attackModifier}
            </button>
            <button onClick={rollMonsterDamage}>Damage</button>
            {Object.entries(activeMonster.abilities).map(([ability, score]) => (
              <button
                key={ability}
                onClick={() =>
                  rollMonsterCheck(
                    `${ability.toUpperCase()} Check`,
                    getMonsterAbilityModifier(score),
                  )
                }
              >
                {ability.toUpperCase()}
              </button>
            ))}
          </div>

          <button className="secondary-action" onClick={resetMonsterCombat}>
            Combat Reset
          </button>

          <div className="monster-latest-roll detail-monster-latest-roll">
            <span className="mini-label">Latest Monster Roll</span>
            {latestMonsterRoll ? (
              <>
                <strong>{latestMonsterRoll.total}</strong>
                <p>
                  {latestMonsterRoll.notation} â†’ [
                  {latestMonsterRoll.rolls.join(", ")}]
                  {latestMonsterRoll.modifier !== 0
                    ? ` ${latestMonsterRoll.modifier > 0 ? "+" : ""}${
                        latestMonsterRoll.modifier
                      }`
                    : ""}
                </p>
              </>
            ) : (
              <>
                <strong>--</strong>
                <p>HenÃ¼z roll yok. Canavar bile sÄ±ra bekliyor.</p>
              </>
            )}
          </div>

          <div className="monster-roll-history-list">
            <span className="mini-label">Roll History</span>
            {activeCombatState.rollHistory.length === 0 ? (
              <p>GeÃ§miÅŸ boÅŸ. Stat block henÃ¼z suÃ§ iÅŸlememiÅŸ.</p>
            ) : (
              activeCombatState.rollHistory.map((roll) => (
                <div className="monster-roll-history-item" key={roll.id}>
                  <span>{roll.notation}</span>
                  <strong>{roll.total}</strong>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

