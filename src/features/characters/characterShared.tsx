import { useEffect, useMemo, useState } from "react";
import type { DndItemData, DndSpellData, RulesetData } from "../../core/rulesets/ruleset.types";
import type { Character, CharacterDraft, CharacterHitDiePool } from "../../core/character/character.types";
import { formatModifier, getAbilityModifier, getProficiencyBonus } from "../../core/character/characterCalculator";
import { getHighestSpellLevel, getSpellMechanicSummary } from "../../core/rulesets/spellRules";
import { getItemSearchText, getWeaponMastery } from "../../core/rulesets/equipmentRules";
import { getClassResources, mergeClassResources } from "../../core/rulesets/classFeatureEngine";
import { canPrepareSpell, canRitualCast, canSelectKnownSpell, getSpellcastingProfile } from "../../core/rulesets/spellcastingRules";

export const emptyDraft: CharacterDraft = {
  name: "",
  playerName: "",
  ruleset: "dnd_2014",
  race: "",
  subrace: "",
  className: "",
  subclass: "",
  background: "",
  originAbilityPrimary: undefined,
  originAbilitySecondary: undefined,
  featIds: [],
  fightingStyleIds: [],
  masteredWeaponIds: [],
  skillProficiencies: [],
  expertiseSkills: [],
  toolProficiencies: [],
  languages: [],
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
  deathSaves: {
    successes: 0,
    failures: 0,
  },
  hitDice: [{ die: 8, max: 1, used: 0 }],
  exhaustion: 0,
  conditionDurations: {},
  notes: "",
};

const draftArrayKeys = [
  "featIds", "fightingStyleIds", "masteredWeaponIds", "skillProficiencies", "expertiseSkills", "toolProficiencies", "languages",
  "knownSpellIds", "preparedSpellIds", "spellSlots", "inventory", "equippedWeaponIds", "hitDice",
] as const;

export function normalizeCharacterDraft(value: unknown, fallback: CharacterDraft = emptyDraft): CharacterDraft {
  const candidate = value && typeof value === "object" ? value as Partial<CharacterDraft> : {};
  const normalized: CharacterDraft = {
    ...fallback,
    ...candidate,
    abilities: { ...fallback.abilities, ...(candidate.abilities ?? {}) },
    deathSaves: { ...fallback.deathSaves, ...(candidate.deathSaves ?? {}) },
    conditionDurations: { ...fallback.conditionDurations, ...(candidate.conditionDurations ?? {}) },
  };

  for (const key of draftArrayKeys) {
    if (!Array.isArray(candidate[key])) {
      (normalized[key] as unknown) = fallback[key];
    }
  }
  return normalized;
}


export const FULL_CASTER_CLASSES = new Set([
  "bard",
  "cleric",
  "druid",
  "sorcerer",
  "wizard",
]);

export const FULL_CASTER_SLOT_TABLE: Record<number, number[]> = {
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

const HIT_DIE_BY_CLASS: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
};

export function getHitDieForClass(className: string, fallbackDie?: number) {
  return fallbackDie ?? HIT_DIE_BY_CLASS[className.trim().toLowerCase()] ?? 8;
}

export function normalizeHitDice(
  currentHitDice: CharacterHitDiePool[] | undefined,
  level: number,
  className: string,
  fallbackDie?: number,
): CharacterHitDiePool[] {
  const safeLevel = Math.min(20, Math.max(1, Math.floor(level)));
  const die = getHitDieForClass(className, fallbackDie);
  const existingPool = currentHitDice?.find((pool) => pool.die === die) ?? currentHitDice?.[0];

  return [
    {
      die,
      max: safeLevel,
      used: Math.min(safeLevel, Math.max(0, existingPool?.used ?? 0)),
    },
  ];
}

export function resetHitDice(hitDice: CharacterHitDiePool[]) {
  return hitDice.map((pool) => ({ ...pool, used: 0 }));
}

export function resetDeathSaves() {
  return {
    successes: 0,
    failures: 0,
  };
}

