import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { motion } from "framer-motion";
import type { DiceRollResult } from "../../core/dice/dice.types";
import { rollDice } from "../../core/dice/diceRoller";
import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
  RulesetData,
} from "../../core/rulesets/ruleset.types";
import { loadDnd2014Ruleset } from "../../core/rulesets/rulesetLoader";

import type {
  Character,
  CharacterDraft,
} from "../../core/character/character.types";
import {
  exportCharacters,
  loadCharacters,
  saveCharacters,
} from "../../core/storage/characterStorage";
import "../../App.css";
import { Dashboard } from "../dashboard/Dashboard";
import { Characters } from "../characters/Characters";
import { CharacterDetail } from "../characters/CharacterDetail";
import { CharacterEditor } from "../characters/CharacterEditor";
import { Builder } from "../builder/Builder";
import { createCharacterFromDraft } from "../characters/characterShared";
import { PageShell } from "../../shared/layout/PageShell";
import { navItems } from "../../shared/navigation/navItems";
import {
  getItemCategoryLabel,
  getItemRulesSummary,
} from "../characters/characterShared";
import type {
  Campaign,
} from "../campaigns/campaignTypes";
import { loadCampaigns, saveCampaigns } from "../campaigns/campaignStorage";
import {
  formatMonsterModifier,
  getMonsterAbilityModifier,
} from "../monsters/monsterUtils";
import { MonsterDetail, MonsterLibrary } from "../monsters/MonsterLibrary";
import { Campaigns } from "../campaigns/Campaigns";

