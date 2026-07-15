import type { DndClassData, DndSpellData } from "./ruleset.types";

export function getHighestSpellLevel(classData: DndClassData | undefined, characterLevel: number) {
  if (!classData || classData.spellProgression === "none") return 0;
  const row = classData.levels.find((item) => item.level === Math.max(1, Math.min(20, characterLevel)));
  if (row?.pactMagic) return row.pactMagic.slotLevel;
  const slots = row?.spellSlots ?? [];
  let highest = 0;
  slots.forEach((count, index) => { if (count > 0) highest = index + 1; });
  return highest;
}

export function isSpellAvailableToClass(spell: DndSpellData, className: string) {
  const normalized = className.trim().toLowerCase();
  return normalized.length === 0 || spell.classes.some((item) => item.toLowerCase() === normalized);
}

export function getSpellMechanicSummary(spell: DndSpellData) {
  const parts: string[] = [];
  if (spell.damageDice) parts.push(`${spell.damageDice}${spell.damageType ? ` ${spell.damageType}` : ""}`);
  if (spell.healingDice) parts.push(`${spell.healingDice} healing`);
  if (spell.attackType === "spell-attack") parts.push("spell attack");
  if (spell.attackType === "saving-throw" && spell.saveAbility) parts.push(`${spell.saveAbility.toUpperCase()} save`);
  if (spell.conditionEffect) parts.push(spell.conditionEffect);
  return parts.join(" • ") || spell.effectType || "utility";
}
