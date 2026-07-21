import type { AbilityKey } from "../character/character.types";
import type { DndFeatData, FeatCategory } from "./ruleset.types";

const entry = (
  id: string,
  name: string,
  category: FeatCategory,
  summary: string,
  benefits: string[],
  options: Partial<DndFeatData> = {},
): DndFeatData => ({ id, name, ruleset: "dnd_2024", category, summary, benefits, ...options });

const general = (
  id: string,
  name: string,
  summary: string,
  benefits: string[],
  abilities?: AbilityKey[],
  options: Partial<DndFeatData> = {},
) => entry(id, name, "general", summary, benefits, {
  prerequisite: { minimumLevel: 4, ...(options.prerequisite ?? {}) },
  abilityOptions: abilities,
  choiceType: abilities?.length ? "ability" : options.choiceType,
  choiceCount: abilities?.length ? 1 : options.choiceCount,
  ...options,
});

const style = (id: string, name: string, summary: string, benefits: string[]) => entry(
  id,
  name,
  "fighting-style",
  summary,
  benefits,
  { prerequisite: { fightingStyleFeature: true } },
);

const boon = (
  id: string,
  name: string,
  summary: string,
  benefits: string[],
  abilities: AbilityKey[],
  options: Partial<DndFeatData> = {},
) => entry(id, name, "epic-boon", summary, benefits, {
  prerequisite: { minimumLevel: 19, ...(options.prerequisite ?? {}) },
  abilityOptions: abilities,
  choiceType: "ability",
  choiceCount: 1,
  ...options,
});

/**
 * 2024 PHB feat catalogue entries missing from the original JSON/expansion data.
 * Text is intentionally concise; the authoritative rules remain the licensed source.
 */
