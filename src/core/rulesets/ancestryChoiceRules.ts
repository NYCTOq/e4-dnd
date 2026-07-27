import type { AbilityKey, CharacterDraft, RulesetId } from "../character/character.types";
import type { DndRaceData } from "./ruleset.types";

export type AncestryChoiceOption = {
  id: string;
  name: string;
  summary: string;
  resistance?: string;
  spells?: string[];
  skill?: string;
  speedBonus?: number;
};

export type AncestryBuilderContract = {
  choiceLabel?: string;
  choiceRequired: boolean;
  options: AncestryChoiceOption[];
  skillChoiceCount: number;
  fixedSkills: string[];
  originFeatChoiceCount: number;
  languageChoiceCount: number;
  sizeChoice: boolean;
  spellChoice?: {
    label: string;
    count: number;
    source: "wizard-cantrip" | "any-cantrip";
  };
  notices: string[];
};

const EMPTY: AncestryBuilderContract = {
  choiceRequired: false,
  options: [],
  skillChoiceCount: 0,
  fixedSkills: [],
  originFeatChoiceCount: 0,
  languageChoiceCount: 0,
  sizeChoice: false,
  notices: [],
};

const options = (...items: AncestryChoiceOption[]) => items;

export function getAncestryBuilderContract(
  ruleset: RulesetId,
  race: DndRaceData | null,
  subraceName = "",
  level = 1,
): AncestryBuilderContract {
  if (!race || ruleset === "homebrew") return EMPTY;
  const name = race.name.toLowerCase();
  const subrace = subraceName.toLowerCase();

  if (ruleset === "dnd_2024") {
    if (name === "human") {
      return {
        ...EMPTY,
        skillChoiceCount: 1,
        originFeatChoiceCount: 1,
        sizeChoice: true,
        notices: ["Resourceful: Long Rest sonunda Heroic Inspiration kazanır."],
      };
    }
    if (name === "aasimar") {
      return {
        ...EMPTY,
        choiceLabel: "Celestial Revelation",
        choiceRequired: level >= 3,
        options: level >= 3 ? options(
          { id: "heavenly-wings", name: "Heavenly Wings", summary: "Geçici uçuş formu." },
          { id: "inner-radiance", name: "Inner Radiance", summary: "Yakındaki hedeflere ışınımsal baskı." },
          { id: "necrotic-shroud", name: "Necrotic Shroud", summary: "Korkutucu nekrotik dönüşüm." },
        ) : [],
        sizeChoice: true,
        notices: ["Light cantrip otomatik gelir.", "Healing Hands aktif ancestry kullanımıdır."],
      };
    }
    if (name === "dragonborn") {
      return {
        ...EMPTY,
        choiceLabel: "Draconic Ancestry",
        choiceRequired: true,
        options: options(
          { id: "acid", name: "Acid", summary: "Asit breath ve resistance.", resistance: "acid" },
          { id: "cold", name: "Cold", summary: "Soğuk breath ve resistance.", resistance: "cold" },
          { id: "fire", name: "Fire", summary: "Ateş breath ve resistance.", resistance: "fire" },
          { id: "lightning", name: "Lightning", summary: "Yıldırım breath ve resistance.", resistance: "lightning" },
          { id: "poison", name: "Poison", summary: "Zehir breath ve resistance.", resistance: "poison" },
        ),
        notices: [level >= 5 ? "Draconic Flight kullanılabilir." : "Draconic Flight level 5'te açılır."],
      };
    }
    if (name === "elf") {
      return {
        ...EMPTY,
        choiceLabel: "Elven Lineage",
        choiceRequired: true,
        options: options(
          { id: "drow", name: "Drow", summary: "Drow büyü ilerlemesi.", spells: ["Dancing Lights", "Faerie Fire", "Darkness"] },
          { id: "high-elf", name: "High Elf", summary: "Wizard cantrip ve arcane lineage.", spells: ["Prestidigitation", "Detect Magic", "Misty Step"] },
          { id: "wood-elf", name: "Wood Elf", summary: "Hız ve primal lineage.", spells: ["Druidcraft", "Longstrider", "Pass without Trace"], speedBonus: 5 },
        ),
        skillChoiceCount: 1,
        notices: ["Keen Senses bir skill seçtirir.", "Trance ve Fey Ancestry sheet özelliğine eklenir."],
      };
    }
    if (name === "gnome") {
      return {
        ...EMPTY,
        choiceLabel: "Gnomish Lineage",
        choiceRequired: true,
        options: options(
          { id: "forest-gnome", name: "Forest Gnome", summary: "Minor Illusion ve hayvan iletişimi.", spells: ["Minor Illusion"] },
          { id: "rock-gnome", name: "Rock Gnome", summary: "Mending, Prestidigitation ve mekanik cihazlar.", spells: ["Mending", "Prestidigitation"] },
        ),
      };
    }
    if (name === "goliath") {
      return {
        ...EMPTY,
        choiceLabel: "Giant Ancestry",
        choiceRequired: true,
        options: options(
          { id: "cloud", name: "Cloud's Jaunt", summary: "Kısa menzilli teleport." },
          { id: "fire", name: "Fire's Burn", summary: "Ek ateş hasarı." },
          { id: "frost", name: "Frost's Chill", summary: "Hedefin hızını düşürür." },
          { id: "hill", name: "Hill's Tumble", summary: "Hedefi prone eder." },
          { id: "stone", name: "Stone's Endurance", summary: "Reaction ile hasar azaltır." },
          { id: "storm", name: "Storm's Thunder", summary: "Reaction ile yıldırım karşılığı." },
        ),
        notices: [level >= 5 ? "Large Form kullanılabilir." : "Large Form level 5'te açılır."],
      };
    }
    if (name === "halfling") {
      return { ...EMPTY, fixedSkills: ["Stealth"], notices: ["Luck, Brave ve Nimbleness sheet özelliğine eklenir."] };
    }
    if (name === "orc") {
      return { ...EMPTY, notices: ["Adrenaline Rush ve Relentless Endurance kullanım sayaçları oluşturulur."] };
    }
    if (name === "tiefling") {
      return {
        ...EMPTY,
        choiceLabel: "Fiendish Legacy",
        choiceRequired: true,
        options: options(
          { id: "abyssal", name: "Abyssal", summary: "Poison temalı legacy.", resistance: "poison", spells: ["Poison Spray", "Ray of Sickness", "Hold Person"] },
          { id: "chthonic", name: "Chthonic", summary: "Necrotic temalı legacy.", resistance: "necrotic", spells: ["Chill Touch", "False Life", "Ray of Enfeeblement"] },
          { id: "infernal", name: "Infernal", summary: "Fire temalı legacy.", resistance: "fire", spells: ["Fire Bolt", "Hellish Rebuke", "Darkness"] },
        ),
        sizeChoice: true,
        notices: ["Thaumaturgy/Otherworldly Presence lineage dışı otomatik özellik olarak tutulur."],
      };
    }
    return EMPTY;
  }

  if (name === "human") return { ...EMPTY, languageChoiceCount: 1 };
  if (name === "half-elf") return { ...EMPTY, skillChoiceCount: 2, languageChoiceCount: 1 };
  if (name === "half-orc") return { ...EMPTY, fixedSkills: ["Intimidation"], notices: ["Relentless Endurance için Long Rest kullanımı oluşturulur."] };
  if (name === "elf" && subrace === "high elf") {
    return { ...EMPTY, languageChoiceCount: 1, spellChoice: { label: "High Elf Wizard Cantrip", count: 1, source: "wizard-cantrip" } };
  }
  if (name === "elf") return { ...EMPTY, fixedSkills: ["Perception"] };
  if (name === "dragonborn") {
    return {
      ...EMPTY,
      choiceLabel: "Draconic Ancestry",
      choiceRequired: true,
      options: options(
        { id: "black-copper", name: "Acid", summary: "Acid breath ve resistance.", resistance: "acid" },
        { id: "silver-white", name: "Cold", summary: "Cold breath ve resistance.", resistance: "cold" },
        { id: "brass-gold-red", name: "Fire", summary: "Fire breath ve resistance.", resistance: "fire" },
        { id: "blue-bronze", name: "Lightning", summary: "Lightning breath ve resistance.", resistance: "lightning" },
        { id: "green", name: "Poison", summary: "Poison breath ve resistance.", resistance: "poison" },
      ),
    };
  }
  if (name === "tiefling") {
    return { ...EMPTY, notices: ["Thaumaturgy level 1, Hellish Rebuke level 3, Darkness level 5 otomatik ancestry spell olarak eklenir."] };
  }
  if (name === "gnome" && subrace === "forest gnome") {
    return { ...EMPTY, notices: ["Minor Illusion otomatik ancestry cantrip olarak eklenir."] };
  }
  return EMPTY;
}

