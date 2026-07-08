import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import type { DiceRollResult } from "./core/dice/dice.types";
import { rollDice } from "./core/dice/diceRoller";
import type { RulesetData } from "./core/rulesets/ruleset.types";
import { loadDnd2014Ruleset } from "./core/rulesets/rulesetLoader";

import type {
  Character,
  CharacterDraft,
} from "./core/character/character.types";
import {
  formatModifier,
  getAbilityModifier,
  getInitiative,
  getPassivePerception,
  getProficiencyBonus,
  getSpellAttackBonus,
  getSpellSaveDc,
} from "./core/character/characterCalculator";
import {
  exportCharacters,
  loadCharacters,
  saveCharacters,
} from "./core/storage/characterStorage";
import "./App.css";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/characters", label: "Karakterler" },
  { to: "/builder", label: "Builder" },
  { to: "/play-mode", label: "Play Mode" },
  { to: "/dice", label: "Zar" },
  { to: "/backup", label: "Yedek" },
  { to: "/library", label: "Library" },
  { to: "/homebrew-lab", label: "Homebrew" },
];

const emptyDraft: CharacterDraft = {
  name: "",
  playerName: "",
  ruleset: "dnd_2014",
  race: "",
  className: "",
  subclass: "",
  background: "",
  level: 1,
  abilities: {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  },
  maxHp: 10,
  armorClass: 10,
  notes: "",
};

function createCharacterFromDraft(draft: CharacterDraft): Character {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ...draft,
    currentHp: draft.maxHp,
    tempHp: 0,
    conditions: [],
    createdAt: now,
    updatedAt: now,
  };
}

function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      className="page-shell"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
      {children}
    </motion.section>
  );
}

function Dashboard() {
  return (
    <PageShell
      eyebrow="Everything for D&D"
      title="E4 D&D"
      description="Karakter oluşturma, homebrew yönetimi ve normal oyun akışı için PWA tabanlı yeni başlangıç."
    >
      <div className="hero-grid">
        <motion.div
          className="hero-card main-hero"
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
        >
          <div className="d20-orb">D20</div>

          <h2>Yeni kampanya başlıyor.</h2>

          <p>
            Bu proje sıfırdan kuruldu. Eski dosyalar rehber olacak ama bu app
            temiz mimariyle ilerleyecek. Nihayet klasörler birbirini yemeyecek,
            en azından bugün.
          </p>

          <div className="quick-actions">
            <NavLink to="/builder" className="primary-action">
              Karakter Oluştur
            </NavLink>

            <NavLink to="/characters" className="secondary-action">
              Karakterlere Git
            </NavLink>
          </div>
        </motion.div>

        <motion.div className="status-card" whileHover={{ y: -5 }}>
          <span>v0.1 hedefi</span>
          <strong>PWA Foundation</strong>
          <p>Dashboard, karakter listesi, builder, play mode ve zar sistemi.</p>
        </motion.div>

        <motion.div className="status-card" whileHover={{ y: -5 }}>
          <span>Yayın</span>
          <strong>Web + PWA</strong>
          <p>Store yok. Kullanıcı web’den açacak, ana ekrana ekleyecek.</p>
        </motion.div>

        <motion.div className="status-card" whileHover={{ y: -5 }}>
          <span>Maliyet</span>
          <strong>0 TL başlangıç</strong>
          <p>Cloudflare Pages veya GitHub Pages ile ücretsiz yayın.</p>
        </motion.div>
      </div>
    </PageShell>
  );
}

