import type { DndFeatData } from "./ruleset.types";
import { getProficiencyBonus } from "../character/characterCalculator";

export type FeatAction = { id: string; name: string; type: "action" | "bonus-action" | "reaction"; maxUses: number; summary: string };
export type AdvancedFeatRuntime = {
  armorClassBonus: number;
  concentrationAdvantage: boolean;
  mentalSaveAdvantage: boolean;
  enemyConcentrationDisadvantage: boolean;
  guardedMindUses: number;
  ignoresLoading: boolean;
  spellRangeMultiplier: number;
  powerAttack: boolean;
  mediumArmorDexCap: number;
  ignoreMediumArmorStealth: boolean;
  elementalResistanceBypass: boolean;
  damageRerollTypes: string[];
  grantsRitualCasting: boolean;
  grantsExpertise: boolean;
  notes: string[];
  actions: FeatAction[];
};

export function getAdvancedFeatRuntime(feats: DndFeatData[], level: number): AdvancedFeatRuntime {
  const entries = feats.map((feat) => ({ name: feat.name.toLowerCase(), ruleset: feat.ruleset }));
  const has = (pattern: RegExp) => entries.some((entry) => pattern.test(entry.name));
  const hasEdition = (pattern: RegExp, ruleset: DndFeatData["ruleset"]) => entries.some((entry) => entry.ruleset === ruleset && pattern.test(entry.name));
  const pb = getProficiencyBonus(level);
  const actions: FeatAction[] = [];
  if (has(/defensive duelist/)) actions.push({ id: "defensive-duelist", name: "Defensive Duelist", type: "reaction", maxUses: 99, summary: `Reaction ile AC +${pb}` });
  if (has(/inspiring leader/)) actions.push({ id: "inspiring-leader", name: "Inspiring Leader", type: "action", maxUses: 1, summary: "Partiye temporary HP ver." });
  if (has(/shield master/)) actions.push({ id: "shield-master", name: "Shield Master Shove", type: "bonus-action", maxUses: 99, summary: "Shield ile hedefi it." });
  if (has(/polearm master/)) actions.push({ id: "polearm-master", name: "Polearm Bonus Attack", type: "bonus-action", maxUses: 99, summary: "Polearm sapıyla bonus saldırı." });
  if (has(/telekinetic/)) actions.push({ id: "telekinetic-shove", name: "Telekinetic Shove", type: "bonus-action", maxUses: 99, summary: "30 ft. içindeki hedefi zihinsel olarak it." });
  if (has(/sentinel/)) actions.push({ id: "reactive-strike", name: "Sentinel Strike", type: "reaction", maxUses: 99, summary: "Tetiklenen reaction saldırısı." });
  if (hasEdition(/mage slayer/, "dnd_2014")) actions.push({ id: "mage-slayer-strike", name: "Mage Slayer Strike", type: "reaction", maxUses: 99, summary: "Yakındaki yaratık spell kullandığında reaction saldırısı." });
  if (has(/charger/)) actions.push({ id: "charger", name: "Charger Attack / Shove", type: "bonus-action", maxUses: 99, summary: "Dash sonrası bonus attack veya shove." });
  if (has(/fey.?touched/)) actions.push({ id: "fey-touched", name: "Fey-Touched Misty Step", type: "bonus-action", maxUses: 1, summary: "Long Rest başına bir kez slotsuz Misty Step." });
  const damageRerollTypes = [has(/piercer/) ? "piercing" : null, has(/slasher/) ? "slashing" : null].filter((value): value is string => Boolean(value));
  const notes: string[] = [];
  if (has(/dungeon delver/)) notes.push("Trap save/check advantage ve trap damage resistance.");
  if (has(/keen mind/)) notes.push("Yön, zaman ve son bir aylık ayrıntılar için otomatik hatırlatma.");
  if (has(/skulker/)) notes.push("Loş ışıkta Perception dezavantajı yok; miss gizliliği bozmaz.");
  if (has(/martial adept/)) notes.push("Bir Superiority Die ve seçilmiş maneuver erişimi.");
  if (has(/resilient/)) notes.push("Seçilen ability saving throw proficiency kazanır.");
  if (has(/weapon master/)) notes.push("Seçilen dört weapon proficiency kazanılır.");
  if (hasEdition(/mage slayer/, "dnd_2024")) notes.push("Concentration Breaker: verdiğin hasar hedefin Concentration save sonucunu zorlaştırır; Guarded Mind kullanımı manuel seçilir.");
  return {
    armorClassBonus: hasEdition(/dual wielder/, "dnd_2014") ? 1 : 0,
    concentrationAdvantage: has(/war caster/),
    mentalSaveAdvantage: false,
    enemyConcentrationDisadvantage: hasEdition(/mage slayer/, "dnd_2024"),
    guardedMindUses: hasEdition(/mage slayer/, "dnd_2024") ? 1 : 0,
    ignoresLoading: has(/crossbow expert/),
    spellRangeMultiplier: has(/spell sniper/) ? 2 : 1,
    powerAttack: hasEdition(/great weapon master|sharpshooter/, "dnd_2014"),
    mediumArmorDexCap: has(/medium armor master/) ? 3 : 2,
    ignoreMediumArmorStealth: has(/medium armor master/),
    elementalResistanceBypass: has(/elemental adept/),
    damageRerollTypes,
    grantsRitualCasting: has(/ritual caster/),
    grantsExpertise: has(/skill expert/),
    notes,
    actions,
  };
}

export function getInspiringLeaderTempHp(level: number, chaModifier: number) {
  return Math.max(1, level + Math.max(0, chaModifier));
}