export function getSelectedAncestryOption(
  contract: AncestryBuilderContract,
  selectedId?: string,
) {
  return contract.options.find((option) => option.id === selectedId) ?? null;
}

export function getAncestryGrantedSpells(
  ruleset: RulesetId,
  raceName: string,
  subraceName: string,
  level: number,
  selectedOption: AncestryChoiceOption | null,
  chosenSpellIds: string[] = [],
) {
  const spells = [...chosenSpellIds];
  const race = raceName.toLowerCase();
  const subrace = subraceName.toLowerCase();

  if (ruleset === "dnd_2024" && race === "aasimar") spells.push("Light");
  if (ruleset === "dnd_2014" && race === "tiefling") {
    spells.push("Thaumaturgy");
    if (level >= 3) spells.push("Hellish Rebuke");
    if (level >= 5) spells.push("Darkness");
  }
  if (ruleset === "dnd_2014" && race === "gnome" && subrace === "forest gnome") spells.push("Minor Illusion");

  for (const [index, spell] of (selectedOption?.spells ?? []).entries()) {
    if (index === 0 || level >= index * 2 + 1) spells.push(spell);
  }
  return [...new Set(spells)];
}

export function getAncestryValidationErrors(
  draft: CharacterDraft,
  race: DndRaceData | null,
) {
  const contract = getAncestryBuilderContract(draft.ruleset, race, draft.subrace, draft.level);
  const errors: string[] = [];
  if (contract.choiceRequired && !draft.ancestryChoiceId) errors.push(`${contract.choiceLabel ?? "Ancestry seçimi"} tamamlanmalı.`);
  if (contract.sizeChoice && !draft.ancestrySize) errors.push("Small veya Medium boyut seçilmeli.");
  if ((draft.ancestrySkillProficiencies?.length ?? 0) !== contract.skillChoiceCount) {
    if (contract.skillChoiceCount) errors.push(`${contract.skillChoiceCount} ancestry skill seçilmeli.`);
  }
  if (contract.originFeatChoiceCount && !draft.ancestryOriginFeatId) errors.push("Species kaynaklı Origin Feat seçilmeli.");
  if ((draft.ancestryLanguageChoices?.length ?? 0) !== contract.languageChoiceCount) {
    if (contract.languageChoiceCount) errors.push(`${contract.languageChoiceCount} ancestry language seçilmeli.`);
  }
  if (contract.spellChoice && (draft.ancestrySpellIds?.length ?? 0) !== contract.spellChoice.count) {
    errors.push(`${contract.spellChoice.label} seçilmeli.`);
  }
  return errors;
}

export function mergeAncestrySkills(
  backgroundAndClassSkills: string[],
  contract: AncestryBuilderContract,
  selectedSkills: string[] = [],
) {
  return [...new Set([...backgroundAndClassSkills, ...contract.fixedSkills, ...selectedSkills])];
}

export function getAncestryAbilityOptions(): AbilityKey[] {
  return ["str", "dex", "con", "int", "wis", "cha"];
}
