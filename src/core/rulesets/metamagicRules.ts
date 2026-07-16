import type { RulesetId } from "../character/character.types";

export type MetamagicOption = { id: string; name: string; cost: number; summary: string };
const options: MetamagicOption[] = [
  { id: "careful-spell", name: "Careful Spell", cost: 1, summary: "Area spell içindeki seçili müttefiklerin save sonucunu korur." },
  { id: "distant-spell", name: "Distant Spell", cost: 1, summary: "Spell menzilini veya touch erişimini genişletir." },
  { id: "empowered-spell", name: "Empowered Spell", cost: 1, summary: "Hasar zarlarının sınırlı bir bölümünü yeniden atar." },
  { id: "extended-spell", name: "Extended Spell", cost: 1, summary: "Uygun süreli spell etkisinin devam süresini uzatır." },
  { id: "heightened-spell", name: "Heightened Spell", cost: 3, summary: "Bir hedefin ilk saving throw sonucunu zorlaştırır." },
  { id: "quickened-spell", name: "Quickened Spell", cost: 2, summary: "Uygun Action spellini Bonus Action olarak kullanır." },
  { id: "subtle-spell", name: "Subtle Spell", cost: 1, summary: "Verbal ve somatic component ihtiyacını kaldırır." },
  { id: "twinned-spell", name: "Twinned Spell", cost: 1, summary: "Tek hedefli uygun spellin etkisini ikinci hedefe taşır." },
];

export function getMetamagicOptions(_ruleset: RulesetId) { return options; }
export function getMetamagicChoiceCount(className: string, level: number, ruleset: RulesetId) {
  if (className.trim().toLowerCase() !== "sorcerer") return 0;
  const unlock = ruleset === "dnd_2024" ? 2 : 3;
  if (level < unlock) return 0;
  return level >= 17 ? 4 : level >= 10 ? 3 : 2;
}