export const OFFICIAL_FEAT_CATALOG_2024: DndFeatData[] = [
  general("chef-2024", "Chef", "Yemek hazırlığıyla dinlenme ve iyileşme desteği sağlar.", ["CON veya WIS artışı", "Rest healing desteği", "Treat hazırlama"], ["con", "wis"]),
  general("crusher-2024", "Crusher", "Bludgeoning saldırılarıyla konum ve kritik vuruş kontrolü sağlar.", ["STR veya CON artışı", "Hedef hareketi", "Critical destek"], ["str", "con"]),
  general("durable-2024", "Durable", "Dayanıklılığı ve Hit Dice ile toparlanmayı geliştirir.", ["CON artışı", "Hit Dice iyileşmesi", "Death save desteği"], ["con"]),
  general("grappler-2024", "Grappler", "Unarmed Strike ve grapple akışını güçlendirir.", ["STR veya DEX artışı", "Punch and Grab", "Grappled hedefe avantaj"], ["str", "dex"], { prerequisite: { minimumLevel: 4, abilityMinimumAny: { str: 13, dex: 13 } } }),
  general("heavily-armored-2024", "Heavily Armored", "Heavy Armor Training kazandırır.", ["STR veya CON artışı", "Heavy Armor Training"], ["str", "con"], { prerequisite: { minimumLevel: 4, armorTrainingAny: ["medium"] } }),
  general("heavy-armor-master-2024", "Heavy Armor Master", "Heavy armor kullanırken fiziksel darbeleri azaltır.", ["STR veya CON artışı", "Heavy armor damage reduction"], ["str", "con"], { prerequisite: { minimumLevel: 4, armorTrainingAny: ["heavy"] } }),
  general("keen-mind-2024", "Keen Mind", "Bilgi, inceleme ve hızlı zihinsel çözümlemeyi geliştirir.", ["INT artışı", "Lore expertise seçimi", "Quick Study"], ["int"]),
  general("lightly-armored-2024", "Lightly Armored", "Light armor ve shield eğitimini açar.", ["STR veya DEX artışı", "Light Armor Training", "Shield Training"], ["str", "dex"]),
  general("martial-weapon-training-2024", "Martial Weapon Training", "Martial weapon kullanım alanını genişletir.", ["STR veya DEX artışı", "Martial weapon proficiency"], ["str", "dex"]),
  general("medium-armor-master-2024", "Medium Armor Master", "Medium armor savunması ve çevikliğini geliştirir.", ["DEX artışı", "Medium armor AC desteği", "Stealth kolaylığı"], ["dex"], { prerequisite: { minimumLevel: 4, armorTrainingAny: ["medium"] } }),
  general("moderately-armored-2024", "Moderately Armored", "Medium armor ve shield eğitimini açar.", ["STR veya DEX artışı", "Medium Armor Training", "Shield Training"], ["str", "dex"], { prerequisite: { minimumLevel: 4, armorTrainingAny: ["light"] } }),
  general("mounted-combatant-2024", "Mounted Combatant", "Binek üzerinde saldırı, hareket ve savunmayı geliştirir.", ["STR, DEX veya WIS artışı", "Mounted attack desteği", "Mount savunması"], ["str", "dex", "wis"]),
  general("observant-2024", "Observant", "Algı, inceleme ve Search eylemini geliştirir.", ["INT veya WIS artışı", "Perception/Investigation expertise", "Quick Search"], ["int", "wis"]),
  general("poisoner-2024", "Poisoner", "Poison üretimini ve poison hasarını güçlendirir.", ["DEX veya INT artışı", "Poison crafting", "Poison resistance bypass"], ["dex", "int"]),
  general("ritual-caster-2024", "Ritual Caster", "Ritual büyü erişimi ve hızlı ritual kullanımı sağlar.", ["INT, WIS veya CHA artışı", "Ritual spells", "Quick Ritual"], ["int", "wis", "cha"], { choiceType: "spells", choiceCount: 2 }),
  general("shadow-touched-2024", "Shadow-Touched", "Invisibility ve karanlık temalı bir büyü kazandırır.", ["INT, WIS veya CHA artışı", "Invisibility", "Ek level 1 spell"], ["int", "wis", "cha"], { choiceType: "spells", choiceCount: 1 }),
  general("shield-master-2024", "Shield Master", "Shield ile itme ve Dexterity save savunması sağlar.", ["STR artışı", "Shield Bash", "Interpose Shield"], ["str"], { prerequisite: { minimumLevel: 4, armorTrainingAny: ["shield"] } }),
  general("skulker-2024", "Skulker", "Gizlilik, karanlık görüşü ve saklı saldırıları geliştirir.", ["DEX artışı", "Blindsight", "Stealth attack desteği"], ["dex"]),
  general("speedy-2024", "Speedy", "Hareket hızını ve opportunity attack kaçınmasını geliştirir.", ["DEX veya CON artışı", "Speed artışı", "Difficult terrain mobility"], ["dex", "con"]),
  general("spell-sniper-2024", "Spell Sniper", "Spell attack menzili ve yakın mesafe kullanımını geliştirir.", ["INT, WIS veya CHA artışı", "Spell range", "Cover bypass"], ["int", "wis", "cha"], { prerequisite: { minimumLevel: 4, spellcasting: true }, choiceType: "spells", choiceCount: 1 }),
  general("telepathic-2024", "Telepathic", "Telepati ve Detect Thoughts erişimi kazandırır.", ["INT, WIS veya CHA artışı", "Telepathy", "Detect Thoughts"], ["int", "wis", "cha"]),
  general("weapon-master-2024", "Weapon Master", "Bir silah için Weapon Mastery kullanımını açar.", ["STR veya DEX artışı", "Bir weapon mastery seçimi"], ["str", "dex"], { choiceType: "weapon-mastery", choiceCount: 1 }),

  style("archery-style-2024", "Archery", "Ranged weapon attack isabetini geliştirir.", ["Ranged attack roll bonus"]),
  style("blind-fighting-style-2024", "Blind Fighting", "Yakın çevrede görüş olmadan hedef algılamayı sağlar.", ["Blindsight 10 ft."]),
  style("defense-style-2024", "Defense", "Armor giyerken Armor Class değerini yükseltir.", ["Armor giyerken AC bonusu"]),
  style("dueling-style-2024", "Dueling", "Tek elle kullanılan melee weapon hasarını yükseltir.", ["One-handed melee damage bonus"]),
  style("great-weapon-fighting-style-2024", "Great Weapon Fighting", "İki elle kullanılan silahların düşük hasar zarlarını iyileştirir.", ["Two-handed damage floor"]),
  style("interception-style-2024", "Interception", "Yakındaki müttefike gelen hasarı reaction ile azaltır.", ["Reaction damage reduction"]),
  style("protection-style-2024", "Protection", "Shield ile yakındaki müttefike gelen saldırıyı zorlaştırır.", ["Reaction attack disadvantage"]),
  style("thrown-weapon-fighting-style-2024", "Thrown Weapon Fighting", "Thrown weapon çekme ve hasar akışını geliştirir.", ["Thrown weapon damage bonus"]),
  style("two-weapon-fighting-style-2024", "Two-Weapon Fighting", "Light weapon ek saldırısına ability modifier ekler.", ["Extra Light attack damage modifier"]),
  style("unarmed-fighting-style-2024", "Unarmed Fighting", "Unarmed Strike hasarını ve grapple baskısını geliştirir.", ["Unarmed damage die", "Grapple damage"]),

  boon("boon-dimensional-travel-2024", "Boon of Dimensional Travel", "Magic eyleminden sonra kısa mesafe teleport sağlar.", ["Ability artışı", "Magic sonrası teleport"], ["str", "dex", "con", "int", "wis", "cha"]),
  boon("boon-energy-resistance-2024", "Boon of Energy Resistance", "İki enerji hasarına direnç ve yönlendirme sağlar.", ["Ability artışı", "İki damage resistance", "Energy redirection"], ["con", "int", "wis", "cha"]),
  boon("boon-fate-2024", "Boon of Fate", "Yakındaki d20 testlerini sınırlı bir zarla değiştirebilir.", ["Ability artışı", "Fate die"], ["str", "dex", "con", "int", "wis", "cha"]),
  boon("boon-irresistible-offense-2024", "Boon of Irresistible Offense", "Fiziksel dirençleri aşar ve kritik vuruşu güçlendirir.", ["STR veya DEX artışı", "Resistance bypass", "Critical bonus damage"], ["str", "dex"]),
  boon("boon-night-spirit-2024", "Boon of the Night Spirit", "Loş ışık ve karanlıkta görünmezlik ve direnç sağlar.", ["Ability artışı", "Shadow invisibility", "Shadow resistance"], ["str", "dex", "con", "int", "wis", "cha"]),
  boon("boon-recovery-2024", "Boon of Recovery", "Maximum HP ve acil iyileşme sağlar.", ["Ability artışı", "Maximum HP artışı", "Emergency recovery"], ["con", "wis", "cha"]),
  boon("boon-skill-2024", "Boon of Skill", "Bütün skill alanlarında proficiency ve seçili skilllerde expertise sağlar.", ["Ability artışı", "All skill proficiency", "Expertise selections"], ["str", "dex", "con", "int", "wis", "cha"], { choiceType: "skills", choiceCount: 3 }),
  boon("boon-speed-2024", "Boon of Speed", "Hareket hızını ve kaçış hareketini olağanüstü geliştirir.", ["Ability artışı", "Speed increase", "Disengage mobility"], ["dex", "con"]),
  boon("boon-spell-recall-2024", "Boon of Spell Recall", "Düşük seviyeli spell slotlarını zaman zaman harcamadan kullanmayı sağlar.", ["INT, WIS veya CHA artışı", "Free spell-slot chance"], ["int", "wis", "cha"], { prerequisite: { minimumLevel: 19, spellcasting: true } }),
  boon("boon-truesight-2024", "Boon of Truesight", "Kalıcı kısa menzilli Truesight kazandırır.", ["Ability artışı", "Truesight 60 ft."], ["str", "dex", "con", "int", "wis", "cha"]),
];
