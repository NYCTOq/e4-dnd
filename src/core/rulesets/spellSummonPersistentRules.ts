import type { RulesetId } from "../character/character.types";
import type { DndSpellData } from "./ruleset.types";

export type PersistentSpellKind = "companion" | "steed" | "summon" | "persistent-area" | "persistent-weapon";
export type PersistentTrigger = "on-cast" | "enter-area" | "start-turn" | "end-turn" | "area-moves-into" | "rammed" | "later-bonus-action" | "later-magic-action";

export interface SummonPersistentSpellRuntime {
  spellId: string;
  kind: PersistentSpellKind;
  replacesExisting: boolean;
  concentration: boolean;
  moveDistance: number | null;
  moveAction: "action" | "bonus-action" | "magic-action" | "with-caster-movement" | null;
  triggers: PersistentTrigger[];
  oncePerTurn: boolean;
  damageFormula: string | null;
  saveAbility: DndSpellData["saveAbility"] | null;
  saveDamageRule: "half" | "none" | null;
  attackUsesSpellAttack: boolean;
  initiativeRule: string | null;
  commandEconomy: string | null;
  canAttack: boolean | null;
  touchSpellDelivery: boolean;
  telepathyRange: number | null;
  formChoices: string[];
  creatureTypeChoices: string[];
  armorClassFormula: string | null;
  hitPointFormula: string | null;
  flySpeed: number | null;
  specialScaling: string | null;
  area: string | null;
  guidance: string[];
}

const normalizeId = (spell: DndSpellData) => spell.id.replace(/-2024$/, "");
const slotSteps = (slotLevel: number, baseLevel: number) => Math.max(0, slotLevel - baseLevel);

