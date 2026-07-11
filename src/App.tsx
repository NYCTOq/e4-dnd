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
import type { DndItemData, DndSpellData, RulesetData } from "./core/rulesets/ruleset.types";
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
  { to: "/spellbook", label: "Spellbook" },
  { to: "/inventory", label: "Inventory" },
  { to: "/campaigns", label: "Campaigns" },
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
  armorClassMode: "manual",
  knownSpellIds: [],
  preparedSpellIds: [],
  spellSlots: [],
  inventory: [],
  equippedArmorId: null,
  equippedShieldId: null,
  equippedWeaponIds: [],
  gold: 0,
  notes: "",
};


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

const FULL_CASTER_CLASSES = new Set([
  "bard",
  "cleric",
  "druid",
  "sorcerer",
  "wizard",
]);

const FULL_CASTER_SLOT_TABLE: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

function getDefaultSpellSlots(
  level: number,
  className: string,
): Character["spellSlots"] {
  const normalizedClassName = className.trim().toLowerCase();

  if (!FULL_CASTER_CLASSES.has(normalizedClassName)) {
    return [];
  }

  const safeLevel = Math.min(20, Math.max(1, Math.floor(level)));
  const slots = FULL_CASTER_SLOT_TABLE[safeLevel] ?? [];

  return slots.map((max, index) => ({
    level: index + 1,
    max,
    used: 0,
  }));
}

function normalizeSpellSlots(
  currentSlots: Character["spellSlots"] | undefined,
  level: number,
  className: string,
): Character["spellSlots"] {
  const defaults = getDefaultSpellSlots(level, className);

  return defaults.map((defaultSlot) => {
    const currentSlot = currentSlots?.find(
      (slot) => slot.level === defaultSlot.level,
    );

    return {
      ...defaultSlot,
      used: Math.min(defaultSlot.max, Math.max(0, currentSlot?.used ?? 0)),
    };
  });
}

function resetSpellSlots(
  spellSlots: Character["spellSlots"],
): Character["spellSlots"] {
  return spellSlots.map((slot) => ({
    ...slot,
    used: 0,
  }));
}

function getInventoryQuantity(
  inventory: Character["inventory"],
  itemId: string,
) {
  return inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
}

function setInventoryItemQuantity(
  inventory: Character["inventory"],
  itemId: string,
  quantity: number,
): Character["inventory"] {
  const safeQuantity = Math.max(0, Math.floor(quantity));

  if (safeQuantity <= 0) {
    return inventory.filter((entry) => entry.itemId !== itemId);
  }

  const hasItem = inventory.some((entry) => entry.itemId === itemId);

  if (!hasItem) {
    return [...inventory, { itemId, quantity: safeQuantity }];
  }

  return inventory.map((entry) =>
    entry.itemId === itemId ? { ...entry, quantity: safeQuantity } : entry,
  );
}

function getCharacterInventoryItems(
  inventory: Character["inventory"],
  items: DndItemData[] | undefined,
) {
  const itemMap = new Map((items ?? []).map((item) => [item.id, item]));

  return inventory
    .map((entry) => ({
      entry,
      item: itemMap.get(entry.itemId) ?? null,
    }))
    .filter((entry): entry is { entry: Character["inventory"][number]; item: DndItemData } =>
      Boolean(entry.item),
    )
    .sort((a, b) => a.item.name.localeCompare(b.item.name));
}

function getInventoryWeight(
  inventory: Character["inventory"],
  items: DndItemData[] | undefined,
) {
  return getCharacterInventoryItems(inventory, items).reduce(
    (total, { entry, item }) => total + entry.quantity * item.weight,
    0,
  );
}

function getEquippedItems(character: Character, items: DndItemData[] | undefined) {
  const itemMap = new Map((items ?? []).map((item) => [item.id, item]));

  return {
    armor: character.equippedArmorId
      ? itemMap.get(character.equippedArmorId) ?? null
      : null,
    shield: character.equippedShieldId
      ? itemMap.get(character.equippedShieldId) ?? null
      : null,
    weapons: character.equippedWeaponIds
      .map((itemId) => itemMap.get(itemId) ?? null)
      .filter((item): item is DndItemData => Boolean(item)),
  };
}

function calculateSuggestedArmorClass(
  character: Pick<Character, "abilities" | "equippedArmorId" | "equippedShieldId">,
  items: DndItemData[] | undefined,
) {
  const itemMap = new Map((items ?? []).map((item) => [item.id, item]));
  const armor = character.equippedArmorId
    ? itemMap.get(character.equippedArmorId)
    : null;
  const shield = character.equippedShieldId
    ? itemMap.get(character.equippedShieldId)
    : null;
  const dexModifier = getAbilityModifier(character.abilities.dex);

  let armorClass = 10 + dexModifier;

  if (armor?.category === "armor" && armor.armorClass) {
    if (armor.armorType === "heavy") {
      armorClass = armor.armorClass;
    } else if (armor.armorType === "medium") {
      armorClass = armor.armorClass + Math.min(armor.dexBonusMax ?? 2, dexModifier);
    } else {
      armorClass = armor.armorClass + dexModifier;
    }
  }

  if (shield?.category === "shield") {
    armorClass += shield.armorClassBonus ?? 2;
  }

  return armorClass;
}

function calculateEffectiveArmorClass(
  character: Pick<Character, "abilities" | "armorClass" | "armorClassMode" | "equippedArmorId" | "equippedShieldId">,
  items: DndItemData[] | undefined,
) {
  if (character.armorClassMode !== "auto") {
    return character.armorClass;
  }

  return calculateSuggestedArmorClass(character, items);
}

function getWeaponAbilityModifier(character: Character, weapon: DndItemData) {
  const properties = weapon.properties?.map((property) => property.toLowerCase()) ?? [];
  const isRanged = Boolean(weapon.range) || properties.includes("ammunition") || properties.includes("thrown");
  const strengthModifier = getAbilityModifier(character.abilities.str);
  const dexterityModifier = getAbilityModifier(character.abilities.dex);

  if (properties.includes("finesse")) {
    return Math.max(strengthModifier, dexterityModifier);
  }

  if (isRanged) {
    return dexterityModifier;
  }

  return strengthModifier;
}

function getWeaponAttackBonus(character: Character, weapon: DndItemData) {
  return getWeaponAbilityModifier(character, weapon) + getProficiencyBonus(character.level);
}

function getWeaponDamageSummary(character: Character, weapon: DndItemData) {
  const abilityModifier = getWeaponAbilityModifier(character, weapon);
  const modifierText = abilityModifier === 0 ? "" : ` ${formatModifier(abilityModifier)}`;

  return `${weapon.damage ?? "1"}${modifierText} ${weapon.damageType ?? "damage"}`;
}

function getItemCategoryLabel(category: DndItemData["category"]) {
  const labels: Record<DndItemData["category"], string> = {
    weapon: "Weapon",
    armor: "Armor",
    shield: "Shield",
    gear: "Gear",
  };

  return labels[category];
}

function getItemRulesSummary(item: DndItemData) {
  if (item.category === "weapon") {
    return [item.damage, item.damageType, item.range ? `Range ${item.range}` : null]
      .filter(Boolean)
      .join(" • ");
  }

  if (item.category === "armor") {
    const dexText = item.armorType === "heavy"
      ? "No Dex"
      : item.armorType === "medium"
        ? `Dex max ${item.dexBonusMax ?? 2}`
        : "Dex full";

    return [`AC ${item.armorClass}`, item.armorType, dexText]
      .filter(Boolean)
      .join(" • ");
  }

  if (item.category === "shield") {
    return `+${item.armorClassBonus ?? 2} AC`;
  }

  return item.tags?.join(" • ") ?? "Utility";
}

