import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import { motion } from "framer-motion";
import type { DiceRollResult } from "../../core/dice/dice.types";
import { rollDice } from "../../core/dice/diceRoller";
import type { DndItemData, DndSpellData, RulesetData } from "../../core/rulesets/ruleset.types";
import { loadDnd2014Ruleset } from "../../core/rulesets/rulesetLoader";

import type { Character, CharacterDraft } from "../../core/character/character.types";
import { getProficiencyBonus } from "../../core/character/characterCalculator";
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
import { getItemCategoryLabel, getItemRulesSummary } from "../characters/characterShared";


type CampaignNote = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type CampaignNpc = {
  id: string;
  name: string;
  role: string;
  notes: string;
  createdAt: string;
};

type CampaignQuest = {
  id: string;
  title: string;
  status: "active" | "completed" | "failed";
  notes: string;
  createdAt: string;
};

type Campaign = {
  id: string;
  name: string;
  description: string;
  characterIds: string[];
  sessionNotes: CampaignNote[];
  npcNotes: CampaignNpc[];
  quests: CampaignQuest[];
  createdAt: string;
  updatedAt: string;
};

const CAMPAIGNS_STORAGE_KEY = "e4_dnd_campaigns_v1";

function loadCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((campaign) => ({
      id: typeof campaign.id === "string" ? campaign.id : crypto.randomUUID(),
      name: typeof campaign.name === "string" ? campaign.name : "Unnamed Campaign",
      description:
        typeof campaign.description === "string" ? campaign.description : "",
      characterIds: Array.isArray(campaign.characterIds)
        ? campaign.characterIds.filter((id: unknown) => typeof id === "string")
        : [],
      sessionNotes: Array.isArray(campaign.sessionNotes)
        ? campaign.sessionNotes
        : [],
      npcNotes: Array.isArray(campaign.npcNotes) ? campaign.npcNotes : [],
      quests: Array.isArray(campaign.quests) ? campaign.quests : [],
      createdAt:
        typeof campaign.createdAt === "string"
          ? campaign.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof campaign.updatedAt === "string"
          ? campaign.updatedAt
          : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function saveCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
}




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
  const [categoryFilter, setCategoryFilter] = useState<"all" | DndItemData["category"]>("all");

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (rulesetData?.items ?? []).filter((item) => {
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
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
                  setCategoryFilter(event.target.value as "all" | DndItemData["category"])
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
              <p>Arama yine evrenin anlamını kaçırdı. Daha yumuşak filtre dene.</p>
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
                      <span className="mini-label">{getItemCategoryLabel(item.category)}</span>
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
                    {item.properties?.length ? <span>{item.properties.join(", ")}</span> : null}
                    {item.tags?.length ? <span>{item.tags.join(", ")}</span> : null}
                    {item.stealthDisadvantage ? <span>Stealth Disadvantage</span> : null}
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

function parseTextList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}


function Campaigns({
  characters,
  campaigns,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
}: {
  characters: Character[];
  campaigns: Campaign[];
  onCreateCampaign: (name: string, description: string) => void;
  onUpdateCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns[0]?.id ?? null,
  );
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionBody, setSessionBody] = useState("");
  const [npcName, setNpcName] = useState("");
  const [npcRole, setNpcRole] = useState("");
  const [npcNotes, setNpcNotes] = useState("");
  const [questTitle, setQuestTitle] = useState("");
  const [questNotes, setQuestNotes] = useState("");

  useEffect(() => {
    if (!selectedCampaignId && campaigns[0]) {
      setSelectedCampaignId(campaigns[0].id);
      return;
    }

    if (
      selectedCampaignId &&
      !campaigns.some((campaign) => campaign.id === selectedCampaignId)
    ) {
      setSelectedCampaignId(campaigns[0]?.id ?? null);
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  );

  const partyCharacters = useMemo(() => {
    if (!selectedCampaign) {
      return [];
    }

    return selectedCampaign.characterIds
      .map((id) => characters.find((character) => character.id === id))
      .filter((character): character is Character => Boolean(character));
  }, [characters, selectedCampaign]);

  const partySummary = useMemo(() => {
    const totalHp = partyCharacters.reduce(
      (sum, character) => sum + character.currentHp,
      0,
    );
    const totalMaxHp = partyCharacters.reduce(
      (sum, character) => sum + character.maxHp,
      0,
    );
    const averageLevel =
      partyCharacters.length === 0
        ? 0
        : partyCharacters.reduce((sum, character) => sum + character.level, 0) /
          partyCharacters.length;

    return {
      totalHp,
      totalMaxHp,
      averageLevel,
    };
  }, [partyCharacters]);

  function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newCampaignName.trim()) {
      alert("Campaign adı lazım kankam. Adsız kampanya biraz vergi dairesi dosyası gibi duruyor.");
      return;
    }

    onCreateCampaign(newCampaignName.trim(), newCampaignDescription.trim());
    setNewCampaignName("");
    setNewCampaignDescription("");
  }

  function toggleCampaignCharacter(characterId: string) {
    if (!selectedCampaign) {
      return;
    }

    const hasCharacter = selectedCampaign.characterIds.includes(characterId);

    onUpdateCampaign({
      ...selectedCampaign,
      characterIds: hasCharacter
        ? selectedCampaign.characterIds.filter((id) => id !== characterId)
        : [...selectedCampaign.characterIds, characterId],
      updatedAt: new Date().toISOString(),
    });
  }

  function addSessionNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCampaign || !sessionTitle.trim()) {
      return;
    }

    const now = new Date().toISOString();

    onUpdateCampaign({
      ...selectedCampaign,
      sessionNotes: [
        {
          id: crypto.randomUUID(),
          title: sessionTitle.trim(),
          body: sessionBody.trim(),
          createdAt: now,
        },
        ...selectedCampaign.sessionNotes,
      ],
      updatedAt: now,
    });

    setSessionTitle("");
    setSessionBody("");
  }

  function addNpc(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCampaign || !npcName.trim()) {
      return;
    }

    const now = new Date().toISOString();

    onUpdateCampaign({
      ...selectedCampaign,
      npcNotes: [
        {
          id: crypto.randomUUID(),
          name: npcName.trim(),
          role: npcRole.trim() || "NPC",
          notes: npcNotes.trim(),
          createdAt: now,
        },
        ...selectedCampaign.npcNotes,
      ],
      updatedAt: now,
    });

    setNpcName("");
    setNpcRole("");
    setNpcNotes("");
  }

  function addQuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCampaign || !questTitle.trim()) {
      return;
    }

    const now = new Date().toISOString();

    onUpdateCampaign({
      ...selectedCampaign,
      quests: [
        {
          id: crypto.randomUUID(),
          title: questTitle.trim(),
          status: "active",
          notes: questNotes.trim(),
          createdAt: now,
        },
        ...selectedCampaign.quests,
      ],
      updatedAt: now,
    });

    setQuestTitle("");
    setQuestNotes("");
  }

  function updateQuestStatus(
    questId: string,
    status: CampaignQuest["status"],
  ) {
    if (!selectedCampaign) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      quests: selectedCampaign.quests.map((quest) =>
        quest.id === questId ? { ...quest, status } : quest,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function removeFromCampaign(collection: "sessionNotes" | "npcNotes" | "quests", id: string) {
    if (!selectedCampaign) {
      return;
    }

    onUpdateCampaign({
      ...selectedCampaign,
      [collection]: selectedCampaign[collection].filter((item) => item.id !== id),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <PageShell
      eyebrow="Campaign Command Center"
      title="Campaigns"
      description="Parti, session notları, NPC kayıtları ve quest takibi. DM kaosunu en azından kartlara ayırıyoruz. Medeniyet dediğin bu kadar kırılgan."
    >
      <div className="campaign-layout">
        <aside className="campaign-sidebar-card">
          <form className="campaign-create-form" onSubmit={createCampaign}>
            <span className="mini-label">New Campaign</span>
            <input
              value={newCampaignName}
              onChange={(event) => setNewCampaignName(event.target.value)}
              placeholder="Alabasta Arc"
            />
            <textarea
              value={newCampaignDescription}
              onChange={(event) =>
                setNewCampaignDescription(event.target.value)
              }
              placeholder="Kampanya kısa açıklaması..."
              rows={3}
            />
            <button className="primary-action" type="submit">
              Campaign Oluştur
            </button>
          </form>

          <div className="campaign-list">
            {campaigns.length === 0 ? (
              <div className="empty-panel compact-empty">
                <h2>Campaign yok.</h2>
                <p>Henüz kimse dünyayı kurtarmaya kalkmamış. Şaşırtıcı ölçüde huzurlu.</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <button
                  className={
                    campaign.id === selectedCampaignId
                      ? "campaign-list-item active"
                      : "campaign-list-item"
                  }
                  key={campaign.id}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                >
                  <strong>{campaign.name}</strong>
                  <span>{campaign.characterIds.length} karakter</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {!selectedCampaign ? (
          <div className="empty-panel campaign-empty-main">
            <h2>Bir campaign seç.</h2>
            <p>Sol taraftan kampanya oluştur veya seç. Evet, organizasyon diye bir kavram hâlâ var.</p>
          </div>
        ) : (
          <div className="campaign-main">
            <section className="campaign-hero-card">
              <div>
                <span className="mini-label">Active Campaign</span>
                <h2>{selectedCampaign.name}</h2>
                <p>
                  {selectedCampaign.description ||
                    "Açıklama yok. Gizemli kampanya mı, unutkan DM mi, bunu tarih yazacak."}
                </p>
              </div>

              <button
                className="danger-action"
                onClick={() => onDeleteCampaign(selectedCampaign.id)}
              >
                Campaign Sil
              </button>
            </section>

            <section className="campaign-stat-grid">
              <div>
                <span>Party Size</span>
                <strong>{partyCharacters.length}</strong>
              </div>
              <div>
                <span>Party HP</span>
                <strong>
                  {partySummary.totalHp}/{partySummary.totalMaxHp}
                </strong>
              </div>
              <div>
                <span>Average Level</span>
                <strong>{partySummary.averageLevel.toFixed(1)}</strong>
              </div>
              <div>
                <span>Active Quests</span>
                <strong>
                  {
                    selectedCampaign.quests.filter(
                      (quest) => quest.status === "active",
                    ).length
                  }
                </strong>
              </div>
            </section>

            <section className="campaign-card">
              <div className="campaign-section-head">
                <div>
                  <span className="mini-label">Party</span>
                  <h2>Karakterleri Bağla</h2>
                </div>
              </div>

              {characters.length === 0 ? (
                <div className="empty-panel compact-empty">
                  <h2>Karakter yok.</h2>
                  <p>Önce karakter oluştur. Parti boşsa macera da biraz PowerPoint sunumu gibi kalıyor.</p>
                </div>
              ) : (
                <div className="campaign-character-grid">
                  {characters.map((character) => {
                    const selected = selectedCampaign.characterIds.includes(
                      character.id,
                    );

                    return (
                      <button
                        className={
                          selected
                            ? "campaign-character-pill active"
                            : "campaign-character-pill"
                        }
                        key={character.id}
                        onClick={() => toggleCampaignCharacter(character.id)}
                      >
                        <strong>{character.name}</strong>
                        <span>
                          Lv. {character.level} • {character.className || "Class yok"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="campaign-grid-two">
              <section className="campaign-card">
                <div className="campaign-section-head">
                  <div>
                    <span className="mini-label">Party Dashboard</span>
                    <h2>Aktif Parti</h2>
                  </div>
                </div>

                {partyCharacters.length === 0 ? (
                  <div className="empty-panel compact-empty">
                    <h2>Parti boş.</h2>
                    <p>Henüz kimse bu felakete dahil edilmemiş.</p>
                  </div>
                ) : (
                  <div className="party-character-list">
                    {partyCharacters.map((character) => (
                      <article className="party-character-card" key={character.id}>
                        <div>
                          <strong>{character.name}</strong>
                          <span>
                            {character.race || "Race yok"} • {character.className || "Class yok"}
                          </span>
                        </div>
                        <div>
                          <b>HP {character.currentHp}/{character.maxHp}</b>
                          <span>AC {character.armorClass} • PB +{getProficiencyBonus(character.level)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="campaign-card">
                <form className="campaign-mini-form" onSubmit={addSessionNote}>
                  <div className="campaign-section-head">
                    <div>
                      <span className="mini-label">Session Notes</span>
                      <h2>Oturum Notu</h2>
                    </div>
                    <button type="submit">Ekle</button>
                  </div>
                  <input
                    value={sessionTitle}
                    onChange={(event) => setSessionTitle(event.target.value)}
                    placeholder="Session 4 - Rainbase"
                  />
                  <textarea
                    value={sessionBody}
                    onChange={(event) => setSessionBody(event.target.value)}
                    placeholder="Bu oturumda ne oldu? Kim kimi kandırdı? Kim gereksiz risk aldı?"
                    rows={4}
                  />
                </form>

                <div className="campaign-note-list">
                  {selectedCampaign.sessionNotes.map((note) => (
                    <article className="campaign-note-card" key={note.id}>
                      <div>
                        <strong>{note.title}</strong>
                        <p>{note.body || "Not boş. Minimalizm mi üşengeçlik mi, bilemedim."}</p>
                      </div>
                      <button onClick={() => removeFromCampaign("sessionNotes", note.id)}>
                        Sil
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="campaign-grid-two">
              <section className="campaign-card">
                <form className="campaign-mini-form" onSubmit={addNpc}>
                  <div className="campaign-section-head">
                    <div>
                      <span className="mini-label">NPC Notes</span>
                      <h2>NPC Ekle</h2>
                    </div>
                    <button type="submit">Ekle</button>
                  </div>
                  <div className="form-grid compact-form-grid">
                    <input
                      value={npcName}
                      onChange={(event) => setNpcName(event.target.value)}
                      placeholder="NPC adı"
                    />
                    <input
                      value={npcRole}
                      onChange={(event) => setNpcRole(event.target.value)}
                      placeholder="Rol / Ünvan"
                    />
                  </div>
                  <textarea
                    value={npcNotes}
                    onChange={(event) => setNpcNotes(event.target.value)}
                    placeholder="NPC notları, motivasyon, ses tonu, şüpheli davranışlar..."
                    rows={4}
                  />
                </form>

                <div className="campaign-note-list">
                  {selectedCampaign.npcNotes.map((npc) => (
                    <article className="campaign-note-card" key={npc.id}>
                      <div>
                        <strong>{npc.name}</strong>
                        <span>{npc.role}</span>
                        <p>{npc.notes || "Not yok. NPC de düz vatandaş çıktı, üzücü."}</p>
                      </div>
                      <button onClick={() => removeFromCampaign("npcNotes", npc.id)}>
                        Sil
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="campaign-card">
                <form className="campaign-mini-form" onSubmit={addQuest}>
                  <div className="campaign-section-head">
                    <div>
                      <span className="mini-label">Quest Tracker</span>
                      <h2>Quest Ekle</h2>
                    </div>
                    <button type="submit">Ekle</button>
                  </div>
                  <input
                    value={questTitle}
                    onChange={(event) => setQuestTitle(event.target.value)}
                    placeholder="Vivi'yi kurtar"
                  />
                  <textarea
                    value={questNotes}
                    onChange={(event) => setQuestNotes(event.target.value)}
                    placeholder="Quest detayları..."
                    rows={4}
                  />
                </form>

                <div className="campaign-note-list">
                  {selectedCampaign.quests.map((quest) => (
                    <article className="campaign-note-card" key={quest.id}>
                      <div>
                        <strong>{quest.title}</strong>
                        <span>{quest.status}</span>
                        <p>{quest.notes || "Not yok. Görev tanımı bile performans kaygısı yaşıyor."}</p>
                        <div className="quest-status-row">
                          {(["active", "completed", "failed"] as const).map(
                            (status) => (
                              <button
                                className={quest.status === status ? "active" : ""}
                                key={status}
                                onClick={() => updateQuestStatus(quest.id, status)}
                              >
                                {status}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeFromCampaign("quests", quest.id)}>
                        Sil
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
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

function HomebrewLab({
  homebrewSpells,
  homebrewItems,
  onCreateHomebrewSpell,
  onDeleteHomebrewSpell,
  onCreateHomebrewItem,
  onDeleteHomebrewItem,
}: {
  homebrewSpells: DndSpellData[];
  homebrewItems: DndItemData[];
  onCreateHomebrewSpell: (spell: DndSpellData) => void;
  onDeleteHomebrewSpell: (id: string) => void;
  onCreateHomebrewItem: (item: DndItemData) => void;
  onDeleteHomebrewItem: (id: string) => void;
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
      parts.push(`Damage: ${spellForm.damageDice.trim()} ${spellForm.damageType}`);
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
      alert("Bu büyüyü en az bir class kullanabilsin. Yoksa büyü değil, dekoratif PDF olur.");
      return;
    }

    if (!spellForm.description.trim() && !spellForm.damageDice.trim() && !spellForm.healingDice.trim()) {
      alert("Spell etkisi lazım. En az açıklama, damage ya da healing gir. Boş büyüyle evren ikna olmuyor.");
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
      damageType: spellForm.damageDice.trim() ? spellForm.damageType : undefined,
      healingDice: spellForm.healingDice.trim() || undefined,
      saveAbility:
        spellForm.attackType === "saving-throw"
          ? (spellForm.saveAbility as "str" | "dex" | "con" | "int" | "wis" | "cha")
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
      alert("Item adı lazım. Çantaya 'şey' diye item koyarsak barbar bile güler.");
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
      damage: itemForm.category === "weapon" ? itemForm.damage.trim() : undefined,
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
          <p>Inventory listesine karışır. Evet, artık kılıç da uydurabiliyoruz.</p>
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
                onChange={(event) => updateSpellForm("name", event.target.value)}
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
                onChange={(event) => updateSpellForm("school", event.target.value)}
              >
                {SPELL_SCHOOL_OPTIONS.map((school) => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
            </label>

            <label>
              Effect Type
              <select
                value={spellForm.effectType}
                onChange={(event) => updateSpellForm("effectType", event.target.value)}
              >
                {SPELL_EFFECT_OPTIONS.map((effect) => (
                  <option key={effect} value={effect}>{effect}</option>
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
                onChange={(event) => updateSpellForm("range", event.target.value)}
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
                  onChange={(event) => updateSpellForm("attackType", event.target.value)}
                >
                  {ATTACK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {spellForm.attackType === "saving-throw" ? (
                <label>
                  Save Ability
                  <select
                    value={spellForm.saveAbility}
                    onChange={(event) => updateSpellForm("saveAbility", event.target.value)}
                  >
                    {SAVE_ABILITY_OPTIONS.map((ability) => (
                      <option key={ability} value={ability}>{ability.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label>
                Damage Dice
                <input
                  value={spellForm.damageDice}
                  onChange={(event) => updateSpellForm("damageDice", event.target.value)}
                  placeholder="2d8"
                />
              </label>

              <label>
                Damage Type
                <select
                  value={spellForm.damageType}
                  onChange={(event) => updateSpellForm("damageType", event.target.value)}
                >
                  {DAMAGE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                Healing Dice
                <input
                  value={spellForm.healingDice}
                  onChange={(event) => updateSpellForm("healingDice", event.target.value)}
                  placeholder="1d8 + spellcasting mod"
                />
              </label>

              <label>
                Condition Effect
                <select
                  value={spellForm.conditionEffect}
                  onChange={(event) => updateSpellForm("conditionEffect", event.target.value)}
                >
                  <option value="">No condition</option>
                  {CONDITION_EFFECT_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
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
                onChange={(event) => updateSpellForm("ritual", event.target.checked)}
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
                    onChange={(event) => updateItemForm("damage", event.target.value)}
                    placeholder="1d8"
                  />
                </label>

                <label>
                  Damage Type
                  <select
                    value={itemForm.damageType}
                    onChange={(event) => updateItemForm("damageType", event.target.value)}
                  >
                    {DAMAGE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Range
                  <input
                    value={itemForm.range}
                    onChange={(event) => updateItemForm("range", event.target.value)}
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
                      {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} • {spell.school}
                    </span>
                    <h3>{spell.name}</h3>
                    <p>{spell.description}</p>
                    <div className="library-pill-row">
                      <span>{spell.classes.join(", ") || "No class"}</span>
                      {spell.concentration ? <span>Concentration</span> : null}
                      {spell.ritual ? <span>Ritual</span> : null}
                      {spell.damageDice ? <span>{spell.damageDice} {spell.damageType}</span> : null}
                      {spell.healingDice ? <span>Heal {spell.healingDice}</span> : null}
                      {spell.conditionEffect ? <span>{spell.conditionEffect}</span> : null}
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
                      {item.damage ? <span>{item.damage} {item.damageType}</span> : null}
                      {item.armorClass ? <span>AC {item.armorClass}</span> : null}
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
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    loadCampaigns(),
  );

  const effectiveRulesetData = useMemo<RulesetData | null>(() => {
    if (!rulesetData) {
      return null;
    }

    return {
      ...rulesetData,
      spells: [...rulesetData.spells, ...homebrewSpells],
      items: [...rulesetData.items, ...homebrewItems],
    };
  }, [rulesetData, homebrewSpells, homebrewItems]);

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

    const confirmed = confirm(`${campaign.name} silinsin mi? Campaign mezarlığına uğurluyoruz.`);

    if (!confirmed) {
      return;
    }

    setCampaigns((current) => current.filter((item) => item.id !== id));
  }


  function handleCreateHomebrewSpell(spell: DndSpellData) {
    setHomebrewSpells((current) => [spell, ...current]);
  }

  function handleDeleteHomebrewSpell(id: string) {
    const confirmed = confirm("Bu custom spell silinsin mi? Evren biraz sadeleşecek.");

    if (!confirmed) {
      return;
    }

    setHomebrewSpells((current) => current.filter((spell) => spell.id !== id));
  }

  function handleCreateHomebrewItem(item: DndItemData) {
    setHomebrewItems((current) => [item, ...current]);
  }

  function handleDeleteHomebrewItem(id: string) {
    const confirmed = confirm("Bu custom item silinsin mi? Çanta biraz hafifleyecek.");

    if (!confirmed) {
      return;
    }

    setHomebrewItems((current) => current.filter((item) => item.id !== id));
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
                onCreateHomebrewSpell={handleCreateHomebrewSpell}
                onDeleteHomebrewSpell={handleDeleteHomebrewSpell}
                onCreateHomebrewItem={handleCreateHomebrewItem}
                onDeleteHomebrewItem={handleDeleteHomebrewItem}
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
