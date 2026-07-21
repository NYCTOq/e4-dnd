import type { CharacterSpellEffect, RulesetId } from "../character/character.types";
import type { DndSpellData } from "./ruleset.types";

export interface DefenseMovementSpellRuntime {
  spellId: string;
  targetCount: number;
  armorClassBonus: number;
  immunityToMagicMissile: boolean;
  teleportDistance: number | null;
  destinationRequiresSight: boolean;
  destinationMustBeUnoccupied: boolean;
  canBringWillingCreature: boolean;
  flySpeed: number | null;
  canHover: boolean;
  conditions: Array<"Invisible">;
  endOnAttack: boolean;
  endOnDealDamage: boolean;
  endOnCastSpell: boolean;
  duplicateCount: number;
  duplicateInterceptionRule: string | null;
  reactionTrigger: string | null;
  guidance: string[];
}

const empty = (): Omit<DefenseMovementSpellRuntime, "spellId"> => ({
  targetCount: 1,
  armorClassBonus: 0,
  immunityToMagicMissile: false,
  teleportDistance: null,
  destinationRequiresSight: false,
  destinationMustBeUnoccupied: false,
  canBringWillingCreature: false,
  flySpeed: null,
  canHover: false,
  conditions: [],
  endOnAttack: false,
  endOnDealDamage: false,
  endOnCastSpell: false,
  duplicateCount: 0,
  duplicateInterceptionRule: null,
  reactionTrigger: null,
  guidance: [],
});

const normalized = (spell: DndSpellData) => spell.id.replace(/-2024$/, "");
const extraTargets = (slotLevel: number, baseLevel: number) => 1 + Math.max(0, slotLevel - baseLevel);

export function getDefenseMovementSpellRuntime(
  spell: DndSpellData,
  ruleset: RulesetId,
  slotLevel = spell.level,
): DefenseMovementSpellRuntime | null {
  const id = normalized(spell);
  const base = empty();

  if (id === "shield") {
    return {
      ...base,
      spellId: spell.id,
      armorClassBonus: 5,
      immunityToMagicMissile: true,
      reactionTrigger: "Hit by an attack roll or targeted by Magic Missile",
      guidance: ["Until the start of your next turn, AC increases by 5, including against the triggering attack.", "Magic Missile deals no damage to you during the effect."],
    };
  }

  if (id === "shield-of-faith") {
    return {
      ...base,
      spellId: spell.id,
      armorClassBonus: 2,
      guidance: ["The target gains +2 AC while concentration lasts."],
    };
  }

  if (id === "misty-step") {
    return {
      ...base,
      spellId: spell.id,
      teleportDistance: 30,
      destinationRequiresSight: true,
      destinationMustBeUnoccupied: true,
      guidance: ["Teleport up to 30 feet to an unoccupied space you can see."],
    };
  }

  if (id === "dimension-door") {
    return {
      ...base,
      spellId: spell.id,
      teleportDistance: 500,
      canBringWillingCreature: true,
      guidance: [
        "Teleport to an exact destination within 500 feet; sight is not required if the location can be visualized or described by direction and distance.",
        ruleset === "dnd_2014"
          ? "You may bring one willing creature of your size or smaller within 5 feet."
          : "You may bring one willing creature within 5 feet; it arrives within 5 feet of the destination.",
        "If the destination is occupied or completely filled, teleportation fails and each traveler takes 4d6 Force damage.",
      ],
    };
  }

  if (id === "fly") {
    return {
      ...base,
      spellId: spell.id,
      targetCount: extraTargets(slotLevel, 3),
      flySpeed: 60,
      canHover: true,
      guidance: ["Each target gains a 60-foot Fly Speed and can hover.", "When the effect ends, an airborne target falls unless it can prevent the fall."],
    };
  }

  if (id === "invisibility") {
    return {
      ...base,
      spellId: spell.id,
      targetCount: extraTargets(slotLevel, 2),
      conditions: ["Invisible"],
      endOnAttack: true,
      endOnDealDamage: ruleset === "dnd_2024",
      endOnCastSpell: true,
      guidance: [
        "The target has the Invisible condition.",
        ruleset === "dnd_2024"
          ? "The effect ends immediately after the target makes an attack roll, deals damage, or casts a spell."
          : "The effect ends when the target attacks or casts a spell.",
      ],
    };
  }

  if (id === "greater-invisibility") {
    return {
      ...base,
      spellId: spell.id,
      conditions: ["Invisible"],
      guidance: ["The target remains Invisible while attacking, dealing damage, and casting spells until concentration ends."],
    };
  }

  if (id === "mirror-image") {
    return {
      ...base,
      spellId: spell.id,
      duplicateCount: 3,
      duplicateInterceptionRule: ruleset === "dnd_2024"
        ? "When an attack roll hits you, roll one d6 for each remaining duplicate; any result of 3+ destroys one duplicate and prevents the hit on you."
        : "When an attack targets you, roll d20: 6+ with three duplicates, 8+ with two, or 11+ with one redirects the attack; duplicate AC is 10 + DEX modifier.",
      guidance: [ruleset === "dnd_2024"
        ? "Three duplicates intercept successful attack rolls using the 2024 d6 rule."
        : "Three duplicates can redirect attacks using the 2014 d20 thresholds and duplicate AC."],
    };
  }

  return null;
}

export interface ActiveDefenseMovementModifiers {
  armorClassBonus: number;
  attackMode: "normal" | "advantage";
  flySpeed: number | null;
  canHover: boolean;
  immunityToMagicMissile: boolean;
  duplicateCount: number;
}

export function getActiveDefenseMovementModifiers(effects: CharacterSpellEffect[]): ActiveDefenseMovementModifiers {
  return effects.reduce<ActiveDefenseMovementModifiers>((total, effect) => ({
    armorClassBonus: total.armorClassBonus + (effect.armorClassBonus ?? 0),
    attackMode: total.attackMode === "advantage" || effect.conditions?.includes("Invisible") ? "advantage" : "normal",
    flySpeed: Math.max(total.flySpeed ?? 0, effect.flySpeed ?? 0) || null,
    canHover: total.canHover || Boolean(effect.canHover),
    immunityToMagicMissile: total.immunityToMagicMissile || Boolean(effect.immunityToMagicMissile),
    duplicateCount: total.duplicateCount + (effect.duplicateCount ?? 0),
  }), { armorClassBonus: 0, attackMode: "normal", flySpeed: null, canHover: false, immunityToMagicMissile: false, duplicateCount: 0 });
}

export function removeEffectsBrokenByAttack(effects: CharacterSpellEffect[]) {
  return effects.filter((effect) => !effect.endOnAttack);
}

export function removeEffectsBrokenBySpellCast(effects: CharacterSpellEffect[], dealsDamage: boolean) {
  return effects.filter((effect) => !effect.endOnCastSpell && !(dealsDamage && effect.endOnDealDamage));
}