function Characters({
  characters,
  onDeleteCharacter,
}: {
  characters: Character[];
  onDeleteCharacter: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <PageShell
      eyebrow="Character Vault"
      title="Karakterler"
      description="Kayıtlı karakterlerin burada listelenir. Şimdilik local kayıt var, cloud yok, huzur var."
    >
      {characters.length === 0 ? (
        <div className="empty-panel">
          <h2>Henüz karakter yok.</h2>
          <p>
            Builder ekranından karakter oluştur. App’in boş bakışları da
            böylece sona ersin.
          </p>
        </div>
      ) : (
        <div className="character-grid">
          {characters.map((character) => (
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

function CharacterDetail({
  characters,
  onUpdateCharacter,
}: {
  characters: Character[];
  onUpdateCharacter: (character: Character) => void;
}) {
  const { characterId } = useParams();
  const navigate = useNavigate();

  const character = characters.find((item) => item.id === characterId);

  const [characterRollHistory, setCharacterRollHistory] = useState<
    {
      id: string;
      label: string;
      notation: string;
      rolls: number[];
      total: number;
      createdAt: string;
    }[]
  >([]);

  if (!character) {
    return (
      <PageShell
        eyebrow="Character Detail"
        title="Karakter Bulunamadı"
        description="Bu karakter ya silindi ya da boyut kapısından geçti. İkisi de rahatsız edici."
      >
        <button
          className="primary-action"
          onClick={() => navigate("/characters")}
        >
          Karakterlere Dön
        </button>
      </PageShell>
    );
  }

  const activeCharacter: Character = character;

  const conditionOptions: Character["conditions"] = [
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

  function updateHp(amount: number) {
    const nextHp = Math.max(
      0,
      Math.min(activeCharacter.maxHp, activeCharacter.currentHp + amount)
    );

    onUpdateCharacter({
      ...activeCharacter,
      currentHp: nextHp,
      updatedAt: new Date().toISOString(),
    });
  }

  function updateTempHp(value: number) {
    onUpdateCharacter({
      ...activeCharacter,
      tempHp: Math.max(0, value),
      updatedAt: new Date().toISOString(),
    });
  }

  function toggleCondition(condition: Character["conditions"][number]) {
    const hasCondition = activeCharacter.conditions.includes(condition);

    onUpdateCharacter({
      ...activeCharacter,
      conditions: hasCondition
        ? activeCharacter.conditions.filter((item) => item !== condition)
        : [...activeCharacter.conditions, condition],
      updatedAt: new Date().toISOString(),
    });
  }

  function longRest() {
    onUpdateCharacter({
      ...activeCharacter,
      currentHp: activeCharacter.maxHp,
      tempHp: 0,
      conditions: activeCharacter.conditions.filter(
        (item) => item === "Cursed"
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function quickCharacterRoll(label: string, modifier: number) {
  const result = rollDice({
    count: 1,
    sides: 20,
    modifier,
  });

  setCharacterRollHistory((current) =>
    [
      {
        id: result.id,
        label,
        notation: result.notation,
        rolls: result.rolls,
        total: result.total,
        createdAt: result.createdAt,
      },
      ...current,
    ].slice(0, 8)
  );
}

  return (
    <PageShell
      eyebrow="Character Detail"
      title={activeCharacter.name}
      description={`${activeCharacter.race || "Unknown Race"} • ${
        activeCharacter.className || "Unknown Class"
      } • Level ${activeCharacter.level}`}
    >
      <div className="detail-layout">
        <section className="detail-main-card">
          <div className="character-card-top">
            <div>
              <span className="mini-label">{activeCharacter.ruleset}</span>
              <h2>{activeCharacter.name}</h2>

              <p>
                {activeCharacter.background || "Background yok"}{" "}
                {activeCharacter.subclass
                  ? `• ${activeCharacter.subclass}`
                  : ""}
              </p>
            </div>

            <strong className="level-badge">
              Lv. {activeCharacter.level}
            </strong>
          </div>

          <div className="ability-detail-grid">
            {Object.entries(activeCharacter.abilities).map(
              ([ability, score]) => (
                <div className="ability-detail-card" key={ability}>
                  <span>{ability.toUpperCase()}</span>
                  <strong>{score}</strong>
                  <em>{formatModifier(getAbilityModifier(score))}</em>
                </div>
              )
            )}
          </div>

          <div className="detail-stat-grid">
            <div>
              <span>Armor Class</span>
              <strong>{activeCharacter.armorClass}</strong>
            </div>

            <div>
              <span>Proficiency</span>
              <strong>+{getProficiencyBonus(activeCharacter.level)}</strong>
            </div>

            <div>
              <span>Initiative</span>
              <strong>{formatModifier(getInitiative(activeCharacter))}</strong>
            </div>

            <div>
              <span>Passive Perception</span>
              <strong>{getPassivePerception(activeCharacter)}</strong>
            </div>

            <div>
              <span>Spell Save DC</span>
              <strong>{getSpellSaveDc(activeCharacter)}</strong>
            </div>

            <div>
              <span>Spell Attack</span>
              <strong>
                {formatModifier(getSpellAttackBonus(activeCharacter))}
              </strong>
            </div>
          </div>

          <div className="notes-box">
            <span className="mini-label">Notes</span>
            <p>
              {activeCharacter.notes ||
                "Not yok. Karakterin gizemli olması güzel ama app’in boş kalması değil."}
            </p>
          </div>
        </section>

        <aside className="play-card">
          <span className="mini-label">Play Mode</span>

          <div className="hp-display">
            <strong>
              {activeCharacter.currentHp}/{activeCharacter.maxHp}
            </strong>
            <span>Current HP</span>
          </div>

          <div className="hp-button-grid">
            <button onClick={() => updateHp(-10)}>-10</button>
            <button onClick={() => updateHp(-5)}>-5</button>
            <button onClick={() => updateHp(-1)}>-1</button>
            <button onClick={() => updateHp(1)}>+1</button>
            <button onClick={() => updateHp(5)}>+5</button>
            <button onClick={() => updateHp(10)}>+10</button>
          </div>

          <label className="temp-hp-field">
            Temp HP
            <input
              type="number"
              min={0}
              value={activeCharacter.tempHp}
              onChange={(event) => updateTempHp(Number(event.target.value))}
            />
          </label>

          <div className="condition-picker">
            {conditionOptions.map((condition) => (
              <button
                key={condition}
                className={
                  activeCharacter.conditions.includes(condition) ? "active" : ""
                }
                onClick={() => toggleCondition(condition)}
              >
                {condition}
              </button>
            ))}
          </div>

          <div className="character-roll-result">
  <span className="mini-label">Latest Roll</span>

  {characterRollHistory[0] ? (
    <>
      <strong className="character-roll-total">
        {characterRollHistory[0].total}
      </strong>

      <p>
        {activeCharacter.name} - {characterRollHistory[0].label}
        <br />
        {characterRollHistory[0].notation} → [
        {characterRollHistory[0].rolls.join(", ")}]
      </p>
    </>
  ) : (
    <>
      <strong className="character-roll-total">--</strong>
      <p>Henüz karakter üzerinden zar atılmadı. Kader beklemede.</p>
    </>
  )}
</div>

          <div className="quick-roll-panel">
  <span className="mini-label">Quick Rolls</span>
  <div className="character-roll-history">
  <span className="mini-label">Roll History</span>

  {characterRollHistory.length === 0 ? (
    <div className="character-roll-empty">
      Geçmiş boş. Henüz kimse kaderle pazarlık yapmamış.
    </div>
  ) : (
    characterRollHistory.map((roll) => (
      <div className="character-roll-item" key={roll.id}>
        <div>
          <strong>{roll.label}</strong>
          <span>
            {roll.notation} → [{roll.rolls.join(", ")}]
          </span>
        </div>

        <b>{roll.total}</b>
      </div>
    ))
  )}
</div>

  <div className="quick-roll-grid">
    <button
      onClick={() =>
        quickCharacterRoll("Initiative", getInitiative(activeCharacter))
      }
    >
      Initiative
    </button>

    <button
      onClick={() =>
        quickCharacterRoll(
          "STR Check",
          getAbilityModifier(activeCharacter.abilities.str)
        )
      }
    >
      STR
    </button>

    <button
      onClick={() =>
        quickCharacterRoll(
          "DEX Check",
          getAbilityModifier(activeCharacter.abilities.dex)
        )
      }
    >
      DEX
    </button>

    <button
      onClick={() =>
        quickCharacterRoll(
          "CON Check",
          getAbilityModifier(activeCharacter.abilities.con)
        )
      }
    >
      CON
    </button>

    <button
      onClick={() =>
        quickCharacterRoll(
          "INT Check",
          getAbilityModifier(activeCharacter.abilities.int)
        )
      }
    >
      INT
    </button>

    <button
      onClick={() =>
        quickCharacterRoll(
          "WIS Check",
          getAbilityModifier(activeCharacter.abilities.wis)
        )
      }
    >
      WIS
    </button>

    <button
      onClick={() =>
        quickCharacterRoll(
          "CHA Check",
          getAbilityModifier(activeCharacter.abilities.cha)
        )
      }
    >
      CHA
    </button>

    <button
      onClick={() =>
        quickCharacterRoll(
          "Spell Attack",
          getSpellAttackBonus(activeCharacter)
        )
      }
    >
      Spell
    </button>

    <button onClick={() => quickCharacterRoll("Death Save", 0)}>
      Death
    </button>
  </div>
</div>

          <div className="character-actions">
            <button onClick={longRest}>Long Rest</button>
            <button onClick={() => navigate("/characters")}>Listeye Dön</button>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Builder({
  onCreateCharacter,
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  onCreateCharacter: (draft: CharacterDraft) => void;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const [draft, setDraft] = useState<CharacterDraft>(emptyDraft);

  const selectedRace = useMemo(() => {
    return rulesetData?.races.find((race) => race.name === draft.race) ?? null;
  }, [rulesetData, draft.race]);

  const selectedClass = useMemo(() => {
    return (
      rulesetData?.classes.find(
        (classItem) => classItem.name === draft.className
      ) ?? null
    );
  }, [rulesetData, draft.className]);

  function updateDraft<K extends keyof CharacterDraft>(
    key: K,
    value: CharacterDraft[K]
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAbility(
    ability: keyof CharacterDraft["abilities"],
    value: number
  ) {
    setDraft((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [ability]: value,
      },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      alert("Karakter adı lazım kankam. İsimsiz kahraman ancak yan NPC olur.");
      return;
    }

    if (!draft.className.trim()) {
      alert("Class seçmeden karakter olmaz. Sistem bile buna güler.");
      return;
    }

    onCreateCharacter(draft);
    setDraft(emptyDraft);
  }

  const previewCharacter = useMemo(
    () => createCharacterFromDraft(draft),
    [draft]
  );

  return (
    <PageShell
      eyebrow="Character Builder"
      title="Yeni Karakter"
      description="İlk çalışan builder: temel bilgiler, ability skorları ve anlık hesap önizlemesi."
    >
      <form className="builder-form" onSubmit={handleSubmit}>
        <section className="form-panel">
          <h2>Temel Bilgiler</h2>

          <div className="form-grid">
            <label>
              Karakter Adı
              <input
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="Sora, Tengiz, Akai..."
              />
            </label>

            <label>
              Oyuncu
              <input
                value={draft.playerName}
                onChange={(event) =>
                  updateDraft("playerName", event.target.value)
                }
                placeholder="Oyuncu adı"
              />
            </label>

            <label>
              Ruleset
              <select
                value={draft.ruleset}
                onChange={(event) =>
                  updateDraft(
                    "ruleset",
                    event.target.value as CharacterDraft["ruleset"]
                  )
                }
              >
                <option value="dnd_2014">D&D 2014</option>
                <option value="dnd_2024">D&D 2024</option>
                <option value="homebrew">Homebrew</option>
              </select>
            </label>

            <label>
              Level
              <input
                type="number"
                min={1}
                max={20}
                value={draft.level}
                onChange={(event) =>
                  updateDraft("level", Number(event.target.value))
                }
              />
            </label>

            <label>
              Race
              {draft.ruleset === "dnd_2014" ? (
                <select
                  value={draft.race}
                  disabled={isRulesetLoading || !!rulesetError || !rulesetData}
                  onChange={(event) => updateDraft("race", event.target.value)}
                >
                  <option value="">
                    {isRulesetLoading
                      ? "Race data yükleniyor..."
                      : "Race seç"}
                  </option>

                  {rulesetData?.races.map((race) => (
                    <option key={race.id} value={race.name}>
                      {race.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={draft.race}
                  onChange={(event) => updateDraft("race", event.target.value)}
                  placeholder="Custom race..."
                />
              )}
            </label>

            <label>
              Class
              {draft.ruleset === "dnd_2014" ? (
                <select
                  value={draft.className}
                  disabled={isRulesetLoading || !!rulesetError || !rulesetData}
                  onChange={(event) =>
                    updateDraft("className", event.target.value)
                  }
                >
                  <option value="">
                    {isRulesetLoading
                      ? "Class data yükleniyor..."
                      : "Class seç"}
                  </option>

                  {rulesetData?.classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.name}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={draft.className}
                  onChange={(event) =>
                    updateDraft("className", event.target.value)
                  }
                  placeholder="Custom class..."
                />
              )}
            </label>

            <label>
              Subclass
              <input
                value={draft.subclass}
                onChange={(event) =>
                  updateDraft("subclass", event.target.value)
                }
                placeholder="Desert Domain..."
              />
            </label>

            <label>
              Background
              <input
                value={draft.background}
                onChange={(event) =>
                  updateDraft("background", event.target.value)
                }
                placeholder="Acolyte, Sailor..."
              />
            </label>
          </div>

          {rulesetError ? (
            <div className="empty-panel">
              <h2>Ruleset data yüklenemedi</h2>
              <p>{rulesetError}</p>
            </div>
          ) : null}

          {selectedRace || selectedClass ? (
            <div className="preview-stats">
              {selectedRace ? (
                <>
                  <span>Race: {selectedRace.name}</span>
                  <span>Speed {selectedRace.speed} ft</span>
                  <span>Size {selectedRace.size}</span>
                  <span>
                    Bonus {" "}
                    {Object.entries(selectedRace.abilityBonuses)
                      .map(
                        ([ability, bonus]) =>
                          `${ability.toUpperCase()} +${bonus}`
                      )
                      .join(", ")}
                  </span>
                </>
              ) : null}

              {selectedClass ? (
                <>
                  <span>Class: {selectedClass.name}</span>
                  <span>Hit Die d{selectedClass.hitDie}</span>
                  <span>
                    Saves {" "}
                    {selectedClass.savingThrows
                      .map((save) => save.toUpperCase())
                      .join(", ")}
                  </span>
                  <span>
                    Spell {" "}
                    {selectedClass.spellcastingAbility
                      ? selectedClass.spellcastingAbility.toUpperCase()
                      : "None"}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="form-panel">
          <h2>Ability Scores</h2>

          <div className="ability-editor">
            {Object.entries(draft.abilities).map(([ability, score]) => (
              <label className="ability-input" key={ability}>
                <span>{ability.toUpperCase()}</span>

                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(event) =>
                    updateAbility(
                      ability as keyof CharacterDraft["abilities"],
                      Number(event.target.value)
                    )
                  }
                />

                <strong>{formatModifier(getAbilityModifier(score))}</strong>
              </label>
            ))}
          </div>
        </section>

        <section className="form-panel">
          <h2>Combat</h2>

          <div className="form-grid">
            <label>
              Max HP
              <input
                type="number"
                min={1}
                value={draft.maxHp}
                onChange={(event) =>
                  updateDraft("maxHp", Number(event.target.value))
                }
              />
            </label>

            <label>
              Armor Class
              <input
                type="number"
                min={1}
                value={draft.armorClass}
                onChange={(event) =>
                  updateDraft("armorClass", Number(event.target.value))
                }
              />
            </label>
          </div>

          <label>
            Notlar
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Lore, özel homebrew kurallar, DM notları..."
              rows={4}
            />
          </label>
        </section>

        <section className="form-panel preview-panel">
          <h2>Önizleme</h2>

          <div className="preview-stats">
            <span>PB +{getProficiencyBonus(previewCharacter.level)}</span>
            <span>AC {previewCharacter.armorClass}</span>
            <span>HP {previewCharacter.maxHp}</span>
            <span>Init {formatModifier(getInitiative(previewCharacter))}</span>
            <span>PP {getPassivePerception(previewCharacter)}</span>
            <span>DC {getSpellSaveDc(previewCharacter)}</span>
            <span>
              Spell Attack{" "}
              {formatModifier(getSpellAttackBonus(previewCharacter))}
            </span>
          </div>

          <button className="primary-action" type="submit">
            Karakteri Kaydet
          </button>
        </section>
      </form>
    </PageShell>
  );
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
          {["Blessed", "Poisoned", "Prone", "Concentration", "Rage", "Haki"].map(
            (condition) => (
              <button key={condition}>{condition}</button>
            )
          )}
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
        alert("Bu dosya karakter listesi değil. JSON var ama karakter yok, çok şiirsel ve işe yaramaz.");
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
        alert("Bu JSON bizim karakter formatımıza benzemiyor. Yani evet, yine format cehennemi.");
        return;
      }

      const confirmed = confirm(
        "Bu işlem mevcut karakter listesinin üstüne yazacak. Devam edilsin mi?"
      );

      if (!confirmed) {
        return;
      }

      onImportCharacters(parsed as Character[]);
      event.target.value = "";
    } catch {
      alert("JSON okunamadı. Dosya bozuk olabilir ya da dijital goblinler yemiştir.");
    }
  }

  function handleWipe() {
    if (characters.length === 0) {
      alert("Zaten silinecek karakter yok. Boşluğu ikinci kez silemiyoruz.");
      return;
    }

    const confirmed = confirm(
      "Tüm karakterler silinsin mi? Bu işlem geri alınamaz. Dramatik müzik burada giriyor."
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
            Karakterler şu an bu tarayıcının localStorage alanında duruyor.
            Yani cihazda kalıyor, cloud'a gitmiyor. Gizlilik güzel, veri kaybı
            riski ise çirkin. O yüzden yedek alıyoruz.
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
                <strong>0</strong>
                <span>Spells, sıradaki bela</span>
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
                            `${ability.toUpperCase()} +${bonus}`
                        )
                        .join(", ")}
                    </span>
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

function HomebrewLab() {
  return (
    <PageShell
      eyebrow="Homebrew Lab"
      title="Homebrew"
      description="Custom race, class, subclass, feat, spell ve item üretim laboratuvarı."
    >
      <div className="lab-grid">
        {["Race", "Class", "Subclass", "Feat", "Spell", "Item"].map((item) => (
          <motion.div className="lab-card" key={item} whileHover={{ y: -5 }}>
            <span>Custom</span>
            <strong>{item}</strong>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}

function App() {
  const [characters, setCharacters] = useState<Character[]>(() =>
    loadCharacters()
  );

  const [rulesetData, setRulesetData] = useState<RulesetData | null>(null);
  const [isRulesetLoading, setIsRulesetLoading] = useState(true);
  const [rulesetError, setRulesetError] = useState<string | null>(null);

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
            error instanceof Error ? error.message : "Ruleset data yüklenemedi."
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

  function handleCreateCharacter(draft: CharacterDraft) {
    const character = createCharacterFromDraft(draft);
    setCharacters((current) => [character, ...current]);
  }

  function handleUpdateCharacter(updatedCharacter: Character) {
    setCharacters((current) =>
      current.map((character) =>
        character.id === updatedCharacter.id ? updatedCharacter : character
      )
    );
  }

  function handleDeleteCharacter(id: string) {
  const character = characters.find((item) => item.id === id);

  if (!character) {
    return;
  }

  const confirmed = confirm(`${character.name} silinsin mi? Geri dönüş yok.`);

  if (!confirmed) {
    return;
  }

  setCharacters((current) => current.filter((item) => item.id !== id));
}

function handleImportCharacters(importedCharacters: Character[]) {
  setCharacters(importedCharacters);
}

function handleWipeCharacters() {
  setCharacters([]);
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
            path="/characters/:characterId"
            element={
              <CharacterDetail
                characters={characters}
                onUpdateCharacter={handleUpdateCharacter}
              />
            }
          />

          <Route
            path="/builder"
            element={
              <Builder
                onCreateCharacter={handleCreateCharacter}
                rulesetData={rulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />

          <Route path="/play-mode" element={<PlayMode />} />
          <Route path="/dice" element={<Dice />} />
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
                rulesetData={rulesetData}
                isRulesetLoading={isRulesetLoading}
                rulesetError={rulesetError}
              />
            }
          />
          <Route path="/homebrew-lab" element={<HomebrewLab />} />
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