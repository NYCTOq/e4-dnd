import type { AbilityKey, CharacterCondition, RulesetId } from "../character/character.types";
import type { DndSpellData } from "./ruleset.types";

export type RepeatSaveTiming = "end-of-turn" | "start-of-turn" | "enter-or-start";

export interface ControlSpellRuntime {
  spellId: string;
  targetCount: number;
  saveAbility: AbilityKey | null;
  conditions: CharacterCondition[];
  conditionChoice: CharacterCondition[];
  repeatSave: boolean;
  repeatSaveTiming: RepeatSaveTiming | null;
  endOnDamage: boolean;
  endOnAllyAction: boolean;
  concentration: boolean;
  attackRollBonusDice: string | null;
  savingThrowBonusDice: string | null;
  attackRollPenaltyDice: string | null;
  savingThrowPenaltyDice: string | null;
  armorClassBonus: number;
  armorClassPenalty: number;
  speedMultiplier: number | null;
  speedBecomesZero: boolean;
  dexteritySaveAdvantage: boolean;
  extraLimitedAction: boolean;
  difficultTerrain: boolean;
  lethargyOnEnd: boolean;
  guidance: string[];
}

type ControlRuleFactory = (ruleset: RulesetId, slotLevel: number) => Omit<ControlSpellRuntime, "spellId" | "concentration">;

const empty = (): Omit<ControlSpellRuntime, "spellId" | "concentration"> => ({
  targetCount: 1,
  saveAbility: null,
  conditions: [],
  conditionChoice: [],
  repeatSave: false,
  repeatSaveTiming: null,
  endOnDamage: false,
  endOnAllyAction: false,
  attackRollBonusDice: null,
  savingThrowBonusDice: null,
  attackRollPenaltyDice: null,
  savingThrowPenaltyDice: null,
  armorClassBonus: 0,
  armorClassPenalty: 0,
  speedMultiplier: null,
  speedBecomesZero: false,
  dexteritySaveAdvantage: false,
  extraLimitedAction: false,
  difficultTerrain: false,
  lethargyOnEnd: false,
  guidance: [],
});

const addTargets = (base: number, slotLevel: number, baseLevel: number) => base + Math.max(0, slotLevel - baseLevel);

const CONTROL_RULES: Record<string, ControlRuleFactory> = {
  bless: (_ruleset, slotLevel) => ({
    ...empty(),
    targetCount: addTargets(3, slotLevel, 1),
    conditions: ["Blessed"],
    attackRollBonusDice: "1d4",
    savingThrowBonusDice: "1d4",
    guidance: ["Her hedef attack roll ve saving throw sonuçlarına 1d4 ekler."],
  }),
  bane: (_ruleset, slotLevel) => ({
    ...empty(),
    targetCount: addTargets(3, slotLevel, 1),
    saveAbility: "cha",
    attackRollPenaltyDice: "1d4",
    savingThrowPenaltyDice: "1d4",
    guidance: ["Başarısız Charisma save yapan hedef attack roll ve saving throw sonuçlarından 1d4 çıkarır."],
  }),
  "hold-person": (_ruleset, slotLevel) => ({
    ...empty(),
    targetCount: addTargets(1, slotLevel, 2),
    saveAbility: "wis",
    conditions: ["Paralyzed"],
    repeatSave: true,
    repeatSaveTiming: "end-of-turn",
    guidance: ["Yalnız Humanoid hedeflenebilir.", "Hedef her turunun sonunda Wisdom save tekrarlar; başarıda etki kendisi için biter."],
  }),
  "hold-monster": (_ruleset, slotLevel) => ({
    ...empty(),
    targetCount: addTargets(1, slotLevel, 5),
    saveAbility: "wis",
    conditions: ["Paralyzed"],
    repeatSave: true,
    repeatSaveTiming: "end-of-turn",
    guidance: ["Hedef her turunun sonunda Wisdom save tekrarlar; başarıda etki kendisi için biter."],
  }),
  "blindness-deafness": (_ruleset, slotLevel) => ({
    ...empty(),
    targetCount: addTargets(1, slotLevel, 2),
    saveAbility: "con",
    conditionChoice: ["Blinded", "Deafened"],
    repeatSave: true,
    repeatSaveTiming: "end-of-turn",
    guidance: ["Her hedef için Blinded veya Deafened seçilir.", "Hedef her turunun sonunda Constitution save tekrarlar."],
  }),
  web: (_ruleset, _slotLevel) => ({
    ...empty(),
    saveAbility: "dex",
    conditions: ["Restrained"],
    repeatSave: true,
    repeatSaveTiming: "enter-or-start",
    difficultTerrain: true,
    guidance: ["20-foot Cube Difficult Terrain olur.", "Alana giren veya turuna alanda başlayan yaratık Dexterity save ile Restrained olmamaya çalışır.", "Restrained hedef kaçmak için büyü açıklamasındaki Action kontrolünü kullanır."],
  }),
  haste: (ruleset, _slotLevel) => ({
    ...empty(),
    armorClassBonus: 2,
    speedMultiplier: 2,
    dexteritySaveAdvantage: true,
    extraLimitedAction: true,
    lethargyOnEnd: true,
    guidance: [
      "Hedef +2 AC, iki kat Speed, Dexterity save Advantage ve tur başına bir sınırlı ek Action kazanır.",
      ruleset === "dnd_2024"
        ? "Etki bitince hedef bir sonraki turunun sonuna kadar Incapacitated olur ve Speed 0 olur."
        : "Etki bitince hedef bir sonraki turu sonrasına kadar hareket edemez ve Action alamaz.",
    ],
  }),
  "hypnotic-pattern": (_ruleset, _slotLevel) => ({
    ...empty(),
    saveAbility: "wis",
    conditions: ["Charmed", "Incapacitated"],
    speedBecomesZero: true,
    endOnDamage: true,
    endOnAllyAction: true,
    guidance: ["Başarısız hedef Charmed ve Incapacitated olur; Speed 0 olur.", "Hedef hasar alırsa veya başka biri Action ile onu sarsarsa etki o hedef için biter."],
  }),
  slow: (_ruleset, _slotLevel) => ({
    ...empty(),
    targetCount: 6,
    saveAbility: "wis",
    repeatSave: true,
    repeatSaveTiming: "end-of-turn",
    armorClassPenalty: 2,
    speedMultiplier: 0.5,
    guidance: ["En fazla altı hedef: Speed yarıya iner, AC ve Dexterity save -2 olur ve Action ekonomisi kısıtlanır.", "Hedef her turunun sonunda Wisdom save tekrarlar."],
  }),
};