export function getDefaultSpellSlots(
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

export function normalizeSpellSlots(
  currentSlots: Character["spellSlots"] | undefined,
  level: number,
  className: string,
): Character["spellSlots"] {
  const defaults = getDefaultSpellSlots(level, className);

  if (defaults.length === 0 && currentSlots?.length) {
    return currentSlots.map((slot) => ({ level: slot.level, max: Math.max(0, slot.max), used: Math.min(Math.max(0, slot.max), Math.max(0, slot.used)) }));
  }

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

export function resetSpellSlots(
  spellSlots: Character["spellSlots"],
): Character["spellSlots"] {
  return spellSlots.map((slot) => ({
    ...slot,
    used: 0,
  }));
}

export function getInventoryQuantity(
  inventory: Character["inventory"],
  itemId: string,
) {
  return inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
}

export function setInventoryItemQuantity(
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

export function getCharacterInventoryItems(
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

export function getInventoryWeight(
  inventory: Character["inventory"],
  items: DndItemData[] | undefined,
) {
  return getCharacterInventoryItems(inventory, items).reduce(
    (total, { entry, item }) => total + entry.quantity * item.weight,
    0,
  );
}

export function getEquippedItems(character: Character, items: DndItemData[] | undefined) {
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

export function calculateSuggestedArmorClass(
  character: Pick<Character, "abilities" | "equippedArmorId" | "equippedShieldId" | "fightingStyleIds">,
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

  if (armor?.category === "armor" && character.fightingStyleIds?.includes("defense")) armorClass += 1;

  return armorClass;
}

export function calculateEffectiveArmorClass(
  character: Pick<Character, "abilities" | "armorClass" | "armorClassMode" | "equippedArmorId" | "equippedShieldId" | "fightingStyleIds">,
  items: DndItemData[] | undefined,
) {
  if (character.armorClassMode !== "auto") {
    return character.armorClass;
  }

  return calculateSuggestedArmorClass(character, items);
}

export function getWeaponAbilityModifier(character: Character, weapon: DndItemData) {
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

export function getWeaponAttackBonus(character: Character, weapon: DndItemData) {
  const properties = weapon.properties?.map((property) => property.toLowerCase()) ?? [];
  const isRangedWeapon = properties.includes("ammunition") || weapon.id.includes("bow") || weapon.id.includes("crossbow");
  const styleBonus = isRangedWeapon && character.fightingStyleIds?.includes("archery") ? 2 : 0;
  return getWeaponAbilityModifier(character, weapon) + getProficiencyBonus(character.level) + styleBonus;
}

export function getWeaponDamageSummary(character: Character, weapon: DndItemData) {
  const abilityModifier = getWeaponAbilityModifier(character, weapon);
  const properties = weapon.properties?.map((property) => property.toLowerCase()) ?? [];
  const isTwoHanded = properties.some((property) => property.includes("two-handed"));
  const duelingBonus = character.fightingStyleIds?.includes("dueling") && !weapon.range && !isTwoHanded && character.equippedWeaponIds.length === 1 ? 2 : 0;
  const thrownBonus = character.fightingStyleIds?.includes("thrown-weapon-fighting") && properties.includes("thrown") ? 2 : 0;
  const totalModifier = abilityModifier + duelingBonus + thrownBonus;
  const modifierText = totalModifier === 0 ? "" : ` ${formatModifier(totalModifier)}`;

  return `${weapon.damage ?? "1"}${modifierText} ${weapon.damageType ?? "damage"}`;
}

export function getItemCategoryLabel(category: DndItemData["category"]) {
  const labels: Record<DndItemData["category"], string> = {
    weapon: "Weapon",
    armor: "Armor",
    shield: "Shield",
    gear: "Gear",
    tool: "Tool",
    pack: "Pack",
    ammunition: "Ammunition",
  };

  return labels[category];
}

export function getItemRulesSummary(item: DndItemData, rulesetId = "dnd_2014") {
  if (item.category === "weapon") {
    const mastery = getWeaponMastery(item, rulesetId);
    return [item.damage, item.damageType, item.range ? `Range ${item.range}` : null, mastery ? `Mastery: ${mastery}` : null]
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

export function createCharacterFromDraft(draft: CharacterDraft): Character {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ...draft,
    spellSlots: normalizeSpellSlots(
      draft.spellSlots,
      draft.level,
      draft.className,
    ),
    hitDice: normalizeHitDice(draft.hitDice, draft.level, draft.className),
    resources: mergeClassResources(draft.resources, getClassResources(draft.className, draft.level, draft.abilities, draft.ruleset)),
    deathSaves: resetDeathSaves(),
    exhaustion: 0,
    conditionDurations: {},
    currentHp: draft.maxHp,
    tempHp: 0,
    conditions: [],
    createdAt: now,
    updatedAt: now,
  };
}


export function getSpellLevelLabel(spell: DndSpellData) {
  return spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
}

export function getSpellGroupTitle(level: number) {
  return level === 0 ? "Cantrips" : `Level ${level} Spells`;
}

export function sortSpellsByLevelAndName(spells: DndSpellData[]) {
  return [...spells].sort((firstSpell, secondSpell) => {
    if (firstSpell.level !== secondSpell.level) {
      return firstSpell.level - secondSpell.level;
    }

    return firstSpell.name.localeCompare(secondSpell.name);
  });
}

export function getSpellLevelGroups(spells: DndSpellData[]) {
  const sortedSpells = sortSpellsByLevelAndName(spells);
  const levels = Array.from(
    new Set(sortedSpells.map((spell) => spell.level)),
  ).sort((firstLevel, secondLevel) => firstLevel - secondLevel);

  return levels.map((level) => ({
    level,
    spells: sortedSpells.filter((spell) => spell.level === level),
  }));
}

export function isSpellReadyToCast(
  spell: DndSpellData,
  preparedSpellIdSet: Set<string>,
) {
  return spell.level === 0 || preparedSpellIdSet.has(spell.id);
}

export function CharacterSpellSelector({
  title,
  description,
  rulesetData,
  isRulesetLoading,
  rulesetError,
  className,
  characterLevel,
  abilities,
  knownSpellIds,
  preparedSpellIds,
  alwaysPreparedSpellIds = [],
  onChange,
}: {
  title: string;
  description: string;
  rulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
  className: string;
  characterLevel: number;
  abilities: Character["abilities"];
  knownSpellIds: string[];
  preparedSpellIds: string[];
  alwaysPreparedSpellIds?: string[];
  onChange: (next: {
    knownSpellIds: string[];
    preparedSpellIds: string[];
  }) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const normalizedClassName = className.trim().toLowerCase();
  const selectedClassData = rulesetData?.classes.find((item) => item.name.toLowerCase() === normalizedClassName);
  const highestSpellLevel = getHighestSpellLevel(selectedClassData, characterLevel);
  const spellcastingProfile = getSpellcastingProfile(selectedClassData ?? null, characterLevel, abilities, rulesetData?.id ?? "dnd_2014");

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

      const matchesAvailableLevel = spell.level === 0 || spell.level <= highestSpellLevel;
      return matchesClass && matchesLevel && matchesSearch && matchesAvailableLevel;
    });
  }, [rulesetData, searchTerm, levelFilter, normalizedClassName, highestSpellLevel]);

  const knownSpellIdSet = useMemo(
    () => new Set(knownSpellIds),
    [knownSpellIds],
  );

  const preparedSpellIdSet = useMemo(
    () => new Set(preparedSpellIds),
    [preparedSpellIds],
  );
  const alwaysPreparedSpellIdSet = useMemo(() => new Set(alwaysPreparedSpellIds), [alwaysPreparedSpellIds]);
  const normalPreparedSpellIds = preparedSpellIds.filter((id) => !alwaysPreparedSpellIdSet.has(id));
  const knownSpellData = (rulesetData?.spells ?? []).filter((spell) => knownSpellIdSet.has(spell.id));

  useEffect(() => {
    const missingKnown = alwaysPreparedSpellIds.filter((id) => !knownSpellIdSet.has(id));
    const missingPrepared = alwaysPreparedSpellIds.filter((id) => !preparedSpellIdSet.has(id));
    if (!missingKnown.length && !missingPrepared.length) return;
    onChange({ knownSpellIds: [...new Set([...knownSpellIds, ...alwaysPreparedSpellIds])], preparedSpellIds: [...new Set([...preparedSpellIds, ...alwaysPreparedSpellIds])] });
  }, [alwaysPreparedSpellIds, knownSpellIdSet, knownSpellIds, onChange, preparedSpellIdSet, preparedSpellIds]);

  const filteredSpellGroups = getSpellLevelGroups(filteredSpells);

  const knownCantripCount =
    rulesetData?.spells.filter(
      (spell) => spell.level === 0 && knownSpellIdSet.has(spell.id),
    ).length ?? 0;

  function toggleKnownSpell(spellId: string) {
    if (alwaysPreparedSpellIdSet.has(spellId)) return;
    const isKnown = knownSpellIdSet.has(spellId);

    if (isKnown) {
      onChange({
        knownSpellIds: knownSpellIds.filter((id) => id !== spellId),
        preparedSpellIds: preparedSpellIds.filter((id) => id !== spellId),
      });
      return;
    }
    const spell = rulesetData?.spells.find((item) => item.id === spellId);
    if (!spell || !canSelectKnownSpell(spell, knownSpellData, spellcastingProfile)) return;

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
    const spell = rulesetData?.spells.find((item) => item.id === spellId);
    if (!spell || !canPrepareSpell(spell, normalPreparedSpellIds, spellcastingProfile)) return;

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
          <span>{knownCantripCount}/{spellcastingProfile.cantripLimit} cantrip</span>
          <span>{normalPreparedSpellIds.length}/{spellcastingProfile.preparedSpellLimit ?? "∞"} prepared</span>
          {alwaysPreparedSpellIds.length ? <span>{alwaysPreparedSpellIds.length} always prepared</span> : null}
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
                    const isAlwaysPrepared = alwaysPreparedSpellIdSet.has(spell.id);

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
                          <small className="spell-mechanic-inline">{getSpellMechanicSummary(spell)}</small>

                          <div className="library-pill-row">
                            <span>{spell.school}</span>
                            <span>{spell.castingTime}</span>
                            <span>{spell.range}</span>
                            {spell.concentration ? <span>Concentration</span> : null}
                            {spell.ritual ? <span>Ritual</span> : null}
                            {canRitualCast(spell, spellcastingProfile, knownSpellIds) ? <span>Ritual Ready</span> : null}
                          </div>
                        </div>

                        <div className="spell-row-actions">
                          <button
                            type="button"
                            className={isKnown ? "active" : ""}
                            disabled={!isKnown && !canSelectKnownSpell(spell, knownSpellData, spellcastingProfile)}
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
                          ) : isAlwaysPrepared ? (
                            <span className="spell-status-pill active">Always Prepared</span>
                          ) : (
                            <button
                              type="button"
                              className={isPrepared ? "active" : ""}
                              disabled={!isPrepared && !canPrepareSpell(spell, normalPreparedSpellIds, spellcastingProfile)}
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


export function CharacterInventoryManager({
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
      const matchesSearch = normalizedSearch.length === 0 ||
        getItemSearchText(item, rulesetData?.id ?? "dnd_2014").includes(normalizedSearch);

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
                <option value="tool">Tool</option>
                <option value="pack">Pack</option>
                <option value="ammunition">Ammunition</option>
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
                        <span>{getItemRulesSummary(item, rulesetData?.id)}</span>
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

                      {["weapon", "armor", "shield"].includes(item.category) ? (
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
