import type { RulesetId } from "../character/character.types";

export type FightingStyleData = { id: string; name: string; summary: string; attackBonus?: number; damageBonus?: number; armorClassBonus?: number };

const coreStyles: FightingStyleData[] = [
  { id: "archery", name: "Archery", summary: "Ranged weapon attack rollarına +2 bonus.", attackBonus: 2 },
  { id: "defense", name: "Defense", summary: "Armor giyerken Armor Class değerine +1 bonus.", armorClassBonus: 1 },
  { id: "dueling", name: "Dueling", summary: "Tek elde melee weapon kullanırken damage rolluna +2 bonus.", damageBonus: 2 },
  { id: "great-weapon-fighting", name: "Great Weapon Fighting", summary: "İki elle kullanılan silahların düşük damage zarlarını iyileştirir." },
  { id: "protection", name: "Protection", summary: "Shield ile yakındaki müttefiğe yönelen saldırıyı reaction üzerinden zorlaştırır." },
  { id: "two-weapon-fighting", name: "Two-Weapon Fighting", summary: "İkinci hafif silah saldırısının damage rolluna ability modifier ekler." },
];
const modernStyles: FightingStyleData[] = [
  { id: "blind-fighting", name: "Blind Fighting", summary: "Yakın çevrede görüş gerektirmeyen sınırlı algı kazandırır." },
  { id: "interception", name: "Interception", summary: "Reaction kullanarak yakındaki müttefiğin aldığı hasarı azaltır." },
  { id: "thrown-weapon-fighting", name: "Thrown Weapon Fighting", summary: "Thrown silahları daha akıcı çekip kullanmayı destekler.", damageBonus: 2 },
  { id: "unarmed-fighting", name: "Unarmed Fighting", summary: "Unarmed strike damage değerini geliştirir." },
];

export function getFightingStyles(ruleset: RulesetId) {
  return ruleset === "dnd_2014" ? coreStyles : [...coreStyles, ...modernStyles];
}

export function getFightingStyleChoiceCount(className: string, level: number, subclass = "") {
  const key = className.trim().toLowerCase();
  if (key === "fighter") return 1 + (subclass.toLowerCase().includes("champion") && level >= 10 ? 1 : 0);
  if ((key === "paladin" || key === "ranger") && level >= 2) return 1;
  return 0;
}