function createCharacterFromDraft(draft: CharacterDraft): Character {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ...draft,
    spellSlots: normalizeSpellSlots(
      draft.spellSlots,
      draft.level,
      draft.className,
    ),
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
  onDeleteCharacter: (id: string) => boolean;
}) {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [rulesetFilter, setRulesetFilter] = useState<
    "all" | Character["ruleset"]
  >("all");
  const [classFilter, setClassFilter] = useState("all");

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

    return characters.filter((character) => {
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
  }, [characters, searchTerm, rulesetFilter, classFilter]);

  return (
    <PageShell
      eyebrow="Character Vault"
      title="Karakterler"
      description="Kayıtlı karakterlerin burada listelenir. Şimdilik local kayıt var, cloud yok, huzur var."
    >
      <div className="character-filter-panel">
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

        <div className="filter-result-count">
          <strong>{filteredCharacters.length}</strong>
          <span>sonuç</span>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="empty-panel">
          <h2>Henüz karakter yok.</h2>
          <p>
            Builder ekranından karakter oluştur. App’in boş bakışları da böylece
            sona ersin.
          </p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="empty-panel">
          <h2>Sonuç bulunamadı.</h2>
          <p>
            Filtreler fazla sert olmuş olabilir. Karakterler bile bu kadar
            yargılanmayı hak etmiyor.
          </p>
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

function CharacterDetail({
  characters,
  rulesetData,
  onUpdateCharacter,
  onDeleteCharacter,
}: {
  characters: Character[];
  rulesetData: RulesetData | null;
  onUpdateCharacter: (character: Character) => void;
  onDeleteCharacter: (id: string) => boolean;
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

  const knownSpellIds = activeCharacter.knownSpellIds ?? [];
  const preparedSpellIds = activeCharacter.preparedSpellIds ?? [];
  const preparedSpellIdSet = new Set(preparedSpellIds);

  const characterSpells =
    rulesetData?.spells.filter((spell) => knownSpellIds.includes(spell.id)) ?? [];
  const characterSpellGroups = getSpellLevelGroups(characterSpells);
  const castReadyCharacterSpells = sortSpellsByLevelAndName(
    characterSpells.filter((spell) =>
      isSpellReadyToCast(spell, preparedSpellIdSet),
    ),
  );
  const castReadySpellGroups = getSpellLevelGroups(castReadyCharacterSpells);
  const knownCantripCount = characterSpells.filter((spell) => spell.level === 0).length;
  const activeSpellSlots = normalizeSpellSlots(
    activeCharacter.spellSlots,
    activeCharacter.level,
    activeCharacter.className,
  );
  const inventoryDetails = getCharacterInventoryItems(
    activeCharacter.inventory ?? [],
    rulesetData?.items,
  );
  const equippedItems = getEquippedItems(activeCharacter, rulesetData?.items);
  const totalInventoryWeight = getInventoryWeight(
    activeCharacter.inventory ?? [],
    rulesetData?.items,
  );
  const suggestedArmorClass = calculateSuggestedArmorClass(
    activeCharacter,
    rulesetData?.items,
  );
  const effectiveArmorClass = calculateEffectiveArmorClass(
    activeCharacter,
    rulesetData?.items,
  );
  const equippedWeaponAttacks = equippedItems.weapons.map((weapon) => ({
    weapon,
    attackBonus: getWeaponAttackBonus(activeCharacter, weapon),
    damage: getWeaponDamageSummary(activeCharacter, weapon),
  }));

  function updateHp(amount: number) {
    const nextHp = Math.max(
      0,
      Math.min(activeCharacter.maxHp, activeCharacter.currentHp + amount),
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

  function togglePreparedSpell(spellId: string) {
    const hasPreparedSpell = preparedSpellIds.includes(spellId);

    onUpdateCharacter({
      ...activeCharacter,
      knownSpellIds: knownSpellIds.includes(spellId)
        ? knownSpellIds
        : [...knownSpellIds, spellId],
      preparedSpellIds: hasPreparedSpell
        ? preparedSpellIds.filter((id) => id !== spellId)
        : [...preparedSpellIds, spellId],
      updatedAt: new Date().toISOString(),
    });
  }



  function castSpell(spell: DndSpellData) {
    const nextConditions =
      spell.concentration &&
      !activeCharacter.conditions.includes("Concentration")
        ? [...activeCharacter.conditions, "Concentration" as const]
        : activeCharacter.conditions;

    if (spell.level === 0) {
      onUpdateCharacter({
        ...activeCharacter,
        conditions: nextConditions,
        updatedAt: new Date().toISOString(),
      });

      alert(`${spell.name} cast edildi. Cantrip olduğu için slot harcamadı.`);
      return;
    }

    const slot = activeSpellSlots.find(
      (spellSlot) => spellSlot.level === spell.level,
    );

    if (!slot || slot.used >= slot.max) {
      alert(`${spell.name} için Level ${spell.level} slot kalmadı. Büyü bürokrasisi yine kazandı.`);
      return;
    }

    onUpdateCharacter({
      ...activeCharacter,
      spellSlots: activeSpellSlots.map((spellSlot) =>
        spellSlot.level === spell.level
          ? { ...spellSlot, used: spellSlot.used + 1 }
          : spellSlot,
      ),
      conditions: nextConditions,
      updatedAt: new Date().toISOString(),
    });
  }

  function canCastSpell(spell: DndSpellData) {
    if (spell.level === 0) {
      return true;
    }

    const slot = activeSpellSlots.find(
      (spellSlot) => spellSlot.level === spell.level,
    );

    return !!slot && slot.used < slot.max;
  }

  function longRest() {
    onUpdateCharacter({
      ...activeCharacter,
      currentHp: activeCharacter.maxHp,
      tempHp: 0,
      spellSlots: resetSpellSlots(activeSpellSlots),
      conditions: activeCharacter.conditions.filter(
        (item) => item === "Cursed",
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function deleteCurrentCharacter() {
    const deleted = onDeleteCharacter(activeCharacter.id);

    if (deleted) {
      navigate("/characters");
    }
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
      ].slice(0, 8),
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

            <strong className="level-badge">Lv. {activeCharacter.level}</strong>
          </div>

          <div className="character-actions detail-actions">
            <button
              onClick={() => navigate(`/characters/${activeCharacter.id}/edit`)}
            >
              Düzenle
            </button>

            <button onClick={deleteCurrentCharacter}>Sil</button>

            <button onClick={() => navigate("/characters")}>Listeye Dön</button>
          </div>

          <div className="ability-detail-grid">
            {Object.entries(activeCharacter.abilities).map(
              ([ability, score]) => (
                <div className="ability-detail-card" key={ability}>
                  <span>{ability.toUpperCase()}</span>
                  <strong>{score}</strong>
                  <em>{formatModifier(getAbilityModifier(score))}</em>
                </div>
              ),
            )}
          </div>

          <div className="detail-stat-grid">
            <div>
              <span>Armor Class</span>
              <strong>{effectiveArmorClass}</strong>
              <em>{activeCharacter.armorClassMode === "auto" ? "Auto" : "Manual"}</em>
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

          <div className="character-equipment-panel">
            <div className="spell-selector-head">
              <div>
                <span className="mini-label">Equipment</span>
                <h2>Envanter & Kuşanılanlar</h2>
              </div>

              <div className="spell-selector-counts">
                <span>{activeCharacter.gold ?? 0} gp</span>
                <span>{inventoryDetails.length} item</span>
                <span>{totalInventoryWeight.toFixed(1)} lb</span>
              </div>
            </div>

            <div className="inventory-equipped-grid detail-equipped-grid">
              <div>
                <span>Armor</span>
                <strong>{equippedItems.armor?.name ?? "None"}</strong>
              </div>
              <div>
                <span>Shield</span>
                <strong>{equippedItems.shield?.name ?? "None"}</strong>
              </div>
              <div>
                <span>Weapons</span>
                <strong>
                  {equippedItems.weapons.map((item) => item.name).join(", ") || "None"}
                </strong>
              </div>
              <div>
                <span>Effective AC</span>
                <strong>{effectiveArmorClass}</strong>
              </div>
              <div>
                <span>Suggested AC</span>
                <strong>{suggestedArmorClass}</strong>
              </div>
              <div>
                <span>AC Mode</span>
                <strong>{activeCharacter.armorClassMode === "auto" ? "Auto" : "Manual"}</strong>
              </div>
            </div>

            {equippedWeaponAttacks.length > 0 ? (
              <div className="weapon-attack-list">
                {equippedWeaponAttacks.map(({ weapon, attackBonus, damage }) => (
                  <article className="weapon-attack-card" key={weapon.id}>
                    <div>
                      <strong>{weapon.name}</strong>
                      <span>{weapon.damage} • {weapon.damageType} • {weapon.properties?.join(", ") || "Standard"}</span>
                    </div>
                    <div>
                      <b>{formatModifier(attackBonus)}</b>
                      <small>{damage}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {inventoryDetails.length === 0 ? (
              <div className="spell-selector-note">
                Envanter boş. Kahraman cebinde umutla geziyor, o da 0 gp.
              </div>
            ) : (
              <div className="inventory-detail-list">
                {inventoryDetails.map(({ entry, item }) => (
                  <article className="inventory-detail-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{getItemCategoryLabel(item.category)} • {getItemRulesSummary(item)}</span>
                    </div>
                    <div>
                      <b>x{entry.quantity}</b>
                      <small>{(entry.quantity * item.weight).toFixed(1)} lb</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="character-detail-spellbook">
            <div className="spell-selector-head">
              <div>
                <span className="mini-label">Character Spellbook</span>
                <h2>Seçili Büyüler</h2>
              </div>

              <div className="spell-selector-counts">
                <span>{knownSpellIds.length} known</span>
                <span>{knownCantripCount} cantrip</span>
                <span>{preparedSpellIds.length} prepared</span>
              </div>
            </div>

            {characterSpells.length === 0 ? (
              <div className="spell-selector-note">
                Bu karaktere henüz spell eklenmedi. Cleric olup dua kitabını
                evde unutmak gibi, hoş değil ama düzeltilebilir.
              </div>
            ) : (
              <div className="character-detail-spell-groups">
                {characterSpellGroups.map((group) => (
                  <div className="spell-level-group" key={group.level}>
                    <h3 className="spell-level-title">
                      {getSpellGroupTitle(group.level)}
                    </h3>

                    <div className="character-detail-spell-grid">
                      {group.spells.map((spell) => {
                        const isPrepared = preparedSpellIdSet.has(spell.id);
                        const isCantrip = spell.level === 0;
                        const isReady = isSpellReadyToCast(
                          spell,
                          preparedSpellIdSet,
                        );

                        return (
                          <article className="detail-spell-card" key={spell.id}>
                            <div className="library-item-top">
                              <div>
                                <span className="mini-label">{spell.school}</span>
                                <h3>{spell.name}</h3>
                              </div>

                              <span>{getSpellLevelLabel(spell)}</span>
                            </div>

                            <div className="spell-meta-grid">
                              <span>Cast: {spell.castingTime}</span>
                              <span>Range: {spell.range}</span>
                              <span>Duration: {spell.duration}</span>
                              <span>Comp: {spell.components.join(", ")}</span>
                              {spell.concentration ? <span>Concentration</span> : null}
                              {spell.ritual ? <span>Ritual</span> : null}
                            </div>

                            <details className="spell-description-toggle">
                              <summary>Details</summary>
                              <p>{spell.description}</p>

                              {spell.higherLevels ? (
                                <p className="spell-higher-levels">
                                  {spell.higherLevels}
                                </p>
                              ) : null}
                            </details>

                            <div className="spell-row-actions detail-spell-actions">
                              {isCantrip ? (
                                <span className="spell-status-pill active">
                                  Always Ready
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={isPrepared ? "active" : ""}
                                  onClick={() => togglePreparedSpell(spell.id)}
                                >
                                  {isPrepared ? "Prepared" : "Prepare"}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={!isReady || !canCastSpell(spell)}
                                onClick={() => castSpell(spell)}
                              >
                                {isCantrip ? "Cast" : `Cast L${spell.level}`}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
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


          <div className="spell-slot-panel">
            <div className="spell-slot-head">
              <span className="mini-label">Spell Slots</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateCharacter({
                    ...activeCharacter,
                    spellSlots: resetSpellSlots(activeSpellSlots),
                    updatedAt: new Date().toISOString(),
                  })
                }
              >
                Restore Slots
              </button>
            </div>

            {activeSpellSlots.length === 0 ? (
              <div className="spell-slot-empty">
                Bu karakter için slot yok. Ya caster değil ya da sistem henüz
                onu ciddiye almıyor.
              </div>
            ) : (
              <div className="spell-slot-grid">
                {activeSpellSlots.map((slot) => {
                  const remaining = slot.max - slot.used;

                  return (
                    <div className="spell-slot-card" key={slot.level}>
                      <span>Level {slot.level}</span>
                      <strong>
                        {remaining}/{slot.max}
                      </strong>
                      <div className="spell-slot-bar">
                        <span
                          style={{
                            width: `${Math.round((remaining / slot.max) * 100)}%`,
                          }}
                        />
                      </div>
                      <small>{slot.used} used</small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          <div className="prepared-cast-panel">
            <span className="mini-label">Prepared Cast</span>

            {castReadyCharacterSpells.length === 0 ? (
              <div className="spell-slot-empty">
                Cast edilecek büyü yok. Büyücü var, evrak yok. Bürokrasi kazanıyor.
              </div>
            ) : (
              <div className="prepared-cast-list">
                {castReadySpellGroups.map((group) => (
                  <div className="prepared-cast-group" key={group.level}>
                    <strong>{getSpellGroupTitle(group.level)}</strong>

                    {group.spells.map((spell) => (
                      <button
                        key={spell.id}
                        type="button"
                        disabled={!canCastSpell(spell)}
                        onClick={() => castSpell(spell)}
                      >
                        <span>{spell.name}</span>
                        <small>{getSpellLevelLabel(spell)}</small>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  quickCharacterRoll(
                    "Initiative",
                    getInitiative(activeCharacter),
                  )
                }
              >
                Initiative
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "STR Check",
                    getAbilityModifier(activeCharacter.abilities.str),
                  )
                }
              >
                STR
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "DEX Check",
                    getAbilityModifier(activeCharacter.abilities.dex),
                  )
                }
              >
                DEX
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "CON Check",
                    getAbilityModifier(activeCharacter.abilities.con),
                  )
                }
              >
                CON
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "INT Check",
                    getAbilityModifier(activeCharacter.abilities.int),
                  )
                }
              >
                INT
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "WIS Check",
                    getAbilityModifier(activeCharacter.abilities.wis),
                  )
                }
              >
                WIS
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "CHA Check",
                    getAbilityModifier(activeCharacter.abilities.cha),
                  )
                }
              >
                CHA
              </button>

              <button
                onClick={() =>
                  quickCharacterRoll(
                    "Spell Attack",
                    getSpellAttackBonus(activeCharacter),
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
          </div>
        </aside>
      </div>
    </PageShell>
  );
}


function getSpellLevelLabel(spell: DndSpellData) {
  return spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
}

function getSpellGroupTitle(level: number) {
  return level === 0 ? "Cantrips" : `Level ${level} Spells`;
}

function sortSpellsByLevelAndName(spells: DndSpellData[]) {
  return [...spells].sort((firstSpell, secondSpell) => {
    if (firstSpell.level !== secondSpell.level) {
      return firstSpell.level - secondSpell.level;
    }

    return firstSpell.name.localeCompare(secondSpell.name);
  });
}

function getSpellLevelGroups(spells: DndSpellData[]) {
  const sortedSpells = sortSpellsByLevelAndName(spells);
  const levels = Array.from(
    new Set(sortedSpells.map((spell) => spell.level)),
  ).sort((firstLevel, secondLevel) => firstLevel - secondLevel);

  return levels.map((level) => ({
    level,
    spells: sortedSpells.filter((spell) => spell.level === level),
  }));
}

function isSpellReadyToCast(
  spell: DndSpellData,
  preparedSpellIdSet: Set<string>,
) {
  return spell.level === 0 || preparedSpellIdSet.has(spell.id);
}

function CharacterSpellSelector({
  title,
  description,
  rulesetData,
  isRulesetLoading,
  rulesetError,
  className,
  knownSpellIds,
  preparedSpellIds,
  onChange,
}: {
  title: string;
  description: string;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
  className: string;
  knownSpellIds: string[];
  preparedSpellIds: string[];
  onChange: (next: {
    knownSpellIds: string[];
    preparedSpellIds: string[];
  }) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const normalizedClassName = className.trim().toLowerCase();

  const filteredSpells = useMemo(() => {
    if (!rulesetData) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rulesetData.spells.filter((spell) => {
      const matchesClass =
        normalizedClassName.length === 0 ||
        spell.classes.some(
          (spellClass) => spellClass.toLowerCase() === normalizedClassName,
        );

      const matchesLevel =
        levelFilter === "all" || spell.level === Number(levelFilter);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          spell.name,
          spell.school,
          spell.description,
          spell.classes.join(" "),
          spell.higherLevels ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesClass && matchesLevel && matchesSearch;
    });
  }, [rulesetData, searchTerm, levelFilter, normalizedClassName]);

  const knownSpellIdSet = useMemo(
    () => new Set(knownSpellIds),
    [knownSpellIds],
  );

  const preparedSpellIdSet = useMemo(
    () => new Set(preparedSpellIds),
    [preparedSpellIds],
  );

  const filteredSpellGroups = getSpellLevelGroups(filteredSpells);

  const knownCantripCount =
    rulesetData?.spells.filter(
      (spell) => spell.level === 0 && knownSpellIdSet.has(spell.id),
    ).length ?? 0;

  function toggleKnownSpell(spellId: string) {
    const isKnown = knownSpellIdSet.has(spellId);

    if (isKnown) {
      onChange({
        knownSpellIds: knownSpellIds.filter((id) => id !== spellId),
        preparedSpellIds: preparedSpellIds.filter((id) => id !== spellId),
      });
      return;
    }

    onChange({
      knownSpellIds: [...knownSpellIds, spellId],
      preparedSpellIds,
    });
  }

  function togglePreparedSpell(spellId: string) {
    const isPrepared = preparedSpellIdSet.has(spellId);

    if (isPrepared) {
      onChange({
        knownSpellIds,
        preparedSpellIds: preparedSpellIds.filter((id) => id !== spellId),
      });
      return;
    }

    onChange({
      knownSpellIds: knownSpellIdSet.has(spellId)
        ? knownSpellIds
        : [...knownSpellIds, spellId],
      preparedSpellIds: [...preparedSpellIds, spellId],
    });
  }

  return (
    <section className="form-panel character-spell-selector">
      <div className="spell-selector-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="spell-selector-counts">
          <span>{knownSpellIds.length} known</span>
          <span>{knownCantripCount} cantrip</span>
          <span>{preparedSpellIds.length} prepared</span>
        </div>
      </div>

      {isRulesetLoading ? (
        <div className="empty-panel">
          <h2>Spell data yükleniyor...</h2>
          <p>Büyüleri toparlıyoruz. Raflar yine dramatik biçimde gıcırdıyor.</p>
        </div>
      ) : rulesetError ? (
        <div className="empty-panel">
          <h2>Spell data yüklenemedi</h2>
          <p>{rulesetError}</p>
        </div>
      ) : rulesetData ? (
        <>
          <div className="spell-selector-filters">
            <label>
              Ara
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Bless, Fireball, healing..."
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
          </div>

          {normalizedClassName.length === 0 ? (
            <div className="spell-selector-note">
              Class seçersen liste otomatik daralır. App sonunda bağlamdan bir
              şey anlamaya başladı, insanlık adına ürkütücü.
            </div>
          ) : null}

          {filteredSpells.length === 0 ? (
            <div className="empty-panel">
              <h2>Uygun spell bulunamadı.</h2>
              <p>
                Class, level veya arama filtresi fazla sert olabilir. Büyüleri
                sorgu odasına almış gibiyiz.
              </p>
            </div>
          ) : (
            <div className="character-spell-list">
              {filteredSpellGroups.map((group) => (
                <div className="spell-level-group" key={group.level}>
                  <h3 className="spell-level-title">
                    {getSpellGroupTitle(group.level)}
                  </h3>

                  {group.spells.map((spell) => {
                    const isKnown = knownSpellIdSet.has(spell.id);
                    const isPrepared = preparedSpellIdSet.has(spell.id);
                    const isCantrip = spell.level === 0;

                    return (
                      <article
                        className={
                          isKnown
                            ? "character-spell-row selected"
                            : "character-spell-row"
                        }
                        key={spell.id}
                      >
                        <div>
                          <div className="character-spell-row-head">
                            <strong>{spell.name}</strong>
                            <span>{getSpellLevelLabel(spell)}</span>
                          </div>

                          <p>{spell.description}</p>

                          <div className="library-pill-row">
                            <span>{spell.school}</span>
                            <span>{spell.castingTime}</span>
                            <span>{spell.range}</span>
                            {spell.concentration ? <span>Concentration</span> : null}
                            {spell.ritual ? <span>Ritual</span> : null}
                          </div>
                        </div>

                        <div className="spell-row-actions">
                          <button
                            type="button"
                            className={isKnown ? "active" : ""}
                            onClick={() => toggleKnownSpell(spell.id)}
                          >
                            {isKnown ? "Known" : "Add"}
                          </button>

                          {isCantrip ? (
                            <span
                              className={
                                isKnown
                                  ? "spell-status-pill active"
                                  : "spell-status-pill"
                              }
                            >
                              Always Ready
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={isPrepared ? "active" : ""}
                              onClick={() => togglePreparedSpell(spell.id)}
                            >
                              {isPrepared ? "Prepared" : "Prepare"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}


function CharacterInventoryManager({
  title,
  description,
  rulesetData,
  isRulesetLoading,
  rulesetError,
  inventory,
  equippedArmorId,
  equippedShieldId,
  equippedWeaponIds,
  gold,
  abilities,
  armorClass,
  armorClassMode,
  onChange,
}: {
  title: string;
  description: string;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
  inventory: Character["inventory"];
  equippedArmorId: string | null;
  equippedShieldId: string | null;
  equippedWeaponIds: string[];
  gold: number;
  abilities: Character["abilities"];
  armorClass: number;
  armorClassMode: Character["armorClassMode"];
  onChange: (next: {
    inventory: Character["inventory"];
    equippedArmorId: string | null;
    equippedShieldId: string | null;
    equippedWeaponIds: string[];
    gold: number;
    armorClass: number;
    armorClassMode: Character["armorClassMode"];
  }) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | DndItemData["category"]>("all");

  const ownedItems = useMemo(
    () => getCharacterInventoryItems(inventory, rulesetData?.items),
    [inventory, rulesetData],
  );

  const totalWeight = useMemo(
    () => getInventoryWeight(inventory, rulesetData?.items),
    [inventory, rulesetData],
  );

  const suggestedAc = useMemo(
    () =>
      calculateSuggestedArmorClass(
        { abilities, equippedArmorId, equippedShieldId },
        rulesetData?.items,
      ),
    [abilities, equippedArmorId, equippedShieldId, rulesetData],
  );

  const effectiveAc = armorClassMode === "auto" ? suggestedAc : armorClass;

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
  }, [rulesetData, categoryFilter, searchTerm]);

  function emit(next: Partial<{
    inventory: Character["inventory"];
    equippedArmorId: string | null;
    equippedShieldId: string | null;
    equippedWeaponIds: string[];
    gold: number;
    armorClass: number;
    armorClassMode: Character["armorClassMode"];
  }>) {
    onChange({
      inventory,
      equippedArmorId,
      equippedShieldId,
      equippedWeaponIds,
      gold,
      armorClass,
      armorClassMode,
      ...next,
    });
  }

  function updateItemQuantity(itemId: string, quantity: number) {
    const nextInventory = setInventoryItemQuantity(inventory, itemId, quantity);
    const nextItemIds = new Set(nextInventory.map((entry) => entry.itemId));

    emit({
      inventory: nextInventory,
      equippedArmorId: equippedArmorId && nextItemIds.has(equippedArmorId) ? equippedArmorId : null,
      equippedShieldId: equippedShieldId && nextItemIds.has(equippedShieldId) ? equippedShieldId : null,
      equippedWeaponIds: equippedWeaponIds.filter((id) => nextItemIds.has(id)),
    });
  }

  function toggleEquip(item: DndItemData) {
    const quantity = getInventoryQuantity(inventory, item.id);
    const nextInventory = quantity > 0 ? inventory : setInventoryItemQuantity(inventory, item.id, 1);

    if (item.category === "armor") {
      emit({
        inventory: nextInventory,
        equippedArmorId: equippedArmorId === item.id ? null : item.id,
      });
      return;
    }

    if (item.category === "shield") {
      emit({
        inventory: nextInventory,
        equippedShieldId: equippedShieldId === item.id ? null : item.id,
      });
      return;
    }

    if (item.category === "weapon") {
      const isEquipped = equippedWeaponIds.includes(item.id);
      emit({
        inventory: nextInventory,
        equippedWeaponIds: isEquipped
          ? equippedWeaponIds.filter((id) => id !== item.id)
          : [...equippedWeaponIds, item.id].slice(-2),
      });
    }
  }

  function isEquipped(item: DndItemData) {
    return (
      equippedArmorId === item.id ||
      equippedShieldId === item.id ||
      equippedWeaponIds.includes(item.id)
    );
  }

  return (
    <section className="form-panel character-inventory-manager">
      <div className="inventory-manager-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="inventory-summary-grid">
          <div>
            <strong>{gold}</strong>
            <span>Gold</span>
          </div>
          <div>
            <strong>{ownedItems.length}</strong>
            <span>Items</span>
          </div>
          <div>
            <strong>{totalWeight.toFixed(1)}</strong>
            <span>lb</span>
          </div>
          <div>
            <strong>{effectiveAc}</strong>
            <span>Effective AC</span>
          </div>
        </div>
      </div>

      <div className="form-grid inventory-gold-grid">
        <label>
          Gold
          <input
            type="number"
            min={0}
            value={gold}
            onChange={(event) => emit({ gold: Math.max(0, Number(event.target.value)) })}
          />
        </label>

        <label>
          AC Mode
          <select
            value={armorClassMode}
            onChange={(event) =>
              emit({ armorClassMode: event.target.value as Character["armorClassMode"] })
            }
          >
            <option value="manual">Manual</option>
            <option value="auto">Auto from equipment</option>
          </select>
        </label>

        <label>
          Manual AC
          <input
            type="number"
            min={1}
            value={armorClass}
            disabled={armorClassMode === "auto"}
            onChange={(event) => emit({ armorClass: Number(event.target.value) })}
          />
        </label>

        <label>
          Suggested AC
          <input type="number" min={1} value={suggestedAc} readOnly />
        </label>
      </div>

      {isRulesetLoading ? (
        <div className="empty-panel">
          <h2>Item data yükleniyor...</h2>
          <p>Envanter rafları diziliyor. Sandık simülasyonu, insanlığın zirvesi.</p>
        </div>
      ) : rulesetError ? (
        <div className="empty-panel">
          <h2>Item data yüklenemedi</h2>
          <p>{rulesetError}</p>
        </div>
      ) : rulesetData ? (
        <>
          <div className="inventory-equipped-panel">
            <span className="mini-label">Equipped</span>
            <div className="inventory-equipped-grid">
              <div>
                <span>Armor</span>
                <strong>{ownedItems.find(({ item }) => item.id === equippedArmorId)?.item.name ?? "None"}</strong>
              </div>
              <div>
                <span>Shield</span>
                <strong>{ownedItems.find(({ item }) => item.id === equippedShieldId)?.item.name ?? "None"}</strong>
              </div>
              <div>
                <span>Weapons</span>
                <strong>
                  {equippedWeaponIds
                    .map((itemId) => ownedItems.find(({ item }) => item.id === itemId)?.item.name)
                    .filter(Boolean)
                    .join(", ") || "None"}
                </strong>
              </div>
            </div>
          </div>

          <div className="spell-selector-filters">
            <label>
              Ara
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Longsword, shield, holy symbol..."
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
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-panel">
              <h2>Item bulunamadı.</h2>
              <p>Filtreler itemları sürgüne göndermiş olabilir. Klasik dijital zalimlik.</p>
            </div>
          ) : (
            <div className="inventory-item-list">
              {filteredItems.map((item) => {
                const quantity = getInventoryQuantity(inventory, item.id);
                const equipped = isEquipped(item);

                return (
                  <article
                    className={quantity > 0 ? "inventory-item-row selected" : "inventory-item-row"}
                    key={item.id}
                  >
                    <div>
                      <div className="character-spell-row-head">
                        <strong>{item.name}</strong>
                        <span>{getItemCategoryLabel(item.category)}</span>
                      </div>
                      <p>{item.description}</p>
                      <div className="library-pill-row">
                        <span>{getItemRulesSummary(item)}</span>
                        <span>{item.cost}</span>
                        <span>{item.weight} lb</span>
                        {item.stealthDisadvantage ? <span>Stealth Disadv.</span> : null}
                        {item.strengthRequirement ? <span>STR {item.strengthRequirement}</span> : null}
                      </div>
                    </div>

                    <div className="inventory-row-actions">
                      <div className="inventory-qty-controls">
                        <button type="button" onClick={() => updateItemQuantity(item.id, quantity - 1)}>-</button>
                        <strong>{quantity}</strong>
                        <button type="button" onClick={() => updateItemQuantity(item.id, quantity + 1)}>+</button>
                      </div>

                      {item.category !== "gear" ? (
                        <button
                          type="button"
                          className={equipped ? "active" : ""}
                          onClick={() => toggleEquip(item)}
                        >
                          {equipped ? "Equipped" : "Equip"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </section>
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
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const builderSteps = [
    { id: "basic", title: "Basic", description: "İsim, oyuncu ve temel kimlik." },
    { id: "class", title: "Race & Class", description: "Tür, sınıf, seviye ve arka plan." },
    { id: "abilities", title: "Abilities", description: "Altı ability skoru ve modifierlar." },
    { id: "combat", title: "Combat", description: "HP, AC ve notlar." },
    { id: "spells", title: "Spells", description: "Known, prepared ve cantrip seçimi." },
    { id: "equipment", title: "Equipment", description: "Inventory, gold ve kuşanılan ekipman." },
    { id: "review", title: "Review", description: "Son kontrol ve kayıt." },
  ] as const;

  const activeStep = builderSteps[activeStepIndex];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === builderSteps.length - 1;

  const selectedRace = useMemo(() => {
    return rulesetData?.races.find((race) => race.name === draft.race) ?? null;
  }, [rulesetData, draft.race]);

  const selectedClass = useMemo(() => {
    return (
      rulesetData?.classes.find(
        (classItem) => classItem.name === draft.className,
      ) ?? null
    );
  }, [rulesetData, draft.className]);

  const knownSpells = useMemo(() => {
    const spellMap = new Map((rulesetData?.spells ?? []).map((spell) => [spell.id, spell]));
    return draft.knownSpellIds
      .map((spellId) => spellMap.get(spellId) ?? null)
      .filter((spell): spell is DndSpellData => Boolean(spell));
  }, [rulesetData, draft.knownSpellIds]);

  const preparedSpells = useMemo(() => {
    const preparedSet = new Set(draft.preparedSpellIds);
    return knownSpells.filter((spell) => spell.level === 0 || preparedSet.has(spell.id));
  }, [knownSpells, draft.preparedSpellIds]);

  const selectedInventoryItems = useMemo(() => {
    return getCharacterInventoryItems(draft.inventory, rulesetData?.items);
  }, [draft.inventory, rulesetData]);

  const inventoryWeight = useMemo(() => {
    return getInventoryWeight(draft.inventory, rulesetData?.items);
  }, [draft.inventory, rulesetData]);

  const effectiveArmorClass = calculateEffectiveArmorClass(draft, rulesetData?.items);
  const suggestedArmorClass = calculateSuggestedArmorClass(draft, rulesetData?.items);

  function updateDraft<K extends keyof CharacterDraft>(
    key: K,
    value: CharacterDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAbility(
    ability: keyof CharacterDraft["abilities"],
    value: number,
  ) {
    setDraft((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [ability]: value,
      },
    }));
  }

  function applyStandardArray() {
    setDraft((current) => ({
      ...current,
      abilities: {
        str: 15,
        dex: 14,
        con: 13,
        int: 12,
        wis: 10,
        cha: 8,
      },
    }));
  }

  function goToStep(index: number) {
    setActiveStepIndex(Math.min(builderSteps.length - 1, Math.max(0, index)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrevious() {
    goToStep(activeStepIndex - 1);
  }

  function goNext() {
    if (activeStep.id === "basic" && !draft.name.trim()) {
      alert("Karakter adı lazım kankam. İsimsiz kahraman ancak yan NPC olur.");
      return;
    }

    if (activeStep.id === "class" && !draft.className.trim()) {
      alert("Class seçmeden karakter olmaz. Sistem bile buna güler.");
      return;
    }

    goToStep(activeStepIndex + 1);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      alert("Karakter adı lazım kankam. İsimsiz kahraman ancak yan NPC olur.");
      goToStep(0);
      return;
    }

    if (!draft.className.trim()) {
      alert("Class seçmeden karakter olmaz. Sistem bile buna güler.");
      goToStep(1);
      return;
    }

    onCreateCharacter({
      ...draft,
      armorClass: calculateEffectiveArmorClass(draft, rulesetData?.items),
    });
    setDraft(emptyDraft);
    setActiveStepIndex(0);
  }

  const previewCharacter = useMemo(
    () => createCharacterFromDraft(draft),
    [draft],
  );

  return (
    <PageShell
      eyebrow="Character Builder"
      title="Yeni Karakter"
      description="Builder artık adım adım ilerliyor. Tek sayfada karakter, spell, inventory ve varoluş krizi taşımıyoruz."
    >
      <div className="builder-v2-layout">
        <aside className="builder-stepper">
          {builderSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={index === activeStepIndex ? "active" : ""}
              onClick={() => goToStep(index)}
            >
              <strong>{index + 1}. {step.title}</strong>
              <span>{step.description}</span>
            </button>
          ))}
        </aside>

        <form className="builder-form builder-v2-form" onSubmit={handleSubmit}>
          <div className="builder-step-head">
            <span className="mini-label">Step {activeStepIndex + 1} / {builderSteps.length}</span>
            <h2>{activeStep.title}</h2>
            <p>{activeStep.description}</p>
          </div>

          {activeStep.id === "basic" ? (
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
                    onChange={(event) => updateDraft("playerName", event.target.value)}
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
                        event.target.value as CharacterDraft["ruleset"],
                      )
                    }
                  >
                    <option value="dnd_2014">D&D 2014</option>
                    <option value="dnd_2024">D&D 2024</option>
                    <option value="homebrew">Homebrew</option>
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {activeStep.id === "class" ? (
            <section className="form-panel">
              <h2>Race & Class</h2>

              <div className="form-grid">
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
                        {isRulesetLoading ? "Race data yükleniyor..." : "Race seç"}
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
                    onChange={(event) => updateDraft("subclass", event.target.value)}
                    placeholder="Desert Domain..."
                  />
                </label>

                <label>
                  Background
                  <input
                    value={draft.background}
                    onChange={(event) => updateDraft("background", event.target.value)}
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
                <div className="builder-choice-grid">
                  {selectedRace ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Race</span>
                      <h3>{selectedRace.name}</h3>
                      <p>{selectedRace.description}</p>
                      <div className="preview-stats">
                        <span>Speed {selectedRace.speed} ft</span>
                        <span>Size {selectedRace.size}</span>
                        <span>
                          Bonus {" "}
                          {Object.entries(selectedRace.abilityBonuses)
                            .map(
                              ([ability, bonus]) =>
                                `${ability.toUpperCase()} +${bonus}`,
                            )
                            .join(", ")}
                        </span>
                      </div>
                    </article>
                  ) : null}

                  {selectedClass ? (
                    <article className="builder-choice-card">
                      <span className="mini-label">Class</span>
                      <h3>{selectedClass.name}</h3>
                      <p>{selectedClass.description}</p>
                      <div className="preview-stats">
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
                      </div>
                    </article>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {activeStep.id === "abilities" ? (
            <section className="form-panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Ability Scores</h2>
                  <p>Skorları gir, modifierlar otomatik hesaplanır. Matematik yine yazılıma kaldı, insanlık rahat.</p>
                </div>

                <button type="button" onClick={applyStandardArray}>
                  Standard Array
                </button>
              </div>

              <div className="ability-editor ability-editor-v2">
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
                          Number(event.target.value),
                        )
                      }
                    />

                    <strong>{formatModifier(getAbilityModifier(score))}</strong>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          {activeStep.id === "combat" ? (
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
                  Manual Armor Class
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

              <div className="builder-summary-grid">
                <div>
                  <span>Effective AC</span>
                  <strong>{effectiveArmorClass}</strong>
                </div>
                <div>
                  <span>Suggested AC</span>
                  <strong>{suggestedArmorClass}</strong>
                </div>
                <div>
                  <span>Initiative</span>
                  <strong>{formatModifier(getInitiative(previewCharacter))}</strong>
                </div>
                <div>
                  <span>Spell DC</span>
                  <strong>{getSpellSaveDc(previewCharacter)}</strong>
                </div>
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
          ) : null}

          {activeStep.id === "spells" ? (
            <CharacterSpellSelector
              title="Karakter Spellbook"
              description="Bu karakterin bildiği cantripleri ve hazırladığı büyüleri seç. Slotlar karakter detayında takip ediliyor."
              rulesetData={rulesetData}
              isRulesetLoading={isRulesetLoading}
              rulesetError={rulesetError}
              className={draft.className}
              knownSpellIds={draft.knownSpellIds}
              preparedSpellIds={draft.preparedSpellIds}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  knownSpellIds: next.knownSpellIds,
                  preparedSpellIds: next.preparedSpellIds,
                }))
              }
            />
          ) : null}

          {activeStep.id === "equipment" ? (
            <CharacterInventoryManager
              title="Inventory & Equipment"
              description="Karakterin itemlarını, altınını ve kuşandığı ekipmanı seç. AC auto ise zırh ve shield hesaba katılır."
              rulesetData={rulesetData}
              isRulesetLoading={isRulesetLoading}
              rulesetError={rulesetError}
              inventory={draft.inventory}
              equippedArmorId={draft.equippedArmorId}
              equippedShieldId={draft.equippedShieldId}
              equippedWeaponIds={draft.equippedWeaponIds}
              gold={draft.gold}
              abilities={draft.abilities}
              armorClass={draft.armorClass}
              armorClassMode={draft.armorClassMode}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  inventory: next.inventory,
                  equippedArmorId: next.equippedArmorId,
                  equippedShieldId: next.equippedShieldId,
                  equippedWeaponIds: next.equippedWeaponIds,
                  gold: next.gold,
                  armorClass: next.armorClass,
                  armorClassMode: next.armorClassMode,
                }))
              }
            />
          ) : null}

          {activeStep.id === "review" ? (
            <section className="form-panel preview-panel builder-review-panel">
              <h2>Review & Save</h2>
              <p>Kaydetmeden önce son kontrol. Sonra “Ben bunu böyle mi yapmışım?” demek yine mümkün ama en azından app uyarmış olur.</p>

              <div className="builder-review-hero">
                <div>
                  <span className="mini-label">Character</span>
                  <h2>{draft.name || "İsimsiz Karakter"}</h2>
                  <p>
                    {draft.race || "Unknown Race"} • {draft.className || "Unknown Class"} • Level {draft.level}
                  </p>
                </div>
                <strong className="level-badge">AC {effectiveArmorClass}</strong>
              </div>

              <div className="builder-summary-grid">
                <div>
                  <span>Max HP</span>
                  <strong>{draft.maxHp}</strong>
                </div>
                <div>
                  <span>PB</span>
                  <strong>+{getProficiencyBonus(previewCharacter.level)}</strong>
                </div>
                <div>
                  <span>Initiative</span>
                  <strong>{formatModifier(getInitiative(previewCharacter))}</strong>
                </div>
                <div>
                  <span>Passive Perception</span>
                  <strong>{getPassivePerception(previewCharacter)}</strong>
                </div>
                <div>
                  <span>Known Spells</span>
                  <strong>{knownSpells.length}</strong>
                </div>
                <div>
                  <span>Prepared / Ready</span>
                  <strong>{preparedSpells.length}</strong>
                </div>
                <div>
                  <span>Inventory</span>
                  <strong>{selectedInventoryItems.length}</strong>
                </div>
                <div>
                  <span>Weight</span>
                  <strong>{inventoryWeight} lb</strong>
                </div>
                <div>
                  <span>Gold</span>
                  <strong>{draft.gold}</strong>
                </div>
              </div>

              <div className="preview-stats">
                {Object.entries(draft.abilities).map(([ability, score]) => (
                  <span key={ability}>
                    {ability.toUpperCase()} {score} ({formatModifier(getAbilityModifier(score))})
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <div className="builder-navigation-bar">
            <button type="button" onClick={goPrevious} disabled={isFirstStep}>
              Geri
            </button>

            <div>
              <strong>{activeStep.title}</strong>
              <span>{activeStepIndex + 1} / {builderSteps.length}</span>
            </div>

            {isLastStep ? (
              <button className="primary-action" type="submit">
                Karakteri Kaydet
              </button>
            ) : (
              <button className="primary-action" type="button" onClick={goNext}>
                İleri
              </button>
            )}
          </div>
        </form>
      </div>
    </PageShell>
  );
}

function CharacterEditor({
  characters,
  onUpdateCharacter,
  rulesetData,
  isRulesetLoading,
  rulesetError,
}: {
  characters: Character[];
  onUpdateCharacter: (character: Character) => void;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
}) {
  const { characterId } = useParams();
  const navigate = useNavigate();

  const character = characters.find((item) => item.id === characterId);

  const [draft, setDraft] = useState<CharacterDraft>(emptyDraft);

  useEffect(() => {
    if (!character) {
      return;
    }

    setDraft({
      name: character.name,
      playerName: character.playerName,
      ruleset: character.ruleset,
      race: character.race,
      className: character.className,
      subclass: character.subclass,
      background: character.background,
      level: character.level,
      abilities: character.abilities,
      maxHp: character.maxHp,
      armorClass: character.armorClass,
      armorClassMode: character.armorClassMode === "auto" ? "auto" : "manual",
      knownSpellIds: character.knownSpellIds ?? [],
      preparedSpellIds: character.preparedSpellIds ?? [],
      spellSlots: normalizeSpellSlots(
        character.spellSlots,
        character.level,
        character.className,
      ),
      inventory: character.inventory ?? [],
      equippedArmorId: character.equippedArmorId ?? null,
      equippedShieldId: character.equippedShieldId ?? null,
      equippedWeaponIds: character.equippedWeaponIds ?? [],
      gold: character.gold ?? 0,
      notes: character.notes,
    });
  }, [character]);

  const selectedRace = useMemo(() => {
    return rulesetData?.races.find((race) => race.name === draft.race) ?? null;
  }, [rulesetData, draft.race]);

  const selectedClass = useMemo(() => {
    return (
      rulesetData?.classes.find(
        (classItem) => classItem.name === draft.className,
      ) ?? null
    );
  }, [rulesetData, draft.className]);

  function updateDraft<K extends keyof CharacterDraft>(
    key: K,
    value: CharacterDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAbility(
    ability: keyof CharacterDraft["abilities"],
    value: number,
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

    if (!character) {
      return;
    }

    if (!draft.name.trim()) {
      alert("Karakter adı lazım kankam. İsimsiz kahraman ancak yan NPC olur.");
      return;
    }

    if (!draft.className.trim()) {
      alert("Class seçmeden karakter olmaz. Sistem bile buna güler.");
      return;
    }

    const updatedCharacter: Character = {
      ...character,
      ...draft,
      armorClass: calculateEffectiveArmorClass(draft, rulesetData?.items),
      currentHp: Math.min(character.currentHp, draft.maxHp),
      spellSlots: normalizeSpellSlots(
        draft.spellSlots,
        draft.level,
        draft.className,
      ),
      updatedAt: new Date().toISOString(),
    };

    onUpdateCharacter(updatedCharacter);
    navigate(`/characters/${character.id}`);
  }

  const previewCharacter = useMemo(
    () => createCharacterFromDraft(draft),
    [draft],
  );

  if (!character) {
    return (
      <PageShell
        eyebrow="Character Editor"
        title="Karakter Bulunamadı"
        description="Düzenlenecek karakter ya silindi ya da Git conflict görüp kaçtı."
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

  return (
    <PageShell
      eyebrow="Character Editor"
      title={`${character.name} Düzenle`}
      description="Karakter bilgilerini güncelle. D&D karakterleri zaten sabit kalmaz, oyuncular da durduk yere fikir değiştirir."
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
                    event.target.value as CharacterDraft["ruleset"],
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
                    {isRulesetLoading ? "Race data yükleniyor..." : "Race seç"}
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
                    Bonus{" "}
                    {Object.entries(selectedRace.abilityBonuses)
                      .map(
                        ([ability, bonus]) =>
                          `${ability.toUpperCase()} +${bonus}`,
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
                    Saves{" "}
                    {selectedClass.savingThrows
                      .map((save) => save.toUpperCase())
                      .join(", ")}
                  </span>
                  <span>
                    Spell{" "}
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
                      Number(event.target.value),
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

        <CharacterSpellSelector
          title="Karakter Spellbook"
          description="Bu karakterin spell listesini güncelle. Oyuncular zaten her seviye atlayınca kimlik krizi geçiriyor."
          rulesetData={rulesetData}
          isRulesetLoading={isRulesetLoading}
          rulesetError={rulesetError}
          className={draft.className}
          knownSpellIds={draft.knownSpellIds}
          preparedSpellIds={draft.preparedSpellIds}
          onChange={(next) =>
            setDraft((current) => ({
              ...current,
              knownSpellIds: next.knownSpellIds,
              preparedSpellIds: next.preparedSpellIds,
            }))
          }
        />

        <CharacterInventoryManager
          title="Inventory & Equipment"
          description="Karakterin itemlarını ve kuşandığı ekipmanı güncelle. Çanta yönetimi, kahramanlığın en az havalı ama en gerekli tarafı."
          rulesetData={rulesetData}
          isRulesetLoading={isRulesetLoading}
          rulesetError={rulesetError}
          inventory={draft.inventory}
          equippedArmorId={draft.equippedArmorId}
          equippedShieldId={draft.equippedShieldId}
          equippedWeaponIds={draft.equippedWeaponIds}
          gold={draft.gold}
          abilities={draft.abilities}
          armorClass={draft.armorClass}
          armorClassMode={draft.armorClassMode}
          onChange={(next) =>
            setDraft((current) => ({
              ...current,
              inventory: next.inventory,
              equippedArmorId: next.equippedArmorId,
              equippedShieldId: next.equippedShieldId,
              equippedWeaponIds: next.equippedWeaponIds,
              gold: next.gold,
              armorClass: next.armorClass,
              armorClassMode: next.armorClassMode,
            }))
          }
        />

        <section className="form-panel preview-panel">
          <h2>Önizleme</h2>

          <div className="preview-stats">
            <span>PB +{getProficiencyBonus(previewCharacter.level)}</span>
            <span>AC {calculateEffectiveArmorClass(draft, rulesetData?.items)}</span>
            <span>HP {previewCharacter.maxHp}</span>
            <span>Init {formatModifier(getInitiative(previewCharacter))}</span>
            <span>PP {getPassivePerception(previewCharacter)}</span>
            <span>DC {getSpellSaveDc(previewCharacter)}</span>
            <span>
              Spell Attack{" "}
              {formatModifier(getSpellAttackBonus(previewCharacter))}
            </span>
          </div>

          <div className="character-actions">
            <button className="primary-action" type="submit">
              Değişiklikleri Kaydet
            </button>

            <button
              type="button"
              onClick={() => navigate(`/characters/${character.id}`)}
            >
              Vazgeç
            </button>
          </div>
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
    classesText: "Cleric, Wizard",
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
    armorClassBonus: "",
    armorType: "light",
    dexBonusMax: "",
    damage: "",
    damageType: "",
    propertiesText: "",
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

  function handleCreateSpell(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spellForm.name.trim()) {
      alert("Spell adı lazım kankam. Büyü isimsiz olunca DM bile anlamıyor.");
      return;
    }

    if (!spellForm.description.trim()) {
      alert("Spell açıklaması lazım. Sadece havalı isimle büyü olmuyor, maalesef.");
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
      classes: parseTextList(spellForm.classesText),
      description: spellForm.description.trim(),
      higherLevels: spellForm.higherLevels.trim() || undefined,
    });

    setSpellForm((current) => ({
      ...current,
      name: "",
      description: "",
      higherLevels: "",
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
        itemForm.category === "weapon"
          ? parseTextList(itemForm.propertiesText)
          : undefined,
      range: itemForm.category === "weapon" ? itemForm.range.trim() : undefined,
      tags: ["homebrew"],
    });

    setItemForm((current) => ({
      ...current,
      name: "",
      description: "",
      damage: "",
      damageType: "",
      propertiesText: "",
      range: "",
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
              <span className="mini-label">Creator</span>
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
              </select>
            </label>

            <label>
              School
              <input
                value={spellForm.school}
                onChange={(event) => updateSpellForm("school", event.target.value)}
                placeholder="Evocation"
              />
            </label>

            <label>
              Classes
              <input
                value={spellForm.classesText}
                onChange={(event) =>
                  updateSpellForm("classesText", event.target.value)
                }
                placeholder="Cleric, Wizard"
              />
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
              placeholder="Spell ne yapıyor? Zar, save, damage, condition..."
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
              <span className="mini-label">Creator</span>
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
                <input
                  value={itemForm.damageType}
                  onChange={(event) =>
                    updateItemForm("damageType", event.target.value)
                  }
                  placeholder="slashing"
                />
              </label>

              <label>
                Properties
                <input
                  value={itemForm.propertiesText}
                  onChange={(event) =>
                    updateItemForm("propertiesText", event.target.value)
                  }
                  placeholder="Finesse, Light"
                />
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