function PlayMode() {
  return (
    <PageShell
      eyebrow="Table Mode"
      title="Play Mode"
      description="HP, condition, spell slot, concentration ve rest takibi burada olacak."
    >
      <div className="combat-panel">
        <div>
          <span className="mini-label">Current HP</span>
          <strong className="big-number">24 / 31</strong>
        </div>

        <div className="combat-buttons">
          <button>-10</button>
          <button>-5</button>
          <button>-1</button>
          <button>+1</button>
          <button>+5</button>
          <button>+10</button>
        </div>

        <div className="condition-row">
          {[
            "Blessed",
            "Poisoned",
            "Prone",
            "Concentration",
            "Rage",
            "Haki",
          ].map((condition) => (
            <button key={condition}>{condition}</button>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function Dice() {
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  const [customRoll, setCustomRoll] = useState({
    count: 1,
    sides: 20,
    modifier: 0,
  });

  function handleQuickRoll(sides: number) {
    const result = rollDice({
      count: 1,
      sides,
      modifier: 0,
    });

    setRollHistory((current) => [result, ...current].slice(0, 20));
  }

  function handleCustomRoll(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = rollDice(customRoll);

    setRollHistory((current) => [result, ...current].slice(0, 20));
  }

  const latestRoll = rollHistory[0];

  return (
    <PageShell
      eyebrow="Dice Roller"
      title="Zar"
      description="D4'ten D100'e hızlı zar atma, custom roll ve son atış geçmişi. Gerçek random, sahte özgüven."
    >
      <div className="dice-layout">
        <section className="dice-main-panel">
          <div className="dice-grid">
            {[4, 6, 8, 10, 12, 20, 100].map((dice) => (
              <motion.button
                className="dice-button"
                key={dice}
                whileTap={{ scale: 0.92, rotate: -3 }}
                whileHover={{ y: -5 }}
                onClick={() => handleQuickRoll(dice)}
              >
                d{dice}
              </motion.button>
            ))}
          </div>

          <form className="custom-roll-form" onSubmit={handleCustomRoll}>
            <label>
              Count
              <input
                type="number"
                min={1}
                max={100}
                value={customRoll.count}
                onChange={(event) =>
                  setCustomRoll((current) => ({
                    ...current,
                    count: Number(event.target.value),
                  }))
                }
              />
            </label>

            <span className="dice-form-separator">d</span>

            <label>
              Sides
              <input
                type="number"
                min={2}
                max={1000}
                value={customRoll.sides}
                onChange={(event) =>
                  setCustomRoll((current) => ({
                    ...current,
                    sides: Number(event.target.value),
                  }))
                }
              />
            </label>

            <span className="dice-form-separator">+</span>

            <label>
              Mod
              <input
                type="number"
                min={-999}
                max={999}
                value={customRoll.modifier}
                onChange={(event) =>
                  setCustomRoll((current) => ({
                    ...current,
                    modifier: Number(event.target.value),
                  }))
                }
              />
            </label>

            <button className="primary-action" type="submit">
              Custom Roll
            </button>
          </form>
        </section>

        <aside className="dice-result-panel">
          <span className="mini-label">Latest Roll</span>

          {latestRoll ? (
            <>
              <strong className="dice-total">{latestRoll.total}</strong>

              <p>
                {latestRoll.notation} → [{latestRoll.rolls.join(", ")}]
                {latestRoll.modifier !== 0
                  ? ` ${latestRoll.modifier > 0 ? "+" : ""}${
                      latestRoll.modifier
                    }`
                  : ""}
              </p>
            </>
          ) : (
            <>
              <strong className="dice-total">--</strong>
              <p>Henüz zar atılmadı. Masa kader bekliyor, dramatik.</p>
            </>
          )}

          <div className="roll-history">
            {rollHistory.length === 0 ? (
              <div className="history-empty">
                Zar geçmişi boş. Bu kadar sakinlik D&D masasına yakışmıyor.
              </div>
            ) : (
              rollHistory.map((roll) => (
                <div className="history-roll" key={roll.id}>
                  <div>
                    <strong>{roll.notation}</strong>
                    <span>{roll.rolls.join(", ")}</span>
                  </div>

                  <b>{roll.total}</b>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function DataBackup({
  characters,
  onImportCharacters,
  onWipeCharacters,
}: {
  characters: Character[];
  onImportCharacters: (characters: Character[]) => void;
  onWipeCharacters: () => void;
}) {
  function handleExport() {
    if (characters.length === 0) {
      alert("Yedeklenecek karakter yok kankam. Boşluğu JSON'a çeviremiyoruz.");
      return;
    }

    exportCharacters(characters);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        alert(
          "Bu dosya karakter listesi değil. JSON var ama karakter yok, çok şiirsel ve işe yaramaz.",
        );
        return;
      }

      const looksValid = parsed.every((item) => {
        return (
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.className === "string" &&
          typeof item.level === "number" &&
          typeof item.maxHp === "number" &&
          typeof item.armorClass === "number" &&
          typeof item.abilities === "object"
        );
      });

      if (!looksValid) {
        alert(
          "Bu JSON bizim karakter formatımıza benzemiyor. Yani evet, yine format cehennemi.",
        );
        return;
      }

      const confirmed = confirm(
        "Bu işlem mevcut karakter listesinin üstüne yazacak. Devam edilsin mi?",
      );

      if (!confirmed) {
        return;
      }

      onImportCharacters(parsed as Character[]);
      event.target.value = "";
    } catch {
      alert(
        "JSON okunamadı. Dosya bozuk olabilir ya da dijital goblinler yemiştir.",
      );
    }
  }

  function handleWipe() {
    if (characters.length === 0) {
      alert("Zaten silinecek karakter yok. Boşluğu ikinci kez silemiyoruz.");
      return;
    }

    const confirmed = confirm(
      "Tüm karakterler silinsin mi? Bu işlem geri alınamaz. Dramatik müzik burada giriyor.",
    );

    if (!confirmed) {
      return;
    }

    onWipeCharacters();
  }

  return (
    <PageShell
      eyebrow="Data Backup"
      title="Yedek"
      description="Karakterlerini JSON olarak dışa aktar, geri yükle veya local veriyi temizle. Store yoksa yedek var, ilkel ama güvenilir."
    >
      <div className="backup-layout">
        <section className="backup-card backup-primary">
          <span className="mini-label">Local Data</span>
          <h2>{characters.length} karakter kayıtlı</h2>
          <p>
            Karakterler şu an bu tarayıcının localStorage alanında duruyor. Yani
            cihazda kalıyor, cloud'a gitmiyor. Gizlilik güzel, veri kaybı riski
            ise çirkin. O yüzden yedek alıyoruz.
          </p>

          <div className="backup-actions">
            <button className="primary-action" onClick={handleExport}>
              JSON Yedek İndir
            </button>

            <label className="backup-file-button">
              JSON İçe Aktar
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleImport}
              />
            </label>
          </div>
        </section>

        <section className="backup-card">
          <span className="mini-label">Danger Zone</span>
          <h2>Veriyi Temizle</h2>
          <p>
            Test sırasında local veriyi sıfırlamak için kullanılır. Gerçek
            karakterlerini silmeden önce JSON yedek al. Bunu söylemek zorunda
            kalmam bile insanlık adına üzücü.
          </p>

          <button className="danger-action" onClick={handleWipe}>
            Tüm Karakterleri Sil
          </button>
        </section>

        <section className="backup-card backup-wide">
          <span className="mini-label">Backup Format</span>
          <h2>JSON ne işe yarıyor?</h2>
          <p>
            Bu dosya karakterlerini başka cihaza taşımanı sağlar. PC'de
            oluşturduğun karakteri telefona, telefondaki karakteri başka
            tarayıcıya aktarabilirsin. İlk sürümde cloud sync yerine bunu
            kullanacağız. Daha az büyülü, daha az bela.
          </p>

          <div className="backup-format-grid">
            <div>
              <strong>Export</strong>
              <span>Karakterleri dosya olarak indirir.</span>
            </div>

            <div>
              <strong>Import</strong>
              <span>JSON dosyasından karakterleri geri yükler.</span>
            </div>

            <div>
              <strong>Local</strong>
              <span>Veriler cihaz/tarayıcı içinde tutulur.</span>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function Library({
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  return (
    <PageShell
      eyebrow="Ruleset Library"
      title="Library"
      description="D&D 2014, D&D 2024 ve homebrew data pack içerikleri burada okunacak. Şimdilik ilk veri akışını D&D 2014 ile başlatıyoruz."
    >
      {isRulesetLoading ? (
        <div className="empty-panel">
          <h2>Data yükleniyor...</h2>
          <p>Kural kitabını tarayıcıya yediriyoruz. Zavallı şey.</p>
        </div>
      ) : rulesetError ? (
        <div className="empty-panel">
          <h2>Data yüklenemedi</h2>
          <p>{rulesetError}</p>
        </div>
      ) : rulesetData ? (
        <div className="library-data-layout">
          <section className="library-overview-card">
            <span className="mini-label">Loaded Ruleset</span>
            <h2>{rulesetData.name}</h2>
            <p>
              Şu an app içine local JSON data pack üzerinden class ve race
              verisi yüklendi. Bir sonraki hamlede Builder inputlarını bu
              datadan besleyeceğiz.
            </p>

            <div className="library-counter-grid">
              <div>
                <strong>{rulesetData.classes.length}</strong>
                <span>Classes</span>
              </div>

              <div>
                <strong>{rulesetData.races.length}</strong>
                <span>Races</span>
              </div>

              <div>
                <strong>{rulesetData.spells.length}</strong>
                <span>Spells</span>
              </div>

              <div>
                <strong>{rulesetData.items.length}</strong>
                <span>Items</span>
              </div>

              <div>
                <strong>{rulesetData.monsters.length}</strong>
                <span>Monsters</span>
              </div>
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Classes</span>
                <h2>Class Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.classes.map((classItem) => (
                <article className="library-item-card" key={classItem.id}>
                  <div className="library-item-top">
                    <h3>{classItem.name}</h3>
                    <span>d{classItem.hitDie}</span>
                  </div>

                  <p>{classItem.description}</p>

                  <div className="library-pill-row">
                    <span>
                      Saves:{" "}
                      {classItem.savingThrows
                        .map((save) => save.toUpperCase())
                        .join(", ")}
                    </span>

                    {classItem.spellcastingAbility ? (
                      <span>
                        Spell: {classItem.spellcastingAbility.toUpperCase()}
                      </span>
                    ) : (
                      <span>No spellcasting</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Races</span>
                <h2>Race Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.races.map((race) => (
                <article className="library-item-card" key={race.id}>
                  <div className="library-item-top">
                    <h3>{race.name}</h3>
                    <span>{race.speed} ft</span>
                  </div>

                  <p>{race.description}</p>

                  <div className="library-pill-row">
                    <span>{race.size}</span>

                    <span>
                      Bonus:{" "}
                      {Object.entries(race.abilityBonuses)
                        .map(
                          ([ability, bonus]) =>
                            `${ability.toUpperCase()} +${bonus}`,
                        )
                        .join(", ")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Spells</span>
                <h2>Spell Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.spells.slice(0, 8).map((spell) => (
                <article className="library-item-card" key={spell.id}>
                  <div className="library-item-top">
                    <h3>{spell.name}</h3>
                    <span>
                      {spell.level === 0 ? "Cantrip" : `Lv. ${spell.level}`}
                    </span>
                  </div>

                  <p>{spell.description}</p>

                  <div className="library-pill-row">
                    <span>{spell.school}</span>
                    <span>{spell.castingTime}</span>
                    <span>{spell.range}</span>
                    {spell.concentration ? <span>Concentration</span> : null}
                    {spell.ritual ? <span>Ritual</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Items</span>
                <h2>Item Listesi</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.items.slice(0, 8).map((item) => (
                <article className="library-item-card" key={item.id}>
                  <div className="library-item-top">
                    <h3>{item.name}</h3>
                    <span>{getItemCategoryLabel(item.category)}</span>
                  </div>

                  <p>{item.description}</p>

                  <div className="library-pill-row">
                    <span>{getItemRulesSummary(item)}</span>
                    <span>{item.cost}</span>
                    <span>{item.weight} lb</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="library-section-card">
            <div className="library-section-head">
              <div>
                <span className="mini-label">Monsters</span>
                <h2>Monster Önizleme</h2>
              </div>
            </div>

            <div className="library-list-grid">
              {rulesetData.monsters.slice(0, 8).map((monster) => (
                <article className="library-item-card" key={monster.id}>
                  <div className="library-item-top">
                    <h3>{monster.name}</h3>
                    <span>CR {monster.challengeRating}</span>
                  </div>

                  <p>{monster.description}</p>

                  <div className="library-pill-row">
                    <span>
                      {monster.size} {monster.type}
                    </span>
                    <span>AC {monster.armorClass}</span>
                    <span>HP {monster.hitPoints}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}

function Spellbook({
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

function Inventory({
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

const HOMEBREW_SPELLS_STORAGE_KEY = "e4_dnd_homebrew_spells_v1";
const HOMEBREW_ITEMS_STORAGE_KEY = "e4_dnd_homebrew_items_v1";
const HOMEBREW_MONSTERS_STORAGE_KEY = "e4_dnd_homebrew_monsters_v1";

function parseTextList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadHomebrewSpells(): DndSpellData[] {
  try {
    const raw = localStorage.getItem(HOMEBREW_SPELLS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DndSpellData[]) : [];
  } catch {
    return [];
  }
}

function saveHomebrewSpells(spells: DndSpellData[]) {
  localStorage.setItem(HOMEBREW_SPELLS_STORAGE_KEY, JSON.stringify(spells));
}

function loadHomebrewItems(): DndItemData[] {
  try {
    const raw = localStorage.getItem(HOMEBREW_ITEMS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DndItemData[]) : [];
  } catch {
    return [];
  }
}

function saveHomebrewItems(items: DndItemData[]) {
  localStorage.setItem(HOMEBREW_ITEMS_STORAGE_KEY, JSON.stringify(items));
}

function loadHomebrewMonsters(): DndMonsterData[] {
  try {
    const raw = localStorage.getItem(HOMEBREW_MONSTERS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DndMonsterData[]) : [];
  } catch {
    return [];
  }
}

function saveHomebrewMonsters(monsters: DndMonsterData[]) {
  localStorage.setItem(HOMEBREW_MONSTERS_STORAGE_KEY, JSON.stringify(monsters));
}

const SPELL_CLASS_OPTIONS = [
  "Bard",
  "Cleric",
  "Druid",
  "Paladin",
  "Ranger",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const SPELL_SCHOOL_OPTIONS = [
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
];

const SPELL_EFFECT_OPTIONS = [
  "Damage",
  "Healing",
  "Buff",
  "Debuff",
  "Utility",
  "Defense",
  "Movement",
  "Summon",
];

const DAMAGE_TYPE_OPTIONS = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

const SAVE_ABILITY_OPTIONS = ["str", "dex", "con", "int", "wis", "cha"];

const ATTACK_TYPE_OPTIONS = [
  { value: "spell-attack", label: "Spell Attack" },
  { value: "saving-throw", label: "Saving Throw" },
  { value: "automatic", label: "Automatic" },
];

const CONDITION_EFFECT_OPTIONS: Character["conditions"] = [
  "Blessed",
  "Poisoned",
  "Prone",
  "Invisible",
  "Stunned",
  "Restrained",
  "Concentration",
  "Rage",
  "Haki",
  "Cursed",
];

const WEAPON_PROPERTY_OPTIONS = [
  "Finesse",
  "Light",
  "Heavy",
  "Two-Handed",
  "Versatile",
  "Ranged",
  "Thrown",
  "Reach",
  "Loading",
  "Ammunition",
];

const MONSTER_SIZE_OPTIONS = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
];

const MONSTER_TYPE_OPTIONS = [
  "aberration",
  "beast",
  "celestial",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "fiend",
  "giant",
  "humanoid",
  "monstrosity",
  "ooze",
  "plant",
  "undead",
];

const MONSTER_CR_OPTIONS = [
  "0",
  "1/8",
  "1/4",
  "1/2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

function getMonsterProficiencyBonusByCr(challengeRating: string) {
  const numericCr = challengeRating.includes("/")
    ? challengeRating
        .split("/")
        .map(Number)
        .reduce((top, bottom) => top / bottom)
    : Number(challengeRating);

  if (!Number.isFinite(numericCr) || numericCr < 5) {
    return 2;
  }

  if (numericCr < 9) {
    return 3;
  }

  if (numericCr < 13) {
    return 4;
  }

  return 5;
}

function HomebrewLab({
  homebrewSpells,
  homebrewItems,
  homebrewMonsters,
  onCreateHomebrewSpell,
  onDeleteHomebrewSpell,
  onCreateHomebrewItem,
  onDeleteHomebrewItem,
  onCreateHomebrewMonster,
  onDeleteHomebrewMonster,
}: {
  homebrewSpells: DndSpellData[];
  homebrewItems: DndItemData[];
  homebrewMonsters: DndMonsterData[];
  onCreateHomebrewSpell: (spell: DndSpellData) => void;
  onDeleteHomebrewSpell: (id: string) => void;
  onCreateHomebrewItem: (item: DndItemData) => void;
  onDeleteHomebrewItem: (id: string) => void;
  onCreateHomebrewMonster: (monster: DndMonsterData) => void;
  onDeleteHomebrewMonster: (id: string) => void;
}) {
  const [spellForm, setSpellForm] = useState({
    name: "",
    level: 0,
    school: "Evocation",
    castingTime: "1 action",
    range: "60 feet",
    componentsText: "V, S",
    duration: "Instantaneous",
    concentration: false,
    ritual: false,
    classes: ["Cleric"],
    effectType: "Damage",
    attackType: "saving-throw",
    damageDice: "",
    damageType: "radiant",
    healingDice: "",
    saveAbility: "dex",
    conditionEffect: "",
    description: "",
    higherLevels: "",
  });

  const [itemForm, setItemForm] = useState({
    name: "",
    category: "gear" as DndItemData["category"],
    cost: "",
    weight: 0,
    description: "",
    armorClass: "",
    armorClassBonus: "2",
    armorType: "light",
    dexBonusMax: "",
    damage: "",
    damageType: "slashing",
    properties: [] as string[],
    range: "",
  });

  const [monsterForm, setMonsterForm] = useState({
    name: "",
    size: "Medium",
    type: "humanoid",
    alignment: "unaligned",
    armorClass: 12,
    hitPoints: 7,
    hitDice: "2d8",
    speed: "30 ft.",
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    challengeRating: "1/4",
    senses: "passive Perception 10",
    languages: "—",
    traitsText: "",
    actionsText: "",
    traitName: "",
    traitDescription: "",
    actionName: "",
    actionAttackType: "melee-weapon",
    actionAbility: "str",
    actionDamageDice: "1d6",
    actionDamageType: "slashing",
    actionReachRange: "5 ft.",
    actionDescription: "",
    description: "",
  });

  function updateSpellForm<K extends keyof typeof spellForm>(
    key: K,
    value: (typeof spellForm)[K],
  ) {
    setSpellForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateItemForm<K extends keyof typeof itemForm>(
    key: K,
    value: (typeof itemForm)[K],
  ) {
    setItemForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMonsterForm<K extends keyof typeof monsterForm>(
    key: K,
    value: (typeof monsterForm)[K],
  ) {
    setMonsterForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMonsterAbility(
    ability: keyof typeof monsterForm.abilities,
    value: number,
  ) {
    setMonsterForm((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [ability]: value,
      },
    }));
  }

  function appendMonsterTextBlock(
    key: "traitsText" | "actionsText",
    value: string,
  ) {
    if (!value.trim()) {
      return;
    }

    setMonsterForm((current) => ({
      ...current,
      [key]: current[key].trim()
        ? `${current[key].trim()}\n${value.trim()}`
        : value.trim(),
    }));
  }

  function addMonsterTraitFromBuilder() {
    if (!monsterForm.traitName.trim() && !monsterForm.traitDescription.trim()) {
      alert("Trait adı ya da açıklaması lazım. Boş trait, bürokratik sis efekti gibi duruyor.");
      return;
    }

    const line = monsterForm.traitName.trim()
      ? `${monsterForm.traitName.trim()}. ${
          monsterForm.traitDescription.trim() || "Homebrew trait."
        }`
      : monsterForm.traitDescription.trim();

    appendMonsterTextBlock("traitsText", line);
    setMonsterForm((current) => ({
      ...current,
      traitName: "",
      traitDescription: "",
    }));
  }

  function getMonsterActionAttackLabel() {
    if (monsterForm.actionAttackType === "melee-weapon") {
      return "Melee Weapon Attack";
    }

    if (monsterForm.actionAttackType === "ranged-weapon") {
      return "Ranged Weapon Attack";
    }

    if (monsterForm.actionAttackType === "melee-spell") {
      return "Melee Spell Attack";
    }

    if (monsterForm.actionAttackType === "ranged-spell") {
      return "Ranged Spell Attack";
    }

    return "Action";
  }

  function getMonsterActionAttackBonus() {
    const ability = monsterForm.actionAbility as keyof typeof monsterForm.abilities;
    return (
      getMonsterAbilityModifier(Number(monsterForm.abilities[ability])) +
      getMonsterProficiencyBonusByCr(monsterForm.challengeRating)
    );
  }

  function buildMonsterActionLine() {
    const actionName = monsterForm.actionName.trim() || "Homebrew Action";
    const actionDescription = monsterForm.actionDescription.trim();
    const damageText = monsterForm.actionDamageDice.trim()
      ? ` Hit: ${monsterForm.actionDamageDice.trim()} ${monsterForm.actionDamageType} damage.`
      : "";

    if (monsterForm.actionAttackType === "utility") {
      return `${actionName}. ${actionDescription || "The creature uses a custom utility action."}`;
    }

    return `${actionName}. ${getMonsterActionAttackLabel()}: ${
      getMonsterActionAttackBonus() >= 0 ? "+" : ""
    }${getMonsterActionAttackBonus()} to hit, reach/range ${
      monsterForm.actionReachRange.trim() || "5 ft."
    }.${damageText}${actionDescription ? ` ${actionDescription}` : ""}`;
  }

  function addMonsterActionFromBuilder() {
    if (!monsterForm.actionName.trim() && !monsterForm.actionDescription.trim()) {
      alert("Action adı ya da açıklaması lazım. Canavar aksiyonsuz kalırsa toplantıya katılmış gibi olur.");
      return;
    }

    appendMonsterTextBlock("actionsText", buildMonsterActionLine());
    setMonsterForm((current) => ({
      ...current,
      actionName: "",
      actionDescription: "",
      actionDamageDice: "1d6",
      actionReachRange: "5 ft.",
    }));
  }

  function toggleSpellClass(className: string) {
    setSpellForm((current) => {
      const hasClass = current.classes.includes(className);
      const nextClasses = hasClass
        ? current.classes.filter((item) => item !== className)
        : [...current.classes, className];

      return {
        ...current,
        classes: nextClasses,
      };
    });
  }

  function toggleItemProperty(property: string) {
    setItemForm((current) => {
      const hasProperty = current.properties.includes(property);
      const nextProperties = hasProperty
        ? current.properties.filter((item) => item !== property)
        : [...current.properties, property];

      return {
        ...current,
        properties: nextProperties,
      };
    });
  }

  function getSpellEffectSummary() {
    const parts: string[] = [];

    parts.push(`Effect: ${spellForm.effectType}`);
    parts.push(
      `Resolution: ${ATTACK_TYPE_OPTIONS.find((item) => item.value === spellForm.attackType)?.label ?? spellForm.attackType}`,
    );

    if (spellForm.damageDice.trim()) {
      parts.push(
        `Damage: ${spellForm.damageDice.trim()} ${spellForm.damageType}`,
      );
    }

    if (spellForm.healingDice.trim()) {
      parts.push(`Healing: ${spellForm.healingDice.trim()}`);
    }

    if (spellForm.attackType === "saving-throw") {
      parts.push(`Save: ${spellForm.saveAbility.toUpperCase()}`);
    }

    if (spellForm.conditionEffect) {
      parts.push(`Condition: ${spellForm.conditionEffect}`);
    }

    return parts.join(" • ");
  }

  function buildSpellDescription() {
    const effectSummary = getSpellEffectSummary();
    const description = spellForm.description.trim();

    if (!description) {
      return effectSummary;
    }

    return `${description}\n\n${effectSummary}`;
  }

  function handleCreateSpell(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spellForm.name.trim()) {
      alert("Spell adı lazım kankam. Büyü isimsiz olunca DM bile anlamıyor.");
      return;
    }

    if (spellForm.classes.length === 0) {
      alert(
        "Bu büyüyü en az bir class kullanabilsin. Yoksa büyü değil, dekoratif PDF olur.",
      );
      return;
    }

    if (
      !spellForm.description.trim() &&
      !spellForm.damageDice.trim() &&
      !spellForm.healingDice.trim()
    ) {
      alert(
        "Spell etkisi lazım. En az açıklama, damage ya da healing gir. Boş büyüyle evren ikna olmuyor.",
      );
      return;
    }

    onCreateHomebrewSpell({
      id: `homebrew-spell-${crypto.randomUUID()}`,
      name: spellForm.name.trim(),
      level: spellForm.level,
      school: spellForm.school.trim() || "Homebrew",
      castingTime: spellForm.castingTime.trim() || "1 action",
      range: spellForm.range.trim() || "Self",
      components: parseTextList(spellForm.componentsText),
      duration: spellForm.duration.trim() || "Instantaneous",
      concentration: spellForm.concentration,
      ritual: spellForm.ritual,
      classes: spellForm.classes,
      description: buildSpellDescription(),
      higherLevels: spellForm.higherLevels.trim() || undefined,
      effectType: spellForm.effectType,
      attackType: spellForm.attackType,
      damageDice: spellForm.damageDice.trim() || undefined,
      damageType: spellForm.damageDice.trim()
        ? spellForm.damageType
        : undefined,
      healingDice: spellForm.healingDice.trim() || undefined,
      saveAbility:
        spellForm.attackType === "saving-throw"
          ? (spellForm.saveAbility as
              "str" | "dex" | "con" | "int" | "wis" | "cha")
          : undefined,
      conditionEffect: spellForm.conditionEffect || undefined,
    });

    setSpellForm((current) => ({
      ...current,
      name: "",
      description: "",
      higherLevels: "",
      damageDice: "",
      healingDice: "",
      conditionEffect: "",
    }));
  }

  function handleCreateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!itemForm.name.trim()) {
      alert(
        "Item adı lazım. Çantaya 'şey' diye item koyarsak barbar bile güler.",
      );
      return;
    }

    const armorClass = Number(itemForm.armorClass);
    const armorClassBonus = Number(itemForm.armorClassBonus);
    const dexBonusMax = Number(itemForm.dexBonusMax);

    onCreateHomebrewItem({
      id: `homebrew-item-${crypto.randomUUID()}`,
      name: itemForm.name.trim(),
      category: itemForm.category,
      cost: itemForm.cost.trim() || "Custom",
      weight: Number.isFinite(itemForm.weight) ? itemForm.weight : 0,
      description: itemForm.description.trim() || "Homebrew item.",
      armorClass:
        itemForm.category === "armor" && Number.isFinite(armorClass)
          ? armorClass
          : undefined,
      armorClassBonus:
        itemForm.category === "shield" && Number.isFinite(armorClassBonus)
          ? armorClassBonus
          : undefined,
      armorType:
        itemForm.category === "armor"
          ? (itemForm.armorType as "light" | "medium" | "heavy")
          : undefined,
      dexBonusMax:
        itemForm.category === "armor" && Number.isFinite(dexBonusMax)
          ? dexBonusMax
          : undefined,
      damage:
        itemForm.category === "weapon" ? itemForm.damage.trim() : undefined,
      damageType:
        itemForm.category === "weapon" ? itemForm.damageType.trim() : undefined,
      properties:
        itemForm.category === "weapon" ? itemForm.properties : undefined,
      range: itemForm.category === "weapon" ? itemForm.range.trim() : undefined,
      tags: ["homebrew"],
    });

    setItemForm((current) => ({
      ...current,
      name: "",
      description: "",
      damage: "",
      range: "",
      properties: [],
    }));
  }

  function handleCreateMonster(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!monsterForm.name.trim()) {
      alert(
        "Monster/NPC adı lazım kankam. İsimsiz yaratık ancak vergi dairesi olur.",
      );
      return;
    }

    const armorClass = Number(monsterForm.armorClass);
    const hitPoints = Number(monsterForm.hitPoints);

    const traits = monsterForm.traitsText.trim()
      ? monsterForm.traitsText
          .split("\n")
          .map((trait) => trait.trim())
          .filter(Boolean)
      : [];

    const actions = monsterForm.actionsText.trim()
      ? monsterForm.actionsText
          .split("\n")
          .map((action) => action.trim())
          .filter(Boolean)
      : [];

    onCreateHomebrewMonster({
      id: `homebrew-monster-${crypto.randomUUID()}`,
      name: monsterForm.name.trim(),
      source: "Homebrew",
      size: monsterForm.size,
      type: monsterForm.type,
      alignment: monsterForm.alignment.trim() || "unaligned",
      armorClass: Number.isFinite(armorClass) ? armorClass : 10,
      hitPoints: Number.isFinite(hitPoints) ? hitPoints : 10,
      hitDice: monsterForm.hitDice.trim() || "2d8",
      speed: monsterForm.speed.trim() || "30 ft.",
      challengeRating: monsterForm.challengeRating,
      proficiencyBonus: getMonsterProficiencyBonusByCr(
        monsterForm.challengeRating,
      ),
      abilities: {
        str: Number(monsterForm.abilities.str),
        dex: Number(monsterForm.abilities.dex),
        con: Number(monsterForm.abilities.con),
        int: Number(monsterForm.abilities.int),
        wis: Number(monsterForm.abilities.wis),
        cha: Number(monsterForm.abilities.cha),
      },
      senses: monsterForm.senses.trim() || "passive Perception 10",
      languages: monsterForm.languages.trim() || "—",
      traits,
      actions,
      description: monsterForm.description.trim() || "Homebrew monster/NPC.",
    });

    setMonsterForm((current) => ({
      ...current,
      name: "",
      description: "",
      traitsText: "",
      actionsText: "",
      traitName: "",
      traitDescription: "",
      actionName: "",
      actionDescription: "",
      actionDamageDice: "1d6",
      actionReachRange: "5 ft.",
    }));
  }

  return (
    <PageShell
      eyebrow="Homebrew Lab"
      title="Homebrew"
      description="Custom spell ve item üret, sonra bunları Spellbook ve Inventory içinde kullan. DM yetkisi verdik, sonuçlarına katlanacağız."
    >
      <div className="homebrew-summary-grid">
        <div className="homebrew-summary-card">
          <span className="mini-label">Custom Spells</span>
          <strong>{homebrewSpells.length}</strong>
          <p>Spellbook, Builder ve karakter detayında kullanılabilir.</p>
        </div>

        <div className="homebrew-summary-card">
          <span className="mini-label">Custom Items</span>
          <strong>{homebrewItems.length}</strong>
          <p>
            Inventory listesine karışır. Evet, artık kılıç da uydurabiliyoruz.
          </p>
        </div>
      </div>

      <div className="homebrew-layout">
        <form className="homebrew-form-card" onSubmit={handleCreateSpell}>
          <div className="homebrew-card-head">
            <div>
              <span className="mini-label">Creator V2</span>
              <h2>Custom Spell</h2>
            </div>
            <button className="primary-action" type="submit">
              Spell Kaydet
            </button>
          </div>

          <div className="form-grid">
            <label>
              Spell Name
              <input
                value={spellForm.name}
                onChange={(event) =>
                  updateSpellForm("name", event.target.value)
                }
                placeholder="Sandstorm Verdict"
              />
            </label>

            <label>
              Level
              <select
                value={spellForm.level}
                onChange={(event) =>
                  updateSpellForm("level", Number(event.target.value))
                }
              >
                <option value={0}>Cantrip</option>
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
                <option value={4}>Level 4</option>
                <option value={5}>Level 5</option>
                <option value={6}>Level 6</option>
                <option value={7}>Level 7</option>
                <option value={8}>Level 8</option>
                <option value={9}>Level 9</option>
              </select>
            </label>

            <label>
              School
              <select
                value={spellForm.school}
                onChange={(event) =>
                  updateSpellForm("school", event.target.value)
                }
              >
                {SPELL_SCHOOL_OPTIONS.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Effect Type
              <select
                value={spellForm.effectType}
                onChange={(event) =>
                  updateSpellForm("effectType", event.target.value)
                }
              >
                {SPELL_EFFECT_OPTIONS.map((effect) => (
                  <option key={effect} value={effect}>
                    {effect}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Casting Time
              <input
                value={spellForm.castingTime}
                onChange={(event) =>
                  updateSpellForm("castingTime", event.target.value)
                }
                placeholder="1 action"
              />
            </label>

            <label>
              Range
              <input
                value={spellForm.range}
                onChange={(event) =>
                  updateSpellForm("range", event.target.value)
                }
                placeholder="60 feet"
              />
            </label>

            <label>
              Duration
              <input
                value={spellForm.duration}
                onChange={(event) =>
                  updateSpellForm("duration", event.target.value)
                }
                placeholder="Instantaneous"
              />
            </label>

            <label>
              Components
              <input
                value={spellForm.componentsText}
                onChange={(event) =>
                  updateSpellForm("componentsText", event.target.value)
                }
                placeholder="V, S, M"
              />
            </label>
          </div>

          <div className="homebrew-builder-block">
            <span className="mini-label">Classes</span>
            <div className="homebrew-choice-grid">
              {SPELL_CLASS_OPTIONS.map((className) => (
                <label className="homebrew-check-card" key={className}>
                  <input
                    type="checkbox"
                    checked={spellForm.classes.includes(className)}
                    onChange={() => toggleSpellClass(className)}
                  />
                  {className}
                </label>
              ))}
            </div>
          </div>

          <div className="homebrew-builder-block">
            <span className="mini-label">Effect Builder</span>
            <div className="form-grid compact-form-grid">
              <label>
                Resolution
                <select
                  value={spellForm.attackType}
                  onChange={(event) =>
                    updateSpellForm("attackType", event.target.value)
                  }
                >
                  {ATTACK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {spellForm.attackType === "saving-throw" ? (
                <label>
                  Save Ability
                  <select
                    value={spellForm.saveAbility}
                    onChange={(event) =>
                      updateSpellForm("saveAbility", event.target.value)
                    }
                  >
                    {SAVE_ABILITY_OPTIONS.map((ability) => (
                      <option key={ability} value={ability}>
                        {ability.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label>
                Damage Dice
                <input
                  value={spellForm.damageDice}
                  onChange={(event) =>
                    updateSpellForm("damageDice", event.target.value)
                  }
                  placeholder="2d8"
                />
              </label>

              <label>
                Damage Type
                <select
                  value={spellForm.damageType}
                  onChange={(event) =>
                    updateSpellForm("damageType", event.target.value)
                  }
                >
                  {DAMAGE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Healing Dice
                <input
                  value={spellForm.healingDice}
                  onChange={(event) =>
                    updateSpellForm("healingDice", event.target.value)
                  }
                  placeholder="1d8 + spellcasting mod"
                />
              </label>

              <label>
                Condition Effect
                <select
                  value={spellForm.conditionEffect}
                  onChange={(event) =>
                    updateSpellForm("conditionEffect", event.target.value)
                  }
                >
                  <option value="">No condition</option>
                  {CONDITION_EFFECT_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="homebrew-effect-preview">
              <strong>Effect Preview</strong>
              <span>{getSpellEffectSummary()}</span>
            </div>
          </div>

          <div className="homebrew-toggle-row">
            <label>
              <input
                type="checkbox"
                checked={spellForm.concentration}
                onChange={(event) =>
                  updateSpellForm("concentration", event.target.checked)
                }
              />
              Concentration
            </label>

            <label>
              <input
                type="checkbox"
                checked={spellForm.ritual}
                onChange={(event) =>
                  updateSpellForm("ritual", event.target.checked)
                }
              />
              Ritual
            </label>
          </div>

          <label>
            Description
            <textarea
              value={spellForm.description}
              onChange={(event) =>
                updateSpellForm("description", event.target.value)
              }
              rows={5}
              placeholder="Spell ne yapıyor? Özel kural, hedef, alan, yan etki..."
            />
          </label>

          <label>
            Higher Levels
            <textarea
              value={spellForm.higherLevels}
              onChange={(event) =>
                updateSpellForm("higherLevels", event.target.value)
              }
              rows={3}
              placeholder="Higher level cast açıklaması varsa buraya. Yoksa boş bırak."
            />
          </label>
        </form>

        <form className="homebrew-form-card" onSubmit={handleCreateItem}>
          <div className="homebrew-card-head">
            <div>
              <span className="mini-label">Creator V2</span>
              <h2>Custom Item</h2>
            </div>
            <button className="primary-action" type="submit">
              Item Kaydet
            </button>
          </div>

          <div className="form-grid">
            <label>
              Item Name
              <input
                value={itemForm.name}
                onChange={(event) => updateItemForm("name", event.target.value)}
                placeholder="Shirodai Blade"
              />
            </label>

            <label>
              Category
              <select
                value={itemForm.category}
                onChange={(event) =>
                  updateItemForm(
                    "category",
                    event.target.value as DndItemData["category"],
                  )
                }
              >
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="shield">Shield</option>
                <option value="gear">Gear</option>
              </select>
            </label>

            <label>
              Cost
              <input
                value={itemForm.cost}
                onChange={(event) => updateItemForm("cost", event.target.value)}
                placeholder="50 gp"
              />
            </label>

            <label>
              Weight
              <input
                type="number"
                min={0}
                value={itemForm.weight}
                onChange={(event) =>
                  updateItemForm("weight", Number(event.target.value))
                }
              />
            </label>
          </div>

          {itemForm.category === "armor" ? (
            <div className="form-grid compact-form-grid">
              <label>
                Armor AC
                <input
                  value={itemForm.armorClass}
                  onChange={(event) =>
                    updateItemForm("armorClass", event.target.value)
                  }
                  placeholder="12"
                />
              </label>

              <label>
                Armor Type
                <select
                  value={itemForm.armorType}
                  onChange={(event) =>
                    updateItemForm("armorType", event.target.value)
                  }
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </label>

              <label>
                Dex Bonus Max
                <input
                  value={itemForm.dexBonusMax}
                  onChange={(event) =>
                    updateItemForm("dexBonusMax", event.target.value)
                  }
                  placeholder="2"
                />
              </label>
            </div>
          ) : null}

          {itemForm.category === "shield" ? (
            <label>
              AC Bonus
              <input
                value={itemForm.armorClassBonus}
                onChange={(event) =>
                  updateItemForm("armorClassBonus", event.target.value)
                }
                placeholder="2"
              />
            </label>
          ) : null}

          {itemForm.category === "weapon" ? (
            <div className="homebrew-builder-block">
              <div className="form-grid compact-form-grid">
                <label>
                  Damage
                  <input
                    value={itemForm.damage}
                    onChange={(event) =>
                      updateItemForm("damage", event.target.value)
                    }
                    placeholder="1d8"
                  />
                </label>

                <label>
                  Damage Type
                  <select
                    value={itemForm.damageType}
                    onChange={(event) =>
                      updateItemForm("damageType", event.target.value)
                    }
                  >
                    {DAMAGE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Range
                  <input
                    value={itemForm.range}
                    onChange={(event) =>
                      updateItemForm("range", event.target.value)
                    }
                    placeholder="80/320"
                  />
                </label>
              </div>

              <span className="mini-label">Weapon Properties</span>
              <div className="homebrew-choice-grid">
                {WEAPON_PROPERTY_OPTIONS.map((property) => (
                  <label className="homebrew-check-card" key={property}>
                    <input
                      type="checkbox"
                      checked={itemForm.properties.includes(property)}
                      onChange={() => toggleItemProperty(property)}
                    />
                    {property}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <label>
            Description
            <textarea
              value={itemForm.description}
              onChange={(event) =>
                updateItemForm("description", event.target.value)
              }
              rows={5}
              placeholder="Item ne işe yarıyor? Bonus, hasar, özel kural..."
            />
          </label>
        </form>

        <form
          className="homebrew-form-card homebrew-wide-form"
          onSubmit={handleCreateMonster}
        >
          <div className="homebrew-card-head">
            <div>
              <span className="mini-label">Creator V1</span>
              <h2>Custom Monster / NPC</h2>
            </div>
            <button className="primary-action" type="submit">
              Monster Kaydet
            </button>
          </div>

          <div className="form-grid compact-form-grid">
            <label>
              Name
              <input
                value={monsterForm.name}
                onChange={(event) =>
                  updateMonsterForm("name", event.target.value)
                }
                placeholder="Sand Revenant, Royal Guard Captain..."
              />
            </label>

            <label>
              Size
              <select
                value={monsterForm.size}
                onChange={(event) =>
                  updateMonsterForm("size", event.target.value)
                }
              >
                {MONSTER_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Type
              <select
                value={monsterForm.type}
                onChange={(event) =>
                  updateMonsterForm("type", event.target.value)
                }
              >
                {MONSTER_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Alignment
              <input
                value={monsterForm.alignment}
                onChange={(event) =>
                  updateMonsterForm("alignment", event.target.value)
                }
                placeholder="lawful neutral"
              />
            </label>

            <label>
              AC
              <input
                type="number"
                min={1}
                value={monsterForm.armorClass}
                onChange={(event) =>
                  updateMonsterForm("armorClass", Number(event.target.value))
                }
              />
            </label>

            <label>
              HP
              <input
                type="number"
                min={1}
                value={monsterForm.hitPoints}
                onChange={(event) =>
                  updateMonsterForm("hitPoints", Number(event.target.value))
                }
              />
            </label>

            <label>
              Hit Dice
              <input
                value={monsterForm.hitDice}
                onChange={(event) =>
                  updateMonsterForm("hitDice", event.target.value)
                }
                placeholder="4d8+4"
              />
            </label>

            <label>
              CR
              <select
                value={monsterForm.challengeRating}
                onChange={(event) =>
                  updateMonsterForm("challengeRating", event.target.value)
                }
              >
                {MONSTER_CR_OPTIONS.map((cr) => (
                  <option key={cr} value={cr}>
                    CR {cr}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="monster-ability-grid homebrew-ability-editor">
            {Object.entries(monsterForm.abilities).map(([ability, score]) => (
              <label key={ability}>
                <span>{ability.toUpperCase()}</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(event) =>
                    updateMonsterAbility(
                      ability as keyof typeof monsterForm.abilities,
                      Number(event.target.value),
                    )
                  }
                />
                <em>{formatMonsterModifier(score)}</em>
              </label>
            ))}
          </div>

          <div className="form-grid compact-form-grid">
            <label>
              Speed
              <input
                value={monsterForm.speed}
                onChange={(event) =>
                  updateMonsterForm("speed", event.target.value)
                }
                placeholder="30 ft., fly 40 ft."
              />
            </label>

            <label>
              Senses
              <input
                value={monsterForm.senses}
                onChange={(event) =>
                  updateMonsterForm("senses", event.target.value)
                }
                placeholder="darkvision 60 ft., passive Perception 12"
              />
            </label>

            <label>
              Languages
              <input
                value={monsterForm.languages}
                onChange={(event) =>
                  updateMonsterForm("languages", event.target.value)
                }
                placeholder="Common, Draconic"
              />
            </label>
          </div>

          <div className="homebrew-builder-block monster-builder-block">
            <div className="homebrew-card-head inline-head">
              <div>
                <span className="mini-label">Trait Builder</span>
                <h3>Trait Ekle</h3>
              </div>
              <button type="button" onClick={addMonsterTraitFromBuilder}>
                Trait Ekle
              </button>
            </div>

            <div className="form-grid compact-form-grid">
              <label>
                Trait Name
                <input
                  value={monsterForm.traitName}
                  onChange={(event) =>
                    updateMonsterForm("traitName", event.target.value)
                  }
                  placeholder="Pack Tactics"
                />
              </label>

              <label>
                Trait Description
                <input
                  value={monsterForm.traitDescription}
                  onChange={(event) =>
                    updateMonsterForm("traitDescription", event.target.value)
                  }
                  placeholder="The creature has advantage..."
                />
              </label>
            </div>
          </div>

          <div className="homebrew-builder-block monster-builder-block">
            <div className="homebrew-card-head inline-head">
              <div>
                <span className="mini-label">Action Builder</span>
                <h3>Attack / Action Ekle</h3>
              </div>
              <button type="button" onClick={addMonsterActionFromBuilder}>
                Action Ekle
              </button>
            </div>

            <div className="form-grid compact-form-grid">
              <label>
                Action Name
                <input
                  value={monsterForm.actionName}
                  onChange={(event) =>
                    updateMonsterForm("actionName", event.target.value)
                  }
                  placeholder="Scimitar, Sand Burst..."
                />
              </label>

              <label>
                Action Type
                <select
                  value={monsterForm.actionAttackType}
                  onChange={(event) =>
                    updateMonsterForm("actionAttackType", event.target.value)
                  }
                >
                  <option value="melee-weapon">Melee Weapon Attack</option>
                  <option value="ranged-weapon">Ranged Weapon Attack</option>
                  <option value="melee-spell">Melee Spell Attack</option>
                  <option value="ranged-spell">Ranged Spell Attack</option>
                  <option value="utility">Utility / Special</option>
                </select>
              </label>

              <label>
                Ability
                <select
                  value={monsterForm.actionAbility}
                  onChange={(event) =>
                    updateMonsterForm("actionAbility", event.target.value)
                  }
                >
                  {SAVE_ABILITY_OPTIONS.map((ability) => (
                    <option key={ability} value={ability}>
                      {ability.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Damage Dice
                <input
                  value={monsterForm.actionDamageDice}
                  onChange={(event) =>
                    updateMonsterForm("actionDamageDice", event.target.value)
                  }
                  placeholder="1d6+2"
                />
              </label>

              <label>
                Damage Type
                <select
                  value={monsterForm.actionDamageType}
                  onChange={(event) =>
                    updateMonsterForm("actionDamageType", event.target.value)
                  }
                >
                  {DAMAGE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Reach / Range
                <input
                  value={monsterForm.actionReachRange}
                  onChange={(event) =>
                    updateMonsterForm("actionReachRange", event.target.value)
                  }
                  placeholder="5 ft. veya 80/320 ft."
                />
              </label>
            </div>

            <label>
              Action Extra Text
              <textarea
                value={monsterForm.actionDescription}
                onChange={(event) =>
                  updateMonsterForm("actionDescription", event.target.value)
                }
                rows={3}
                placeholder="Hit sonrası ekstra efekt, save, prone, grapple..."
              />
            </label>

            <div className="homebrew-effect-preview">
              <strong>Action Preview</strong>
              <span>{buildMonsterActionLine()}</span>
            </div>
          </div>

          <label>
            Traits
            <textarea
              value={monsterForm.traitsText}
              onChange={(event) =>
                updateMonsterForm("traitsText", event.target.value)
              }
              rows={4}
              placeholder="Her satıra bir trait: Pack Tactics. ..., Sunlight Sensitivity. ..."
            />
          </label>

          <label>
            Actions
            <textarea
              value={monsterForm.actionsText}
              onChange={(event) =>
                updateMonsterForm("actionsText", event.target.value)
              }
              rows={5}
              placeholder="Her satıra bir action: Scimitar. Melee Weapon Attack... Hit: 1d6+2 slashing damage."
            />
          </label>

          <label>
            Description
            <textarea
              value={monsterForm.description}
              onChange={(event) =>
                updateMonsterForm("description", event.target.value)
              }
              rows={4}
              placeholder="Lore, taktik, masadaki rolü..."
            />
          </label>
        </form>
      </div>

      <div className="homebrew-created-grid">
        <section className="homebrew-created-card">
          <div className="homebrew-card-head">
            <div>
              <span className="mini-label">Saved</span>
              <h2>Custom Spells</h2>
            </div>
          </div>

          {homebrewSpells.length === 0 ? (
            <div className="empty-panel compact-empty">
              <h2>Spell yok.</h2>
              <p>DM henüz gerçeklik yasalarını bozmadı. Nadiren güzel.</p>
            </div>
          ) : (
            <div className="homebrew-list">
              {homebrewSpells.map((spell) => (
                <article className="homebrew-list-item" key={spell.id}>
                  <div>
                    <span className="mini-label">
                      {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} •{" "}
                      {spell.school}
                    </span>
                    <h3>{spell.name}</h3>
                    <p>{spell.description}</p>
                    <div className="library-pill-row">
                      <span>{spell.classes.join(", ") || "No class"}</span>
                      {spell.concentration ? <span>Concentration</span> : null}
                      {spell.ritual ? <span>Ritual</span> : null}
                      {spell.damageDice ? (
                        <span>
                          {spell.damageDice} {spell.damageType}
                        </span>
                      ) : null}
                      {spell.healingDice ? (
                        <span>Heal {spell.healingDice}</span>
                      ) : null}
                      {spell.conditionEffect ? (
                        <span>{spell.conditionEffect}</span>
                      ) : null}
                    </div>
                  </div>

                  <button onClick={() => onDeleteHomebrewSpell(spell.id)}>
                    Sil
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="homebrew-created-card">
          <div className="homebrew-card-head">
            <div>
              <span className="mini-label">Saved</span>
              <h2>Custom Items</h2>
            </div>
          </div>

          {homebrewItems.length === 0 ? (
            <div className="empty-panel compact-empty">
              <h2>Item yok.</h2>
              <p>Çanta boş. Maceracı için utanç, performans için avantaj.</p>
            </div>
          ) : (
            <div className="homebrew-list">
              {homebrewItems.map((item) => (
                <article className="homebrew-list-item" key={item.id}>
                  <div>
                    <span className="mini-label">
                      {item.category} • {item.weight} lb
                    </span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="library-pill-row">
                      <span>{item.cost}</span>
                      {item.damage ? (
                        <span>
                          {item.damage} {item.damageType}
                        </span>
                      ) : null}
                      {item.armorClass ? (
                        <span>AC {item.armorClass}</span>
                      ) : null}
                      {item.armorClassBonus ? (
                        <span>AC +{item.armorClassBonus}</span>
                      ) : null}
                      {item.properties?.map((property) => (
                        <span key={property}>{property}</span>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => onDeleteHomebrewItem(item.id)}>
                    Sil
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="homebrew-created-card">
          <div className="homebrew-card-head">
            <div>
              <span className="mini-label">Saved</span>
              <h2>Custom Monsters / NPCs</h2>
            </div>
          </div>

          {homebrewMonsters.length === 0 ? (
            <div className="empty-panel compact-empty">
              <h2>Monster yok.</h2>
              <p>
                Henüz kimseyi oyuncuların üstüne salmadık. Nadir bir barış anı.
              </p>
            </div>
          ) : (
            <div className="homebrew-list">
              {homebrewMonsters.map((monster) => (
                <article className="homebrew-list-item" key={monster.id}>
                  <div>
                    <span className="mini-label">
                      {monster.size} {monster.type} • CR{" "}
                      {monster.challengeRating}
                    </span>
                    <h3>{monster.name}</h3>
                    <p>{monster.description}</p>
                    <div className="library-pill-row">
                      <span>AC {monster.armorClass}</span>
                      <span>HP {monster.hitPoints}</span>
                      <span>{monster.hitDice}</span>
                      <span>PB +{monster.proficiencyBonus}</span>
                      <span>{monster.source ?? "Homebrew"}</span>
                    </div>
                  </div>

                  <button onClick={() => onDeleteHomebrewMonster(monster.id)}>
                    Sil
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function App() {
  const [characters, setCharacters] = useState<Character[]>(() =>
    loadCharacters(),
  );

  const [rulesetData, setRulesetData] = useState<RulesetData | null>(null);
  const [isRulesetLoading, setIsRulesetLoading] = useState(true);
  const [rulesetError, setRulesetError] = useState<string | null>(null);

  const [homebrewSpells, setHomebrewSpells] = useState<DndSpellData[]>(() =>
    loadHomebrewSpells(),
  );
  const [homebrewItems, setHomebrewItems] = useState<DndItemData[]>(() =>
    loadHomebrewItems(),
  );
  const [homebrewMonsters, setHomebrewMonsters] = useState<DndMonsterData[]>(
    () => loadHomebrewMonsters(),
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadCampaigns());

  const effectiveRulesetData = useMemo<RulesetData | null>(() => {
    if (!rulesetData) {
      return null;
    }

    return {
      ...rulesetData,
      spells: [...rulesetData.spells, ...homebrewSpells],
      items: [...rulesetData.items, ...homebrewItems],
      monsters: [...rulesetData.monsters, ...homebrewMonsters],
    };
  }, [rulesetData, homebrewSpells, homebrewItems, homebrewMonsters]);

  useEffect(() => {
    let isMounted = true;

    async function loadRulesetData() {
      try {
        const data = await loadDnd2014Ruleset();

        if (isMounted) {
          setRulesetData(data);
          setRulesetError(null);
        }
      } catch (error) {
        if (isMounted) {
          setRulesetError(
            error instanceof Error
              ? error.message
              : "Ruleset data yüklenemedi.",
          );
        }
      } finally {
        if (isMounted) {
          setIsRulesetLoading(false);
        }
      }
    }

    loadRulesetData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    saveCharacters(characters);
  }, [characters]);

  useEffect(() => {
    saveHomebrewSpells(homebrewSpells);
  }, [homebrewSpells]);

  useEffect(() => {
    saveHomebrewItems(homebrewItems);
  }, [homebrewItems]);

  useEffect(() => {
    saveHomebrewMonsters(homebrewMonsters);
  }, [homebrewMonsters]);

  useEffect(() => {
    saveCampaigns(campaigns);
  }, [campaigns]);

  function handleCreateCharacter(draft: CharacterDraft) {
    const character = createCharacterFromDraft(draft);
    setCharacters((current) => [character, ...current]);
  }

  function handleUpdateCharacter(updatedCharacter: Character) {
    setCharacters((current) =>
      current.map((character) =>
        character.id === updatedCharacter.id ? updatedCharacter : character,
      ),
    );
  }

  function handleDeleteCharacter(id: string): boolean {
    const character = characters.find((item) => item.id === id);

    if (!character) {
      return false;
    }

    const confirmed = confirm(`${character.name} silinsin mi? Geri dönüş yok.`);

    if (!confirmed) {
      return false;
    }

    setCharacters((current) => current.filter((item) => item.id !== id));
    return true;
  }

  function handleImportCharacters(importedCharacters: Character[]) {
    setCharacters(importedCharacters);
  }

  function handleWipeCharacters() {
    setCharacters([]);
  }

  function handleCreateCampaign(name: string, description: string) {
    const now = new Date().toISOString();

    setCampaigns((current) => [
      {
        id: crypto.randomUUID(),
        name,
        description,
        characterIds: [],
        sessionNotes: [],
        npcNotes: [],
        quests: [],
        encounters: [],
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ]);
  }

  function handleUpdateCampaign(updatedCampaign: Campaign) {
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign,
      ),
    );
  }

  function handleDeleteCampaign(id: string) {
    const campaign = campaigns.find((item) => item.id === id);

    if (!campaign) {
      return;
    }

    const confirmed = confirm(
      `${campaign.name} silinsin mi? Campaign mezarlığına uğurluyoruz.`,
    );

    if (!confirmed) {
      return;
    }

    setCampaigns((current) => current.filter((item) => item.id !== id));
  }

  function handleCreateHomebrewSpell(spell: DndSpellData) {
    setHomebrewSpells((current) => [spell, ...current]);
  }

  function handleDeleteHomebrewSpell(id: string) {
    const confirmed = confirm(
      "Bu custom spell silinsin mi? Evren biraz sadeleşecek.",
    );

    if (!confirmed) {
      return;
    }

    setHomebrewSpells((current) => current.filter((spell) => spell.id !== id));
  }

  function handleCreateHomebrewItem(item: DndItemData) {
    setHomebrewItems((current) => [item, ...current]);
  }

  function handleDeleteHomebrewItem(id: string) {
    const confirmed = confirm(
      "Bu custom item silinsin mi? Çanta biraz hafifleyecek.",
    );

    if (!confirmed) {
      return;
    }

    setHomebrewItems((current) => current.filter((item) => item.id !== id));
  }

  function handleCreateHomebrewMonster(monster: DndMonsterData) {
    setHomebrewMonsters((current) => [monster, ...current]);
  }

  function handleDeleteHomebrewMonster(id: string) {
    const confirmed = confirm(
      "Bu custom monster/NPC silinsin mi? Oyuncular kısa süreliğine güvende kalacak.",
    );

    if (!confirmed) {
      return;
    }

    setHomebrewMonsters((current) =>
      current.filter((monster) => monster.id !== id),
    );
  }

  return (
    <div className="app">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">E4</div>

          <div>
            <strong>E4 D&D</strong>
            <span>Everything for D&D</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/characters"
            element={
              <Characters
                characters={characters}
                onDeleteCharacter={handleDeleteCharacter}
              />
            }
          />

          <Route
            path="/characters/:characterId/edit"
            element={
              <CharacterEditor
                characters={characters}
                rulesetData={effectiveRulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
                onUpdateCharacter={handleUpdateCharacter}
              />
            }
          />

          <Route
            path="/characters/:characterId"
            element={
              <CharacterDetail
                characters={characters}
                rulesetData={effectiveRulesetData}
                onUpdateCharacter={handleUpdateCharacter}
                onDeleteCharacter={handleDeleteCharacter}
              />
            }
          />

          <Route
            path="/builder"
            element={
              <Builder
                onCreateCharacter={handleCreateCharacter}
                rulesetData={effectiveRulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />

          <Route path="/play-mode" element={<PlayMode />} />
          <Route path="/dice" element={<Dice />} />
          <Route
            path="/spellbook"
            element={
              <Spellbook
                rulesetData={effectiveRulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />
          <Route
            path="/monsters/:monsterId"
            element={
              <MonsterDetail
                rulesetData={effectiveRulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />

          <Route
            path="/monsters"
            element={
              <MonsterLibrary
                rulesetData={effectiveRulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />

          <Route
            path="/inventory"
            element={
              <Inventory
                rulesetData={effectiveRulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />

          <Route
            path="/campaigns"
            element={
              <Campaigns
                characters={characters}
                campaigns={campaigns}
                rulesetData={effectiveRulesetData}
                onCreateCampaign={handleCreateCampaign}
                onUpdateCampaign={handleUpdateCampaign}
                onDeleteCampaign={handleDeleteCampaign}
              />
            }
          />

          <Route
            path="/backup"
            element={
              <DataBackup
                characters={characters}
                onImportCharacters={handleImportCharacters}
                onWipeCharacters={handleWipeCharacters}
              />
            }
          />
          <Route
            path="/library"
            element={
              <Library
                rulesetData={effectiveRulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />
          <Route
            path="/homebrew-lab"
            element={
              <HomebrewLab
                homebrewSpells={homebrewSpells}
                homebrewItems={homebrewItems}
                homebrewMonsters={homebrewMonsters}
                onCreateHomebrewSpell={handleCreateHomebrewSpell}
                onDeleteHomebrewSpell={handleDeleteHomebrewSpell}
                onCreateHomebrewItem={handleCreateHomebrewItem}
                onDeleteHomebrewItem={handleDeleteHomebrewItem}
                onCreateHomebrewMonster={handleCreateHomebrewMonster}
                onDeleteHomebrewMonster={handleDeleteHomebrewMonster}
              />
            }
          />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              isActive ? "bottom-item active" : "bottom-item"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default App;
