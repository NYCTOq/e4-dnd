import type { RulesetId } from "../character/character.types";
import { getMetamagicChoiceCountForSorcerer } from "./sorcererRules";

export type MetamagicOption = { id: string; name: string; cost: number; summary: string; rulesets: RulesetId[] };
const options: MetamagicOption[] = [
  { id: "careful-spell", name: "Careful Spell", cost: 1, summary: "Saving throw isteyen büyülerde seçili müttefikleri korur.", rulesets: ["dnd_2014", "dnd_2024"] },
  { id: "distant-spell", name: "Distant Spell", cost: 1, summary: "Büyü menzilini artırır veya Touch menzilini uzaktan kullanılabilir hale getirir.", rulesets: ["dnd_2014", "dnd_2024"] },
  { id: "empowered-spell", name: "Empowered Spell", cost: 1, summary: "Hasar zarlarının Charisma ile sınırlı bölümünü yeniden atar.", rulesets: ["dnd_2014", "dnd_2024"] },
  { id: "extended-spell", name: "Extended Spell", cost: 1, summary: "Uygun süreli büyünün süresini uzatır; 2024 sürümü concentration savunmasını da destekler.", rulesets: ["dnd_2014", "dnd_2024"] },
  { id: "heightened-spell", name: "Heightened Spell", cost: 3, summary: "2014 sürümünde ilk save'i zorlaştırır.", rulesets: ["dnd_2014"] },
  { id: "heightened-spell-2024", name: "Heightened Spell", cost: 2, summary: "2024 sürümünde bir hedefin büyüye karşı saving throw'larını zorlaştırır.", rulesets: ["dnd_2024"] },
  { id: "quickened-spell", name: "Quickened Spell", cost: 2, summary: "Action büyüsünü Bonus Action olarak kullanır ve aynı tur büyü sınırını uygular.", rulesets: ["dnd_2014", "dnd_2024"] },
  { id: "seeking-spell", name: "Seeking Spell", cost: 1, summary: "Kaçıran spell attack d20 sonucunu yeniden atar.", rulesets: ["dnd_2024"] },
  { id: "subtle-spell", name: "Subtle Spell", cost: 1, summary: "Büyünün component gereksinimlerini edition kurallarına göre azaltır.", rulesets: ["dnd_2014", "dnd_2024"] },
  { id: "transmuted-spell", name: "Transmuted Spell", cost: 1, summary: "Uygun elemental hasar türünü başka bir elemental hasar türüne dönüştürür.", rulesets: ["dnd_2024"] },
  { id: "twinned-spell", name: "Twinned Spell", cost: 1, summary: "2014 sürümünde uygun tek hedefli büyüyü ikinci hedefe taşır.", rulesets: ["dnd_2014"] },
  { id: "twinned-spell-2024", name: "Twinned Spell", cost: 1, summary: "2024 sürümünde ek hedef kazanan uygun büyünün etkin seviyesini artırır.", rulesets: ["dnd_2024"] },
];

export function getMetamagicOptions(ruleset: RulesetId) { return options.filter((option) => option.rulesets.includes(ruleset)); }
export function getMetamagicChoiceCount(className: string, level: number, ruleset: RulesetId) {
  if (className.trim().toLowerCase() !== "sorcerer") return 0;
  if (ruleset === "homebrew") return 0;
  return getMetamagicChoiceCountForSorcerer(level, ruleset);
}
