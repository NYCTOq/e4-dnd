import { AutosaveStatus } from "../../shared/forms/AutosaveStatus";
import { useAutosavedDraft } from "../../shared/state/useAutosavedDraft";
import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
  SpellEffectType,
  SpellResolutionType,
} from "../../core/rulesets/ruleset.types";
import type { Character } from "../../core/character/character.types";
import { PageShell } from "../../shared/layout/PageShell";
import { HomebrewPackageCreator } from "./HomebrewPackageCreator";
import {
  formatMonsterModifier,
  getMonsterAbilityModifier,
} from "../monsters/monsterUtils";

function parseTextList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

export function HomebrewLab({
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
  const {
    value: spellForm,
    setValue: setSpellForm,
    clearDraft: clearSpellForm,
    lastSavedAt: spellFormSavedAt,
    restoredAt: spellFormRestoredAt,
  } = useAutosavedDraft(
    "e4_dnd_draft_homebrew_spell_v1",
    {
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
  },
    { isMeaningful: (value) => Boolean(value.name.trim() || value.description.trim() || value.damageDice.trim() || value.healingDice.trim() || value.higherLevels.trim()) },
  );

  const {
    value: itemForm,
    setValue: setItemForm,
    clearDraft: clearItemForm,
    lastSavedAt: itemFormSavedAt,
    restoredAt: itemFormRestoredAt,
  } = useAutosavedDraft(
    "e4_dnd_draft_homebrew_item_v1",
    {
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
  },
    { isMeaningful: (value) => Boolean(value.name.trim() || value.description.trim() || value.damage.trim() || value.cost.trim()) },
  );

  const {
    value: monsterForm,
    setValue: setMonsterForm,
    clearDraft: clearMonsterForm,
    lastSavedAt: monsterFormSavedAt,
    restoredAt: monsterFormRestoredAt,
  } = useAutosavedDraft(
    "e4_dnd_draft_homebrew_monster_v1",
    {
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
  },
    { isMeaningful: (value) => Boolean(value.name.trim() || value.description.trim() || value.traitsText.trim() || value.actionsText.trim()) },
  );

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
      effectType: spellForm.effectType.toLowerCase() as SpellEffectType,
      attackType: spellForm.attackType as SpellResolutionType,
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
      <HomebrewPackageCreator />

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
          <AutosaveStatus
            label="Spell taslağı"
            lastSavedAt={spellFormSavedAt}
            restoredAt={spellFormRestoredAt}
            onClear={() => {
              if (confirm("Spell taslağı temizlensin mi?")) clearSpellForm();
            }}
          />
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
          <AutosaveStatus
            label="Item taslağı"
            lastSavedAt={itemFormSavedAt}
            restoredAt={itemFormRestoredAt}
            onClear={() => {
              if (confirm("Item taslağı temizlensin mi?")) clearItemForm();
            }}
          />
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
          <AutosaveStatus
            label="Monster/NPC taslağı"
            lastSavedAt={monsterFormSavedAt}
            restoredAt={monsterFormRestoredAt}
            onClear={() => {
              if (confirm("Monster/NPC taslağı temizlensin mi?")) clearMonsterForm();
            }}
          />
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