export function getSummonPersistentSpellRuntime(
  spell: DndSpellData,
  ruleset: RulesetId,
  slotLevel = spell.level,
): SummonPersistentSpellRuntime | null {
  const id = normalizeId(spell);
  const base = {
    spellId: spell.id,
    replacesExisting: false,
    concentration: spell.concentration,
    moveDistance: null,
    moveAction: null,
    triggers: [] as PersistentTrigger[],
    oncePerTurn: false,
    damageFormula: null,
    saveAbility: spell.saveAbility ?? null,
    saveDamageRule: null as "half" | "none" | null,
    attackUsesSpellAttack: false,
    initiativeRule: null,
    commandEconomy: null,
    canAttack: null as boolean | null,
    touchSpellDelivery: false,
    telepathyRange: null,
    formChoices: [] as string[],
    creatureTypeChoices: [] as string[],
    armorClassFormula: null,
    hitPointFormula: null,
    flySpeed: null,
    specialScaling: null,
    area: spell.area ?? null,
    guidance: [] as string[],
  };

  if (id === "find-familiar") {
    const is2024 = ruleset === "dnd_2024";
    return {
      ...base,
      kind: "companion",
      replacesExisting: true,
      initiativeRule: "The familiar rolls its own initiative and acts on its own turn.",
      commandEconomy: "It acts independently but obeys your commands.",
      canAttack: false,
      touchSpellDelivery: true,
      telepathyRange: 100,
      formChoices: is2024
        ? ["Bat", "Cat", "Frog", "Hawk", "Lizard", "Octopus", "Owl", "Rat", "Raven", "Spider", "Weasel", "CR 0 Beast"]
        : ["Bat", "Cat", "Crab", "Frog", "Hawk", "Lizard", "Octopus", "Owl", "Poisonous Snake", "Fish", "Rat", "Raven", "Sea Horse", "Spider", "Weasel"],
      creatureTypeChoices: ["Celestial", "Fey", "Fiend"],
      guidance: [
        "Only one familiar can exist at a time; recasting changes or replaces its form.",
        "The familiar cannot attack, but it can take other actions.",
        "It can deliver a Touch-range spell within 100 feet by using its Reaction.",
        is2024
          ? "Seeing and hearing through the familiar uses a Bonus Action until the start of your next turn; dismissing or recalling it uses a Magic action."
          : "Seeing and hearing through the familiar uses your Action; dismissing or recalling it uses an Action.",
      ],
    };
  }

  if (id === "find-steed") {
    const is2024 = ruleset === "dnd_2024";
    return {
      ...base,
      kind: "steed",
      replacesExisting: true,
      initiativeRule: is2024
        ? "The steed shares your initiative count and functions as a controlled mount while ridden."
        : "The steed is loyal and intelligent; mounted-combat initiative rules apply.",
      commandEconomy: is2024
        ? "While you are Incapacitated, it acts immediately after your turn and independently protects you."
        : "It communicates telepathically and follows your commands.",
      canAttack: true,
      telepathyRange: is2024 ? 5280 : 5280,
      creatureTypeChoices: is2024 ? ["Celestial", "Fey", "Fiend"] : ["Celestial", "Fey", "Fiend"],
      armorClassFormula: is2024 ? "10 + spell slot level" : null,
      hitPointFormula: is2024 ? "5 + 10 × spell slot level" : null,
      flySpeed: is2024 && slotLevel >= 4 ? 60 : null,
      specialScaling: is2024
        ? "Otherworldly Slam uses your spell attack modifier and deals 1d8 + slot level damage; slot level 4+ grants Fly 60 ft."
        : "The steed uses the chosen creature stat block and shares certain self-targeting spell effects while mounted.",
      guidance: [
        "Only one steed from this spell can exist; recasting replaces it.",
        is2024
          ? "AC, HP, Hit Dice, damage, and flight scale directly from the slot level."
          : "Use the chosen mount's stat block and the 2014 Find Steed telepathic/spell-sharing rules.",
      ],
    };
  }

  if (id === "summon-beast") {
    return {
      ...base,
      kind: "summon",
      replacesExisting: false,
      initiativeRule: "The spirit shares your initiative count and takes its turn immediately after yours.",
      commandEconomy: "It obeys verbal commands; without a command, it takes the Dodge action and moves only to avoid danger.",
      canAttack: true,
      creatureTypeChoices: ["Air", "Land", "Water"],
      armorClassFormula: "11 + spell slot level",
      hitPointFormula: "20 + 5 × spell slot levels above 2",
      specialScaling: "Bestial Strike uses your spell attack modifier; damage and multiattack scale from slot level.",
      guidance: ["Use the Bestial Spirit stat block and selected Air, Land, or Water form.", "Dropping concentration or reaching 0 HP dismisses the spirit."],
    };
  }

  if (id === "conjure-animals") {
    if (ruleset === "dnd_2024") {
      return {
        ...base,
        kind: "persistent-area",
        moveDistance: 30,
        moveAction: "with-caster-movement",
        triggers: ["area-moves-into", "enter-area", "end-turn"],
        oncePerTurn: true,
        damageFormula: `${3 + slotSteps(slotLevel, 3)}d10`,
        saveAbility: "dex",
        saveDamageRule: "none",
        area: "Large spectral pack; creatures within 10 feet",
        guidance: [
          "The 2024 spell creates one intangible spectral pack rather than individual Beast stat blocks.",
          "You have Advantage on Strength saves while within 5 feet of the pack.",
          "When you move, the pack can move up to 30 feet; each creature can be forced to save only once per turn.",
        ],
      };
    }
    return {
      ...base,
      kind: "summon",
      initiativeRule: "Summoned beasts roll initiative as a group and take their own turns.",
      commandEconomy: "They obey verbal commands; without commands, they defend themselves.",
      canAttack: true,
      specialScaling: "The number and CR of summoned Beasts depend on the chosen 2014 option; higher slots increase the allowed CR/quantity.",
      guidance: ["The 2014 spell creates actual Fey spirits using Beast stat blocks selected within the spell's CR options.", "Track each creature or group separately until concentration ends or HP reaches 0."],
    };
  }

  if (id === "spiritual-weapon") {
    return {
      ...base,
      kind: "persistent-weapon",
      moveDistance: 20,
      moveAction: "bonus-action",
      triggers: ["on-cast", "later-bonus-action"],
      damageFormula: `${1 + (ruleset === "dnd_2024" ? slotSteps(slotLevel, 2) : Math.floor(slotSteps(slotLevel, 2) / 2))}d8 + spellcasting ability modifier`,
      attackUsesSpellAttack: true,
      guidance: [
        "Make one melee spell attack when the weapon appears.",
        "On later turns, a Bonus Action moves it up to 20 feet and repeats the attack.",
        ruleset === "dnd_2024" ? "2024 requires Concentration and gains +1d8 per slot level above 2." : "2014 does not require Concentration and gains +1d8 per two slot levels above 2.",
      ],
    };
  }

  if (id === "flaming-sphere") {
    return {
      ...base,
      kind: "persistent-area",
      moveDistance: 30,
      moveAction: "bonus-action",
      triggers: ["end-turn", "rammed"],
      oncePerTurn: false,
      damageFormula: `${2 + slotSteps(slotLevel, 2)}d6`,
      saveAbility: "dex",
      saveDamageRule: "half",
      area: "5-foot-diameter sphere; damage within 5 feet",
      guidance: [
        "A creature ending its turn within 5 feet makes a Dexterity save for half damage on success.",
        "As a Bonus Action, move the sphere up to 30 feet; ramming a creature forces the save and stops movement for the turn.",
        "It crosses barriers up to 5 feet and pits up to 10 feet and ignites unattended flammable objects.",
      ],
    };
  }

  if (id === "moonbeam") {
    return {
      ...base,
      kind: "persistent-area",
      moveDistance: 60,
      moveAction: ruleset === "dnd_2024" ? "magic-action" : "action",
      triggers: ruleset === "dnd_2024"
        ? ["on-cast", "area-moves-into", "enter-area", "end-turn"]
        : ["enter-area", "start-turn"],
      oncePerTurn: ruleset === "dnd_2024",
      damageFormula: `${2 + slotSteps(slotLevel, 2)}d10`,
      saveAbility: "con",
      saveDamageRule: "half",
      area: "5-foot-radius, 40-foot-high cylinder",
      guidance: [
        ruleset === "dnd_2024"
          ? "Creatures save when the cylinder appears, moves into their space, they enter it, or end their turn there; once per turn."
          : "Creatures save when entering the area for the first time on a turn or starting their turn there.",
        "Shape-shifted creatures that fail revert to their true form and cannot shape-shift while inside the cylinder.",
        `Move the cylinder up to 60 feet using a ${ruleset === "dnd_2024" ? "Magic action" : "regular action"} on later turns.`,
      ],
    };
  }

  return null;
}