export function getControlSpellRuntime(spell: DndSpellData, ruleset: RulesetId, slotLevel = spell.level): ControlSpellRuntime | null {
  const normalizedId = spell.id.replace(/-2024$/, "");
  const factory = CONTROL_RULES[normalizedId];
  if (!factory) return null;
  return { spellId: spell.id, concentration: spell.concentration, ...factory(ruleset, slotLevel) };
}

export function hasOfficialControlRuntime(spellId: string) {
  return Boolean(CONTROL_RULES[spellId.replace(/-2024$/, "")]);
}

export interface ActiveControlModifiers {
  attackRollBonusDice: string[];
  savingThrowBonusDice: string[];
  attackRollPenaltyDice: string[];
  savingThrowPenaltyDice: string[];
  armorClassBonus: number;
  armorClassPenalty: number;
  speedMultiplier: number;
  dexteritySaveAdvantage: boolean;
  extraLimitedAction: boolean;
  difficultTerrain: boolean;
}

export function combineActiveControlEffects(effects: Array<Partial<ControlSpellRuntime>>): ActiveControlModifiers {
  return effects.reduce<ActiveControlModifiers>((total, effect) => ({
    attackRollBonusDice: effect.attackRollBonusDice ? [...total.attackRollBonusDice, effect.attackRollBonusDice] : total.attackRollBonusDice,
    savingThrowBonusDice: effect.savingThrowBonusDice ? [...total.savingThrowBonusDice, effect.savingThrowBonusDice] : total.savingThrowBonusDice,
    attackRollPenaltyDice: effect.attackRollPenaltyDice ? [...total.attackRollPenaltyDice, effect.attackRollPenaltyDice] : total.attackRollPenaltyDice,
    savingThrowPenaltyDice: effect.savingThrowPenaltyDice ? [...total.savingThrowPenaltyDice, effect.savingThrowPenaltyDice] : total.savingThrowPenaltyDice,
    armorClassBonus: total.armorClassBonus + (effect.armorClassBonus ?? 0),
    armorClassPenalty: total.armorClassPenalty + (effect.armorClassPenalty ?? 0),
    speedMultiplier: total.speedMultiplier * (effect.speedMultiplier ?? 1),
    dexteritySaveAdvantage: total.dexteritySaveAdvantage || Boolean(effect.dexteritySaveAdvantage),
    extraLimitedAction: total.extraLimitedAction || Boolean(effect.extraLimitedAction),
    difficultTerrain: total.difficultTerrain || Boolean(effect.difficultTerrain),
  }), {
    attackRollBonusDice: [], savingThrowBonusDice: [], attackRollPenaltyDice: [], savingThrowPenaltyDice: [],
    armorClassBonus: 0, armorClassPenalty: 0, speedMultiplier: 1, dexteritySaveAdvantage: false, extraLimitedAction: false, difficultTerrain: false,
  });
}
